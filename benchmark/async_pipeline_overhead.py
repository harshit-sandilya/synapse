from __future__ import annotations

import argparse
import uuid

from benchmark.common.bench_loggers import (
    AsyncReducedRedisLogger,
    NoOpLogger,
    SyncFullTensorDiskLogger,
)
from benchmark.common.bench_models import (
    build_runtime_model,
    build_three_layer_lif_model_ir,
    create_optimizer_and_loss,
)
from benchmark.common.bench_training import run_training_steps, seed_everything
from benchmark.common.data import create_mnist_loaders
from benchmark.common.io import mean_std, result_directory, write_json
from benchmark.common.runtime_bootstrap import PROJECT_ROOT  # noqa: F401


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark async pipeline throughput overhead."
    )
    parser.add_argument("--trials", type=int, default=3)
    parser.add_argument("--warmup-steps", type=int, default=5)
    parser.add_argument("--measured-steps", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--train-samples", type=int, default=2048)
    parser.add_argument("--test-samples", type=int, default=256)
    parser.add_argument("--timesteps", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    output_dir = result_directory("async_pipeline_overhead")
    total_steps = args.warmup_steps + args.measured_steps

    conditions = {
        "baseline": {
            "collect_telemetry": False,
            "capture_raw_telemetry": False,
            "logger_factory": lambda trial_dir: NoOpLogger(),
        },
        "sync_full_tensor": {
            "collect_telemetry": True,
            "capture_raw_telemetry": True,
            "logger_factory": lambda trial_dir: SyncFullTensorDiskLogger(
                trial_dir / "sync_full_tensor"
            ),
        },
        "async_reduced_redis": {
            "collect_telemetry": True,
            "capture_raw_telemetry": False,
            "logger_factory": lambda trial_dir: AsyncReducedRedisLogger(
                topic=f"benchmark:telemetry:{uuid.uuid4().hex}"
            ),
        },
    }

    summaries: dict[str, dict] = {}

    for condition_name, condition in conditions.items():
        trial_steps_per_second: list[float] = []
        trial_wall_times: list[float] = []
        trial_records: list[dict] = []

        for trial_index in range(args.trials):
            trial_seed = args.seed + trial_index
            seed_everything(trial_seed)
            train_loader, _ = create_mnist_loaders(
                batch_size=args.batch_size,
                train_samples=args.train_samples,
                test_samples=args.test_samples,
                seed=trial_seed,
                num_workers=0,
            )
            model, _ = build_runtime_model(
                build_three_layer_lif_model_ir(timesteps=args.timesteps),
                input_shape=str([args.batch_size, 1, 28, 28]),
                output_shape=str([args.batch_size]),
            )
            optimizer, loss_fn = create_optimizer_and_loss(
                model, learning_rate=args.learning_rate
            )

            trial_dir = output_dir / condition_name / f"trial_{trial_index + 1}"
            logger = condition["logger_factory"](trial_dir)
            result = run_training_steps(
                model=model,
                optimizer=optimizer,
                loss_fn=loss_fn,
                loader=train_loader,
                total_steps=total_steps,
                warmup_steps=args.warmup_steps,
                telemetry_logger=logger,
                collect_telemetry=condition["collect_telemetry"],
                capture_raw_telemetry=condition["capture_raw_telemetry"],
            )

            trial_steps_per_second.append(result["steps_per_second"])
            trial_wall_times.append(result["wall_time_seconds"])
            trial_records.append(
                {
                    "trial": trial_index + 1,
                    "seed": trial_seed,
                    "steps_per_second": result["steps_per_second"],
                    "wall_time_seconds": result["wall_time_seconds"],
                }
            )

        mean_sps, std_sps = mean_std(trial_steps_per_second)
        mean_wall, std_wall = mean_std(trial_wall_times)
        summaries[condition_name] = {
            "trials": trial_records,
            "mean_steps_per_second": mean_sps,
            "std_steps_per_second": std_sps,
            "mean_wall_time_seconds": mean_wall,
            "std_wall_time_seconds": std_wall,
        }

    baseline = summaries["baseline"]["mean_steps_per_second"]
    async_speed = summaries["async_reduced_redis"]["mean_steps_per_second"]
    sync_speed = summaries["sync_full_tensor"]["mean_steps_per_second"]

    report = {
        "benchmark": "async_pipeline_overhead",
        "parameters": vars(args),
        "conditions": summaries,
        "retained_speed_pct": {
            "async_reduced_vs_baseline": (async_speed / baseline * 100.0)
            if baseline
            else 0.0,
            "sync_full_vs_baseline": (sync_speed / baseline * 100.0)
            if baseline
            else 0.0,
        },
    }

    write_json(output_dir / "summary.json", report)
    print(f"Saved benchmark summary to {output_dir / 'summary.json'}")


if __name__ == "__main__":
    main()
