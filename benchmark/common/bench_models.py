from __future__ import annotations

import random
from typing import Any

from common.enums.loss_function_type import LossFunctionType
from common.enums.optimizer_type import OptimizerType
from common.enums.task_type import TaskType
from feature.model.builder.model_sanity_checker import ModelSanityChecker
from feature.model.builder.synapse_model_builder import SynapseModelBuilder
from feature.model.parser.model_ir_parser import ModelIRParser
from feature.model.registry.encoder_registry import ENCODER_REGISTRY
from feature.model.registry.neuron_registry import NEURON_REGISTRY
from feature.model.validation.model_validator import ModelValidator
from feature.training.registry.loss_registry import LOSS_REGISTRY
from feature.training.registry.optimizer_registry import OPTIMIZER_REGISTRY

from .runtime_bootstrap import PROJECT_ROOT  # noqa: F401

SAFE_NEURON_TYPES = sorted(NEURON_REGISTRY.keys())


def build_three_layer_lif_model_ir(
    *,
    timesteps: int = 16,
    hidden_sizes: tuple[int, int] = (256, 128),
    output_size: int = 10,
    tau: float = 2.0,
    threshold: float = 1.0,
) -> dict[str, Any]:
    return {
        "simulation": {"timesteps": timesteps},
        "encoder": {"type": "poisson"},
        "surrogate": {"type": "atan", "alpha": 2.0},
        "layers": [
            {"type": "Flatten"},
            {
                "type": "Linear",
                "out_features": hidden_sizes[0],
                "neuron": {
                    "type": "LIF",
                    "tau": tau,
                    "v_threshold": threshold,
                    "detach_reset": True,
                },
            },
            {
                "type": "Linear",
                "out_features": hidden_sizes[1],
                "neuron": {
                    "type": "LIF",
                    "tau": tau,
                    "v_threshold": threshold,
                    "detach_reset": True,
                },
            },
            {
                "type": "Linear",
                "out_features": output_size,
                "neuron": {
                    "type": "LIF",
                    "tau": tau,
                    "v_threshold": threshold,
                    "detach_reset": True,
                },
            },
        ],
    }


def build_runtime_model(
    model_ir_dict: dict[str, Any],
    *,
    input_shape: str,
    output_shape: str,
    task_type: TaskType = TaskType.CLASSIFICATION,
):
    model_ir = ModelIRParser.parse(model_ir_dict)
    ModelValidator.validate(model_ir)
    model = SynapseModelBuilder().build(model_ir=model_ir, input_shape=input_shape)
    sanity = ModelSanityChecker().validate(
        model=model, output_shape=output_shape, task_type=task_type
    )
    if not sanity.valid:
        raise ValueError("; ".join(sanity.errors))
    return model, model_ir


def create_optimizer_and_loss(
    model,
    *,
    learning_rate: float,
    optimizer_type: OptimizerType = OptimizerType.ADAM,
    loss_type: LossFunctionType = LossFunctionType.CROSS_ENTROPY,
):
    optimizer = OPTIMIZER_REGISTRY[optimizer_type](model.parameters(), lr=learning_rate)
    loss_fn = LOSS_REGISTRY[loss_type]()
    return optimizer, loss_fn


def exhaustive_graph_correctness_cases(
    *,
    timesteps: int = 8,
    num_classes: int = 10,
) -> list[dict[str, Any]]:
    structures = _graph_structures(num_classes=num_classes)
    cases: list[dict[str, Any]] = []

    for encoder in build_encoder_variants(timesteps=timesteps):
        encoder_label = describe_encoder(encoder)
        for neuron_type in sorted(NEURON_REGISTRY.keys()):
            for structure in structures:
                layers = []
                for layer in structure["layers"]:
                    layer_copy = dict(layer)
                    if layer_copy["type"] in {"Conv1D", "Conv2D", "Conv3D", "Linear"}:
                        layer_copy["neuron"] = canonical_neuron_config(neuron_type)
                    layers.append(layer_copy)

                cases.append(
                    {
                        "case_id": (
                            f"{structure['name']}__{encoder_label}__{neuron_type}"
                        ),
                        "structure": structure["name"],
                        "encoder_label": encoder_label,
                        "encoder_type": encoder["type"],
                        "encoder": encoder,
                        "neuron_type": neuron_type,
                        "layers_covered": structure["layers_covered"],
                        "input_shape": structure["input_shape"],
                        "num_classes": num_classes,
                        "model_ir": {
                            "simulation": {"timesteps": timesteps},
                            "encoder": encoder,
                            "surrogate": {"type": "atan", "alpha": 2.0},
                            "layers": layers,
                        },
                    }
                )

    return cases


def build_encoder_variants(*, timesteps: int) -> list[dict[str, Any]]:
    variants: list[dict[str, Any]] = []

    if "poisson" in ENCODER_REGISTRY:
        variants.append({"type": "poisson"})

    if "latency" in ENCODER_REGISTRY:
        variants.append(
            {
                "type": "latency",
                "T": timesteps,
                "function_type": "linear",
            }
        )
        variants.append(
            {
                "type": "latency",
                "T": timesteps,
                "function_type": "log",
            }
        )

    return variants


def describe_encoder(encoder: dict[str, Any]) -> str:
    if encoder["type"] != "latency":
        return encoder["type"]
    return f"latency:{encoder['function_type']}"


def random_valid_model_ir(
    rng: random.Random, *, timesteps: int = 8, num_classes: int = 10
) -> dict[str, Any]:
    layers: list[dict[str, Any]] = []
    height, width = 28, 28

    conv_blocks = rng.randint(0, 2)
    for _ in range(conv_blocks):
        out_channels = rng.choice([4, 8, 16, 32])
        kernel_size = rng.choice([3, 5])
        padding = kernel_size // 2
        layers.append(
            {
                "type": "Conv2D",
                "out_channels": out_channels,
                "kernel_size": kernel_size,
                "stride": 1,
                "padding": padding,
                "bias": True,
                "neuron": random_neuron_config(rng),
            }
        )
        if rng.random() < 0.6:
            layers.append({"type": "BatchNorm2D"})

        if rng.random() < 0.6 and min(height, width) >= 8:
            pool_type = rng.choice(["MaxPool2D", "AvgPool2D"])
            layers.append({"type": pool_type, "kernel_size": 2, "stride": 2})
            height //= 2
            width //= 2

        if rng.random() < 0.5:
            layers.append({"type": "Dropout", "p": round(rng.uniform(0.1, 0.5), 2)})

    layers.append({"type": "Flatten"})

    linear_depth = rng.randint(1, 3)
    hidden_sizes = [
        rng.choice([32, 64, 128, 256]) for _ in range(max(0, linear_depth - 1))
    ]

    for hidden_size in hidden_sizes:
        layers.append(
            {
                "type": "Linear",
                "out_features": hidden_size,
                "bias": True,
                "neuron": random_neuron_config(rng),
            }
        )

    layers.append(
        {
            "type": "Linear",
            "out_features": num_classes,
            "bias": True,
            "neuron": random_neuron_config(rng),
        }
    )

    return {
        "simulation": {"timesteps": timesteps},
        "encoder": {"type": "poisson"},
        "surrogate": random_surrogate_config(rng),
        "layers": layers,
    }


def canonical_neuron_config(neuron_type: str) -> dict[str, Any]:
    base: dict[str, Any] = {
        "type": neuron_type,
        "v_threshold": 1.0,
        "v_reset": 0.0,
        "detach_reset": True,
    }

    if neuron_type == "IF":
        return base

    if neuron_type == "LIF":
        return {
            **base,
            "tau": 2.5,
            "decay_input": True,
        }

    if neuron_type == "PLIF":
        return {
            **base,
            "init_tau": 2.5,
            "decay_input": True,
        }

    if neuron_type == "EIF":
        return {
            **base,
            "tau": 2.5,
            "delta_T": 1.2,
            "theta_rh": 1.0,
            "v_rest": 0.0,
        }

    if neuron_type == "KLIF":
        return {
            **base,
            "tau": 2.5,
            "scale_reset": True,
        }

    if neuron_type == "QIF":
        return {
            **base,
            "tau": 2.5,
            "v_c": 1.0,
            "a0": 1.0,
            "v_rest": 0.0,
        }

    if neuron_type == "LIAF":
        return {
            **base,
            "tau": 2.5,
            "threshold_related": True,
        }

    raise ValueError(f"Unsupported neuron type: {neuron_type}")


def random_neuron_config(rng: random.Random) -> dict[str, Any]:
    neuron_type = rng.choice(SAFE_NEURON_TYPES)
    base: dict[str, Any] = {
        "type": neuron_type,
        "v_threshold": round(rng.uniform(0.8, 1.4), 3),
        "detach_reset": True,
    }

    if neuron_type == "IF":
        return base
    if neuron_type == "PLIF":
        return {
            **base,
            "init_tau": round(rng.uniform(2.0, 4.0), 3),
            "decay_input": True,
        }
    if neuron_type == "EIF":
        return {
            **base,
            "tau": round(rng.uniform(2.0, 4.0), 3),
            "delta_T": round(rng.uniform(1.0, 2.0), 3),
            "theta_rh": round(rng.uniform(0.8, 1.5), 3),
            "v_reset": 0.0,
            "v_rest": 0.0,
        }
    if neuron_type == "KLIF":
        return {
            **base,
            "tau": round(rng.uniform(2.0, 4.0), 3),
            "scale_reset": rng.choice([True, False]),
        }
    if neuron_type == "QIF":
        return {
            **base,
            "tau": round(rng.uniform(2.0, 4.0), 3),
            "v_c": round(rng.uniform(0.5, 1.5), 3),
            "a0": round(rng.uniform(0.8, 1.5), 3),
            "v_reset": 0.0,
            "v_rest": 0.0,
        }
    if neuron_type == "LIAF":
        return {
            **base,
            "tau": round(rng.uniform(2.0, 4.0), 3),
            "threshold_related": rng.choice([True, False]),
        }

    return {
        **base,
        "tau": round(rng.uniform(2.0, 4.0), 3),
        "decay_input": rng.choice([True, False]),
    }


def random_surrogate_config(rng: random.Random) -> dict[str, Any]:
    surrogate_type = rng.choice(
        ["atan", "sigmoid", "piecewise_quadratic", "softsign", "leaky_k_relu"]
    )
    if surrogate_type == "leaky_k_relu":
        return {
            "type": surrogate_type,
            "leak": round(rng.uniform(0.01, 0.2), 3),
            "k": round(rng.uniform(0.5, 2.0), 3),
        }
    return {"type": surrogate_type, "alpha": round(rng.uniform(1.0, 3.0), 3)}


def _graph_structures(*, num_classes: int) -> list[dict[str, Any]]:
    return [
        {
            "name": "dense_batchnorm1d",
            "input_shape": (1, 28, 28),
            "layers_covered": ["Flatten", "Linear", "BatchNorm1D", "Dropout"],
            "layers": [
                {"type": "Flatten"},
                {"type": "Linear", "out_features": 128, "bias": True},
                {"type": "BatchNorm1D"},
                {"type": "Dropout", "p": 0.2},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
        {
            "name": "conv1d_maxpool",
            "input_shape": (1, 32),
            "layers_covered": [
                "Conv1D",
                "BatchNorm1D",
                "MaxPool1D",
                "Flatten",
                "Linear",
                "Dropout",
            ],
            "layers": [
                {
                    "type": "Conv1D",
                    "out_channels": 4,
                    "kernel_size": 3,
                    "stride": 1,
                    "padding": 1,
                    "bias": True,
                },
                {"type": "BatchNorm1D"},
                {"type": "MaxPool1D", "kernel_size": 2, "stride": 2},
                {"type": "Dropout", "p": 0.1},
                {"type": "Flatten"},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
        {
            "name": "conv1d_avgpool",
            "input_shape": (1, 32),
            "layers_covered": [
                "Conv1D",
                "BatchNorm1D",
                "AvgPool1D",
                "Flatten",
                "Linear",
                "Dropout",
            ],
            "layers": [
                {
                    "type": "Conv1D",
                    "out_channels": 4,
                    "kernel_size": 3,
                    "stride": 1,
                    "padding": 1,
                    "bias": True,
                },
                {"type": "BatchNorm1D"},
                {"type": "AvgPool1D", "kernel_size": 2, "stride": 2},
                {"type": "Dropout", "p": 0.1},
                {"type": "Flatten"},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
        {
            "name": "conv2d_maxpool",
            "input_shape": (1, 28, 28),
            "layers_covered": [
                "Conv2D",
                "BatchNorm2D",
                "MaxPool2D",
                "Flatten",
                "Linear",
                "Dropout",
            ],
            "layers": [
                {
                    "type": "Conv2D",
                    "out_channels": 8,
                    "kernel_size": 3,
                    "stride": 1,
                    "padding": 1,
                    "bias": True,
                },
                {"type": "BatchNorm2D"},
                {"type": "MaxPool2D", "kernel_size": 2, "stride": 2},
                {"type": "Dropout", "p": 0.1},
                {"type": "Flatten"},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
        {
            "name": "conv2d_avgpool",
            "input_shape": (1, 28, 28),
            "layers_covered": [
                "Conv2D",
                "BatchNorm2D",
                "AvgPool2D",
                "Flatten",
                "Linear",
                "Dropout",
            ],
            "layers": [
                {
                    "type": "Conv2D",
                    "out_channels": 8,
                    "kernel_size": 3,
                    "stride": 1,
                    "padding": 1,
                    "bias": True,
                },
                {"type": "BatchNorm2D"},
                {"type": "AvgPool2D", "kernel_size": 2, "stride": 2},
                {"type": "Dropout", "p": 0.1},
                {"type": "Flatten"},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
        {
            "name": "conv3d_maxpool",
            "input_shape": (1, 8, 8, 8),
            "layers_covered": [
                "Conv3D",
                "BatchNorm3D",
                "MaxPool3D",
                "Flatten",
                "Linear",
                "Dropout",
            ],
            "layers": [
                {
                    "type": "Conv3D",
                    "out_channels": 4,
                    "kernel_size": 3,
                    "stride": 1,
                    "padding": 1,
                    "bias": True,
                },
                {"type": "BatchNorm3D"},
                {"type": "MaxPool3D", "kernel_size": 2, "stride": 2},
                {"type": "Dropout", "p": 0.1},
                {"type": "Flatten"},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
        {
            "name": "conv3d_avgpool",
            "input_shape": (1, 8, 8, 8),
            "layers_covered": [
                "Conv3D",
                "BatchNorm3D",
                "AvgPool3D",
                "Flatten",
                "Linear",
                "Dropout",
            ],
            "layers": [
                {
                    "type": "Conv3D",
                    "out_channels": 4,
                    "kernel_size": 3,
                    "stride": 1,
                    "padding": 1,
                    "bias": True,
                },
                {"type": "BatchNorm3D"},
                {"type": "AvgPool3D", "kernel_size": 2, "stride": 2},
                {"type": "Dropout", "p": 0.1},
                {"type": "Flatten"},
                {"type": "Linear", "out_features": num_classes, "bias": True},
            ],
        },
    ]
