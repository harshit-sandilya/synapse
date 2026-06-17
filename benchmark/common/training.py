from __future__ import annotations

import random
import time
from typing import Any

import numpy as np
import torch
from feature.training.service.telemetry_reducer import TelemetryReducer
from spikingjelly.activation_based.neuron import BaseNode

from .runtime_bootstrap import PROJECT_ROOT  # noqa: F401


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def run_training_steps(
    *,
    model,
    optimizer,
    loss_fn,
    loader,
    total_steps: int,
    warmup_steps: int = 0,
    telemetry_logger=None,
    collect_telemetry: bool = False,
    capture_raw_telemetry: bool = False,
    reduce_telemetry: bool = False,
    collapse_step: int | None = None,
    collapse_threshold: float | None = None,
) -> dict[str, Any]:
    iterator = _cycle(loader)
    reducer = TelemetryReducer() if reduce_telemetry else None

    step_times: list[float] = []
    losses: list[float] = []
    accuracies: list[float] = []
    reduced_events = []

    model.train()
    model.reset_state()

    for step_index in range(total_steps):
        if (
            collapse_step is not None
            and collapse_threshold is not None
            and step_index == collapse_step
        ):
            set_global_neuron_threshold(model, collapse_threshold)

        x, y = next(iterator)

        start = time.perf_counter()
        optimizer.zero_grad()
        output, telemetry = model(
            x,
            collect_telemetry=collect_telemetry,
            capture_raw_telemetry=capture_raw_telemetry,
        )
        loss = loss_fn(output, y)
        loss.backward()
        optimizer.step()
        model.reset_state()

        if telemetry_logger is not None:
            telemetry_logger.log(telemetry, step_index)

        if reducer is not None and telemetry is not None:
            reduced_events.append(reducer.reduce(telemetry))

        elapsed = time.perf_counter() - start
        if step_index >= warmup_steps:
            step_times.append(elapsed)

        losses.append(float(loss.item()))
        accuracies.append(batch_accuracy(output, y))

    if telemetry_logger is not None:
        telemetry_logger.close()

    wall_time = sum(step_times)
    measured_steps = len(step_times)

    return {
        "wall_time_seconds": wall_time,
        "measured_steps": measured_steps,
        "steps_per_second": measured_steps / wall_time if wall_time > 0 else 0.0,
        "losses": losses,
        "accuracies": accuracies,
        "reduced_telemetry": reduced_events,
    }


def batch_accuracy(output: torch.Tensor, target: torch.Tensor) -> float:
    if output.dim() == 1:
        predictions = (output > 0.5).long()
    else:
        predictions = output.argmax(dim=1)
    return float((predictions == target).float().mean().item())


def set_global_neuron_threshold(model, threshold: float) -> None:
    for module in model.network:
        if isinstance(module, BaseNode) and hasattr(module, "v_threshold"):
            value = module.v_threshold
            if torch.is_tensor(value):
                value.fill_(threshold)
            else:
                module.v_threshold = threshold


def _cycle(loader):
    while True:
        for batch in loader:
            yield batch
