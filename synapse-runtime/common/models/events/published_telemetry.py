from pydantic import BaseModel


class PublishedLayerTelemetry(BaseModel):
    layer_index: int
    layer_name: str

    firing_rate: float
    sparsity: float

    mean_membrane: float
    membrane_std: float

    dead_neuron_ratio: float
    saturated_neuron_ratio: float

    threshold: float
    tau: float | None


class PublishedTelemetry(BaseModel):
    timestep: int
    layers: list[PublishedLayerTelemetry]
