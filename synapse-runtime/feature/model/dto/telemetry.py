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


@dataclass(slots=True)
class ModelTelemetry:
    timestep: int
    layers: list[LayerTelemetry]
