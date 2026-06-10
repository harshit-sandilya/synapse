from pydantic import BaseModel
from feature.inference.dto.stored_model_telemetry import StoredModelTelemetry


class InferenceResult(BaseModel):
    sample_number: int
    prediction: list[float] | float
    target: list[float] | float
    telemetry: StoredModelTelemetry
