from __future__ import annotations

import random
from typing import Any

from feature.model.builder.model_sanity_checker import ModelSanityChecker
from feature.model.builder.synapse_model_builder import SynapseModelBuilder
from feature.model.parser.model_ir_parser import ModelIRParser
from feature.model.validation.model_validator import ModelValidator
from feature.training.registry.loss_registry import LOSS_REGISTRY
from feature.training.registry.optimizer_registry import OPTIMIZER_REGISTRY

from common.enums.loss_function_type import LossFunctionType
from common.enums.optimizer_type import OptimizerType
from common.enums.task_type import TaskType

from .runtime_bootstrap import PROJECT_ROOT  # noqa: F401

SAFE_NEURON_TYPES = ["IF", "LIF", "PLIF", "EIF", "KLIF", "QIF", "LIAF"]


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


def random_valid_model_ir(
    rng: random.Random, *, timesteps: int = 8, num_classes: int = 10
) -> dict[str, Any]:
    layers: list[dict[str, Any]] = []
    channels, height, width = 1, 28, 28

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
        channels = out_channels

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
        "encoder": {"type": rng.choice(["poisson", "latency"])},
        "surrogate": random_surrogate_config(rng),
        "layers": layers,
    }


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
