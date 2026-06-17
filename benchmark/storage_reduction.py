from __future__ import annotations

import argparse

from benchmark.common.bench_loggers import (
    CompositeLogger,
    HierarchicalDiskLogger,
    SyncFullTensorDiskLogger,
)
from benchmark.common.bench_models import (
    build_runtime_model,
    build_three_layer_lif_model_ir,
    create_optimizer_and_loss,
)
from benchmark.common.bench_training import run_training_steps, seed_everything
from benchmark.common.data import create_mnist_loaders
from benchmark.common.io import result_directory, sum_file_sizes, write_json
from benchmark.common.runtime_bootstrap import PROJECT_ROOT  # noqa: F401


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark hierarchical logging storage reduction."
    )
    parser.add_argument("--steps", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--train-samples", type=int, default=1024)
    parser.add_argument("--test-samples", type=int, default=256)
    parser.add_argument("--timesteps", type=int, default=16)
    parser.add_argument("--summary-interval", type=int, default=10)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    output_dir = result_directory("storage_reduction")
    full_dir = output_dir / "full_tensor_logging"
    hierarchical_dir = output_dir / "hierarchical_logging"

    seed_everything(args.seed)
    train_loader, _ = create_mnist_loaders(
        batch_size=args.batch_size,
        train_samples=args.train_samples,
        test_samples=args.test_samples,
        seed=args.seed,
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

    logger = CompositeLogger(
        SyncFullTensorDiskLogger(full_dir),
        HierarchicalDiskLogger(
            hierarchical_dir, summary_interval=args.summary_interval
        ),
    )

    run_training_steps(
        model=model,
        optimizer=optimizer,
        loss_fn=loss_fn,
        loader=train_loader,
        total_steps=args.steps,
        warmup_steps=0,
        telemetry_logger=logger,
        collect_telemetry=True,
        capture_raw_telemetry=True,
    )

    full_bytes = sum_file_sizes(full_dir)
    hierarchical_bytes = sum_file_sizes(hierarchical_dir)
    reduction_pct = (
        ((full_bytes - hierarchical_bytes) / full_bytes * 100.0) if full_bytes else 0.0
    )

    report = {
        "benchmark": "storage_reduction",
        "parameters": vars(args),
        "full_tensor_bytes": full_bytes,
        "hierarchical_bytes": hierarchical_bytes,
        "reduction_pct": reduction_pct,
        "size_ratio": (full_bytes / hierarchical_bytes) if hierarchical_bytes else None,
    }

    write_json(output_dir / "summary.json", report)
    print(f"Saved benchmark summary to {output_dir / 'summary.json'}")


if __name__ == "__main__":
    main()
