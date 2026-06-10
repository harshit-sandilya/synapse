from pydantic import BaseModel


class StoredLayerTelemetry(BaseModel):
    layer_index: int
    layer_name: str

    spikes: list[list[float]]
    membrane_potentials: list[list[float]]

    threshold: float
    tau: float | None


class StoredModelTelemetry(BaseModel):
    timestep: int
    layers: list[StoredLayerTelemetry]
