from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from common.enums.model_status import ModelStatus


class TrainingEndRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    workspace_id: UUID = Field(alias="workspaceId")
    experiment_id: UUID = Field(alias="experimentId")
    status: ModelStatus
    metrics_storage_key: str = Field(alias="metricsStorageKey")
    checkpoint_storage_key: str | None = Field(
        alias="checkpointStorageKey", default=None
    )

    training_error: str | None = Field(alias="trainingError", default=None)
