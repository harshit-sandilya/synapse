from __future__ import annotations

import argparse
import json
import os
import threading
import time
from dataclasses import dataclass
from urllib.parse import urlparse, urlunparse

import redis

from benchmark.common.bench_api import BenchmarkApiClient
from benchmark.common.io import percentile, result_directory, write_json


@dataclass
class ObservedTelemetry:
    sequence_id: int
    emitted_at_ms: float
    observed_at_ms: float


class RedisTelemetryCollector(threading.Thread):
    def __init__(
        self,
        *,
        experiment_id: str,
        redis_url: str,
        topic: str,
        poll_interval_seconds: float = 0.02,
    ):
        super().__init__(daemon=True)
        self.experiment_id = experiment_id
        self.redis_url = redis_url
        self.topic = topic
        self.poll_interval_seconds = poll_interval_seconds
        self.stop_event = threading.Event()
        self.events: dict[int, ObservedTelemetry] = {}
        self.errors: list[str] = []

    def run(self) -> None:
        client = None
        last_payload: str | bytes | None = None
        try:
            client = redis.Redis.from_url(self.redis_url, decode_responses=True)
            while not self.stop_event.is_set():
                raw_payload = client.get(self.topic)
                if raw_payload and raw_payload != last_payload:
                    last_payload = raw_payload
                    payload_text = (
                        raw_payload.decode("utf-8")
                        if isinstance(raw_payload, bytes)
                        else raw_payload
                    )
                    self._record(payload_text, time.time() * 1000.0)
                time.sleep(self.poll_interval_seconds)
        except Exception as exc:  # noqa: BLE001
            self.errors.append(str(exc))
        finally:
            if client is not None:
                try:
                    client.close()
                except Exception:
                    pass

    def stop(self) -> None:
        self.stop_event.set()

    def _record(self, raw_payload: str, observed_at_ms: float) -> None:
        payload = json.loads(raw_payload)
        sequence_id = payload.get("sequence_id")
        emitted_at_ms = payload.get("emitted_at_ms")
        if sequence_id is None or emitted_at_ms is None:
            return

        self.events[int(sequence_id)] = ObservedTelemetry(
            sequence_id=int(sequence_id),
            emitted_at_ms=float(emitted_at_ms),
            observed_at_ms=observed_at_ms,
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark transport-ready latency and Redis telemetry queue latency from script mode."
    )
    parser.add_argument("--levels", type=str, default="1,3")
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--timesteps", type=int, default=8)
    parser.add_argument("--workspace-name", type=str, default="benchmark-workspace")
    parser.add_argument("--username", type=str, default="benchmark-bot")
    parser.add_argument("--redis-poll-interval", type=float, default=0.02)
    parser.add_argument("--settle-seconds", type=float, default=2.0)
    args = parser.parse_args()

    client = BenchmarkApiClient()
    workspace = client.connect_workspace(args.workspace_name, args.username)
    workspace_id = workspace["workspaceId"]
    member_id = workspace["memberId"]

    output_dir = result_directory("event_pipeline_latency")
    concurrency_levels = [
        int(level.strip()) for level in args.levels.split(",") if level.strip()
    ]
    reports: list[dict] = []

    for concurrency in concurrency_levels:
        experiments = [
            client.prepare_training_experiment(
                workspace_id=workspace_id,
                member_id=member_id,
                batch_size=args.batch_size,
                epochs=args.epochs,
                timesteps=args.timesteps,
                name_prefix=f"latency-{concurrency}",
            )
            for _ in range(concurrency)
        ]

        training_started_at_ms: dict[str, float] = {}
        for experiment in experiments:
            experiment_id = experiment["experimentId"]
            training_started_at_ms[experiment_id] = time.time() * 1000.0
            client.run_training(experiment_id)

        ready_payloads, transport_ready_ms, telemetry_terminal = (
            wait_for_telemetry_ready_batch(
                client,
                experiment_ids=[
                    experiment["experimentId"] for experiment in experiments
                ],
                training_started_at_ms=training_started_at_ms,
            )
        )

        redis_collectors: dict[str, RedisTelemetryCollector] = {}
        resolved_redis_urls: dict[str, str] = {}

        for experiment in experiments:
            experiment_id = experiment["experimentId"]
            telemetry = ready_payloads.get(experiment_id)
            if not telemetry:
                continue

            redis_url = resolve_benchmark_redis_url(telemetry["publisherServiceUrl"])
            resolved_redis_urls[experiment_id] = redis_url
            redis_collectors[experiment_id] = RedisTelemetryCollector(
                experiment_id=experiment_id,
                redis_url=redis_url,
                topic=telemetry["publisherTopic"],
                poll_interval_seconds=args.redis_poll_interval,
            )

        for collector in redis_collectors.values():
            collector.start()

        statuses = []
        for experiment in experiments:
            statuses.append(
                client.wait_for_status(
                    experiment["experimentId"],
                    field="modelReady",
                    expected={"DONE", "FAILED"},
                )
            )

        time.sleep(args.settle_seconds)
        for collector in redis_collectors.values():
            collector.stop()
        for collector in redis_collectors.values():
            collector.join(timeout=2.0)

        queue_latencies: list[float] = []
        queue_event_count = 0
        errors: list[str] = []

        for experiment_id, collector in redis_collectors.items():
            queue_event_count += len(collector.events)
            queue_latencies.extend(
                [
                    event.observed_at_ms - event.emitted_at_ms
                    for event in collector.events.values()
                ]
            )
            errors.extend(
                [f"queue[{experiment_id}]: {error}" for error in collector.errors]
            )

        for experiment_id, payload in telemetry_terminal.items():
            status = payload.get("status")
            if status == "TIMEOUT":
                errors.append(
                    f"transport[{experiment_id}]: timed out waiting for telemetry publisher"
                )
            else:
                errors.append(
                    f"transport[{experiment_id}]: telemetry publisher not ready before terminal status {status}"
                )

        connected_experiment_ids = [
            experiment_id
            for experiment_id in [
                experiment["experimentId"] for experiment in experiments
            ]
            if experiment_id in ready_payloads
        ]

        reports.append(
            {
                "concurrency": concurrency,
                "experiment_ids": [
                    experiment["experimentId"] for experiment in experiments
                ],
                "connected_experiment_ids": connected_experiment_ids,
                "transport_not_ready_experiment_ids": sorted(
                    set(experiment["experimentId"] for experiment in experiments)
                    - set(connected_experiment_ids)
                ),
                "statuses": statuses,
                "telemetry_terminal": telemetry_terminal,
                "resolved_redis_urls": resolved_redis_urls,
                "event_count": queue_event_count,
                "queue_event_count": queue_event_count,
                "transport_sample_count": len(transport_ready_ms),
                "transport_p50_ms": percentile(list(transport_ready_ms.values()), 50.0),
                "transport_p95_ms": percentile(list(transport_ready_ms.values()), 95.0),
                "transport_p99_ms": percentile(list(transport_ready_ms.values()), 99.0),
                "transport_max_ms": max(transport_ready_ms.values())
                if transport_ready_ms
                else 0.0,
                "queue_p50_ms": percentile(queue_latencies, 50.0),
                "queue_p95_ms": percentile(queue_latencies, 95.0),
                "queue_p99_ms": percentile(queue_latencies, 99.0),
                "queue_max_ms": max(queue_latencies) if queue_latencies else 0.0,
                "queue_to_ready_p50_ms": percentile(
                    list(transport_ready_ms.values()), 50.0
                ),
                "queue_to_ready_p95_ms": percentile(
                    list(transport_ready_ms.values()), 95.0
                ),
                "p50_ms": percentile(queue_latencies, 50.0),
                "p95_ms": percentile(queue_latencies, 95.0),
                "p99_ms": percentile(queue_latencies, 99.0),
                "max_ms": max(queue_latencies) if queue_latencies else 0.0,
                "errors": errors,
            }
        )

    report = {
        "benchmark": "event_pipeline_latency",
        "parameters": vars(args),
        "results": reports,
    }
    write_json(output_dir / "summary.json", report)
    print(f"Saved benchmark summary to {output_dir / 'summary.json'}")


def wait_for_telemetry_ready_batch(
    client: BenchmarkApiClient,
    *,
    experiment_ids: list[str],
    training_started_at_ms: dict[str, float],
    timeout_seconds: float = 300.0,
    poll_interval_seconds: float = 0.5,
) -> tuple[dict[str, dict], dict[str, float], dict[str, dict]]:
    deadline = time.time() + timeout_seconds
    pending = set(experiment_ids)
    ready_payloads: dict[str, dict] = {}
    ready_ms: dict[str, float] = {}
    terminal_payloads: dict[str, dict] = {}

    while pending and time.time() < deadline:
        for experiment_id in list(pending):
            payload = client.experiment_telemetry(experiment_id)
            if payload.get("publisherServiceUrl") and payload.get("publisherTopic"):
                ready_payloads[experiment_id] = payload
                ready_ms[experiment_id] = (
                    time.time() * 1000.0
                ) - training_started_at_ms[experiment_id]
                pending.remove(experiment_id)
                continue

            status = payload.get("status")
            if status in {"DONE", "FAILED", "NOT_CONFIGURED"}:
                terminal_payloads[experiment_id] = payload
                pending.remove(experiment_id)

        if pending:
            time.sleep(poll_interval_seconds)

    for experiment_id in pending:
        terminal_payloads[experiment_id] = {"status": "TIMEOUT"}

    return ready_payloads, ready_ms, terminal_payloads


def resolve_benchmark_redis_url(redis_url: str) -> str:
    override_host = os.getenv("SYNAPSE_BENCHMARK_REDIS_HOST")
    parsed = urlparse(redis_url)

    scheme = parsed.scheme or "redis"
    host = parsed.hostname or "localhost"
    if override_host:
        host = override_host
    elif host in {"redis", "synapse-redis"}:
        host = "localhost"

    auth = ""
    if parsed.username:
        auth = parsed.username
        if parsed.password:
            auth += f":{parsed.password}"
        auth += "@"

    netloc = f"{auth}{host}"
    if parsed.port is not None:
        netloc = f"{netloc}:{parsed.port}"

    return urlunparse((scheme, netloc, parsed.path, "", parsed.query, ""))


if __name__ == "__main__":
    main()
