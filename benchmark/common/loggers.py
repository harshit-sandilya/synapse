from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from feature.training.service.telemetry_publisher import TelemetryPublisher
from feature.training.service.telemetry_reducer import TelemetryReducer
from infrastructure.event.redis_event_publisher import RedisEventPublisher

from .runtime_bootstrap import PROJECT_ROOT  # noqa: F401


class NoOpLogger:
    def log(self, telemetry, step_index: int) -> None:
        return

    def close(self) -> None:
        return


class AsyncReducedRedisLogger:
    def __init__(self, topic: str):
        self.publisher = TelemetryPublisher(
            publisher=RedisEventPublisher(),
            topic=topic,
            mode="async",
        )

    def log(self, telemetry, step_index: int) -> None:
        self.publisher.publish(telemetry)

    def close(self) -> None:
        self.publisher.shutdown()


class SyncFullTensorDiskLogger:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def log(self, telemetry, step_index: int) -> None:
        if telemetry is None:
            return

        payload = {
            "step": step_index,
            "timestep": telemetry.timestep,
            "emitted_at_ms": telemetry.emitted_at_ms,
            "sequence_id": telemetry.sequence_id,
            "layers": [
                {
                    "layer_index": layer.layer_index,
                    "layer_name": layer.layer_name,
                    "threshold": layer.threshold,
                    "tau": layer.tau,
                    "spikes": _tensor_to_list(layer.raw_spikes),
                    "membrane_potentials": _tensor_to_list(
                        layer.raw_membrane_potentials
                    ),
                }
                for layer in telemetry.layers
            ],
        }
        (self.output_dir / f"step_{step_index:05d}.json").write_text(
            json.dumps(payload),
            encoding="utf-8",
        )

    def close(self) -> None:
        return


class HierarchicalDiskLogger:
    def __init__(self, output_dir: Path, summary_interval: int = 10):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.summary_interval = max(1, summary_interval)
        self.reducer = TelemetryReducer()
        self.scalar_path = self.output_dir / "scalars.jsonl"
        self.summary_path = self.output_dir / "summaries.jsonl"
        self.pending: list[dict[str, Any]] = []

    def log(self, telemetry, step_index: int) -> None:
        if telemetry is None:
            return

        reduced = self.reducer.reduce(telemetry)
        record = reduced.model_dump() | {"step": step_index}
        with self.scalar_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record))
            handle.write("\n")

        self.pending.append(record)
        if len(self.pending) >= self.summary_interval:
            self._flush_summary()

    def close(self) -> None:
        if self.pending:
            self._flush_summary()

    def _flush_summary(self) -> None:
        summary_layers = []
        first = self.pending[0]
        layer_count = len(first["layers"])

        for layer_index in range(layer_count):
            layer_records = [record["layers"][layer_index] for record in self.pending]
            summary_layers.append(
                {
                    "layer_index": layer_records[0]["layer_index"],
                    "layer_name": layer_records[0]["layer_name"],
                    "mean_firing_rate": _average(
                        [layer["firing_rate"] for layer in layer_records]
                    ),
                    "mean_sparsity": _average(
                        [layer["sparsity"] for layer in layer_records]
                    ),
                    "mean_dead_neuron_ratio": _average(
                        [layer["dead_neuron_ratio"] for layer in layer_records]
                    ),
                    "mean_membrane": _average(
                        [layer["mean_membrane"] for layer in layer_records]
                    ),
                }
            )

        payload = {
            "step_start": self.pending[0]["step"],
            "step_end": self.pending[-1]["step"],
            "layers": summary_layers,
        }
        with self.summary_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload))
            handle.write("\n")

        self.pending = []


class CompositeLogger:
    def __init__(self, *loggers):
        self.loggers = loggers

    def log(self, telemetry, step_index: int) -> None:
        for logger in self.loggers:
            logger.log(telemetry, step_index)

    def close(self) -> None:
        for logger in self.loggers:
            logger.close()


def _tensor_to_list(tensor):
    if tensor is None:
        return None
    return tensor.detach().cpu().tolist()


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0
