from __future__ import annotations

import argparse
import random
import time

import torch
from common.enums.task_type import TaskType
from feature.model.parser.model_ir_parser import ModelIRParser
from feature.model.registry.encoder_registry import ENCODER_REGISTRY
from feature.model.registry.layer_registry import LAYER_REGISTRY
from feature.model.registry.neuron_registry import NEURON_REGISTRY
from feature.model.validation.model_validator import ModelValidator
from torch.utils.data import DataLoader, TensorDataset

from benchmark.common.bench_models import (
    create_optimizer_and_loss,
    exhaustive_graph_correctness_cases,
)
from benchmark.common.io import result_directory, write_json
from benchmark.common.runtime_bootstrap import PROJECT_ROOT  # noqa: F401


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark exhaustive graph correctness across runtime-supported IR components."
    )
    parser.add_argument(
        "--graphs",
        type=int,
        default=0,
        help="Maximum number of generated cases to run. 0 runs the full exhaustive suite.",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--timesteps", type=int, default=8)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    output_dir = result_directory("graph_correctness")

    cases = exhaustive_graph_correctness_cases(timesteps=args.timesteps)
    if args.graphs > 0:
        rng.shuffle(cases)
        cases = cases[: args.graphs]

    results = {
        "parse_ok": 0,
        "validate_ok": 0,
        "build_ok": 0,
        "sanity_ok": 0,
        "train_ok": 0,
        "success": 0,
    }
    failures: list[dict] = []
    generation_times_ms: list[float] = []

    component_stats = {
        "encoder": {},
        "neuron": {},
        "layer": {},
        "structure": {},
    }

    tested_layer_set: set[str] = set()
    tested_neuron_set: set[str] = set()
    tested_encoder_type_set: set[str] = set()
    tested_encoder_variant_set: set[str] = set()

    for case_index, case in enumerate(cases):
        model_ir_dict = case["model_ir"]
        x, y = build_case_batch(case, batch_size=args.batch_size)
        success = False

        register_case_attempt(component_stats, case)
        tested_layer_set.update(case["layers_covered"])
        tested_neuron_set.add(case["neuron_type"])
        tested_encoder_type_set.add(case["encoder_type"])
        tested_encoder_variant_set.add(case["encoder_label"])

        try:
            started = time.perf_counter()
            model_ir = ModelIRParser.parse(model_ir_dict)
            results["parse_ok"] += 1

            ModelValidator.validate(model_ir)
            results["validate_ok"] += 1

            model = build_model(model_ir=model_ir, input_shape=x)
            results["build_ok"] += 1
            generation_times_ms.append((time.perf_counter() - started) * 1000.0)

            validate_model_output(model=model, output=y)
            results["sanity_ok"] += 1

            dataset = TensorDataset(x, y)
            loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False)
            optimizer, loss_fn = create_optimizer_and_loss(
                model, learning_rate=args.learning_rate
            )

            batch_x, batch_y = next(iter(loader))
            optimizer.zero_grad()
            output, _ = model(batch_x)
            loss = loss_fn(output, batch_y)
            if not torch.isfinite(loss).item():
                raise ValueError("Non-finite loss")
            loss.backward()

            grads = [
                parameter.grad
                for parameter in model.parameters()
                if parameter.requires_grad
            ]
            finite_grads = [
                grad
                for grad in grads
                if grad is not None and torch.isfinite(grad).all().item()
            ]
            if not finite_grads:
                raise ValueError("No finite gradients produced")

            optimizer.step()
            model.reset_state()
            results["train_ok"] += 1
            results["success"] += 1
            success = True
        except Exception as exc:  # noqa: BLE001
            failures.append(
                {
                    "case_index": case_index,
                    "case_id": case["case_id"],
                    "structure": case["structure"],
                    "encoder": case["encoder_label"],
                    "neuron": case["neuron_type"],
                    "layers": case["layers_covered"],
                    "error": str(exc),
                    "model_ir": model_ir_dict,
                }
            )
        finally:
            register_case_result(component_stats, case, success=success)

    report = {
        "benchmark": "graph_correctness",
        "parameters": vars(args),
        "total_cases": len(cases),
        "stage_counts": results,
        "success_rate_pct": (results["success"] / len(cases) * 100.0) if cases else 0.0,
        "average_generation_time_ms": (
            sum(generation_times_ms) / len(generation_times_ms)
        )
        if generation_times_ms
        else 0.0,
        "coverage": {
            "layers_tested": sorted(tested_layer_set),
            "missing_layers": sorted(set(LAYER_REGISTRY.keys()) - tested_layer_set),
            "neurons_tested": sorted(tested_neuron_set),
            "missing_neurons": sorted(set(NEURON_REGISTRY.keys()) - tested_neuron_set),
            "encoder_types_tested": sorted(tested_encoder_type_set),
            "missing_encoder_types": sorted(
                set(ENCODER_REGISTRY.keys()) - tested_encoder_type_set
            ),
            "encoder_variants_tested": sorted(tested_encoder_variant_set),
        },
        "case_breakdown": component_stats,
        "failures": failures[:50],
    }
    write_json(output_dir / "summary.json", report)
    print(f"Saved benchmark summary to {output_dir / 'summary.json'}")


def build_case_batch(
    case: dict, *, batch_size: int
) -> tuple[torch.Tensor, torch.Tensor]:
    input_shape = case["input_shape"]
    num_classes = case["num_classes"]
    x = torch.rand(batch_size, *input_shape)
    y = torch.randint(0, num_classes, (batch_size,))
    return x, y


def build_model(*, model_ir, input_shape: torch.Tensor):
    from feature.model.builder.synapse_model_builder import SynapseModelBuilder

    return SynapseModelBuilder().build(
        model_ir=model_ir,
        input_shape=str(list(input_shape.shape)),
    )


def validate_model_output(*, model, output: torch.Tensor) -> None:
    from feature.model.builder.model_sanity_checker import ModelSanityChecker

    sanity = ModelSanityChecker().validate(
        model=model,
        output_shape=str(list(output.shape)),
        task_type=TaskType.CLASSIFICATION,
    )
    if not sanity.valid:
        raise ValueError("; ".join(sanity.errors))


def register_case_attempt(component_stats: dict, case: dict) -> None:
    _increment(component_stats["encoder"], case["encoder_label"], "cases")
    _increment(component_stats["neuron"], case["neuron_type"], "cases")
    _increment(component_stats["structure"], case["structure"], "cases")
    for layer_name in case["layers_covered"]:
        _increment(component_stats["layer"], layer_name, "cases")


def register_case_result(component_stats: dict, case: dict, *, success: bool) -> None:
    if not success:
        return

    _increment(component_stats["encoder"], case["encoder_label"], "success")
    _increment(component_stats["neuron"], case["neuron_type"], "success")
    _increment(component_stats["structure"], case["structure"], "success")
    for layer_name in case["layers_covered"]:
        _increment(component_stats["layer"], layer_name, "success")


def _increment(bucket: dict, key: str, field: str) -> None:
    bucket.setdefault(key, {"cases": 0, "success": 0})
    bucket[key][field] += 1


if __name__ == "__main__":
    main()
