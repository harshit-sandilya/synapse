from __future__ import annotations

import argparse

from benchmark.common.bench_models import (
    build_runtime_model,
    build_three_layer_lif_model_ir,
    create_optimizer_and_loss,
)
from benchmark.common.bench_training import run_training_steps, seed_everything
from benchmark.common.data import create_mnist_loaders
from benchmark.common.io import mean_std, result_directory, write_json
from benchmark.common.runtime_bootstrap import PROJECT_ROOT  # noqa: F401

CHANCE_ACCURACY = 0.10
TELEMETRY_DEAD_THRESHOLD = 0.80
TELEMETRY_FIRING_THRESHOLD = 0.01
TELEMETRY_CONSECUTIVE_STEPS = 3
CONVENTIONAL_CONSECUTIVE_STEPS = 5
CONVENTIONAL_ACCURACY_DECAY = 0.70
CONVENTIONAL_LOSS_GROWTH = 1.20


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark SNN failure detection speed."
    )
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--steps", type=int, default=120)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--train-samples", type=int, default=4096)
    parser.add_argument("--test-samples", type=int, default=256)
    parser.add_argument("--timesteps", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--collapse-step", type=int, default=40)
    parser.add_argument("--collapse-threshold", type=float, default=100.0)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    output_dir = result_directory("failure_detection_speed")
    run_reports: list[dict] = []
    earlier_steps: list[float] = []

    for run_index in range(args.runs):
        run_seed = args.seed + run_index
        seed_everything(run_seed)
        train_loader, _ = create_mnist_loaders(
            batch_size=args.batch_size,
            train_samples=args.train_samples,
            test_samples=args.test_samples,
            seed=run_seed,
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

        result = run_training_steps(
            model=model,
            optimizer=optimizer,
            loss_fn=loss_fn,
            loader=train_loader,
            total_steps=args.steps,
            warmup_steps=0,
            telemetry_logger=None,
            collect_telemetry=True,
            capture_raw_telemetry=False,
            reduce_telemetry=True,
            collapse_step=args.collapse_step,
            collapse_threshold=args.collapse_threshold,
        )

        telemetry_step = detect_telemetry_failure(
            result["reduced_telemetry"], args.collapse_step
        )
        conventional_step = detect_conventional_failure(
            result["losses"],
            result["accuracies"],
            args.collapse_step,
        )
        delta = None
        if telemetry_step is not None and conventional_step is not None:
            delta = conventional_step - telemetry_step
            earlier_steps.append(delta)

        run_reports.append(
            {
                "run": run_index + 1,
                "seed": run_seed,
                "telemetry_failure_step": telemetry_step,
                "conventional_failure_step": conventional_step,
                "telemetry_earlier_by_steps": delta,
            }
        )

    mean_delta, std_delta = mean_std([float(value) for value in earlier_steps])
    report = {
        "benchmark": "failure_detection_speed",
        "parameters": vars(args),
        "thresholds": {
            "telemetry_dead_threshold": TELEMETRY_DEAD_THRESHOLD,
            "telemetry_firing_threshold": TELEMETRY_FIRING_THRESHOLD,
            "telemetry_consecutive_steps": TELEMETRY_CONSECUTIVE_STEPS,
            "conventional_consecutive_steps": CONVENTIONAL_CONSECUTIVE_STEPS,
            "conventional_accuracy_decay": CONVENTIONAL_ACCURACY_DECAY,
            "conventional_loss_growth": CONVENTIONAL_LOSS_GROWTH,
        },
        "runs": run_reports,
        "mean_telemetry_earlier_by_steps": mean_delta,
        "std_telemetry_earlier_by_steps": std_delta,
    }
    write_json(output_dir / "summary.json", report)
    print(f"Saved benchmark summary to {output_dir / 'summary.json'}")


def detect_telemetry_failure(reduced_telemetry, collapse_step: int) -> int | None:
    consecutive = 0
    for step_index, telemetry in enumerate(reduced_telemetry):
        if step_index < collapse_step:
            continue
        if not telemetry.layers:
            continue

        mean_dead = sum(layer.dead_neuron_ratio for layer in telemetry.layers) / len(
            telemetry.layers
        )
        mean_firing = sum(layer.firing_rate for layer in telemetry.layers) / len(
            telemetry.layers
        )
        triggered = (
            mean_dead >= TELEMETRY_DEAD_THRESHOLD
            or mean_firing <= TELEMETRY_FIRING_THRESHOLD
        )
        consecutive = consecutive + 1 if triggered else 0
        if consecutive >= TELEMETRY_CONSECUTIVE_STEPS:
            return step_index
    return None


def detect_conventional_failure(
    losses: list[float], accuracies: list[float], collapse_step: int
) -> int | None:
    pre_losses = losses[max(0, collapse_step - 10) : collapse_step]
    pre_accuracies = accuracies[max(0, collapse_step - 10) : collapse_step]
    baseline_loss = sum(pre_losses) / len(pre_losses) if pre_losses else losses[0]
    baseline_accuracy = (
        sum(pre_accuracies) / len(pre_accuracies) if pre_accuracies else accuracies[0]
    )
    accuracy_threshold = max(
        CHANCE_ACCURACY + 0.05, baseline_accuracy * CONVENTIONAL_ACCURACY_DECAY
    )
    loss_threshold = baseline_loss * CONVENTIONAL_LOSS_GROWTH

    consecutive = 0
    for step_index in range(collapse_step, len(losses)):
        degraded = (
            accuracies[step_index] <= accuracy_threshold
            or losses[step_index] >= loss_threshold
        )
        consecutive = consecutive + 1 if degraded else 0
        if consecutive >= CONVENTIONAL_CONSECUTIVE_STEPS:
            return step_index
    return None


if __name__ == "__main__":
    main()
