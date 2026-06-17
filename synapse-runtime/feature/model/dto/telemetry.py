from dataclasses import dataclass

import torch


@dataclass(slots=True)
class LayerTelemetry:
    layer_index: int
    layer_name: str

    spikes: torch.Tensor
    membrane_potentials: torch.Tensor

    threshold: float
    tau: float | None

    raw_spikes: torch.Tensor | None = None
    raw_membrane_potentials: torch.Tensor | None = None


@dataclass(slots=True)
class ModelTelemetry:
    timestep: int
    layers: list[LayerTelemetry]
    emitted_at_ms: float | None = None
    sequence_id: int | None = None
