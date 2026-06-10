from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from common.enums.inference_status import InferenceStatus


class ModelInferenceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    workspace_id: UUID = Field(alias="workspaceId")
    experiment_id: UUID = Field(alias="experimentId")
    status: InferenceStatus
    inference_result_storage_key: str | None = Field(
        alias="inferenceResultStorageKey", default=None
    )
    inference_error: str | None = Field(alias="inferenceError", default=None)
