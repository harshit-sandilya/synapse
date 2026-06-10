from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from common.enums.model_status import ModelStatus


class TrainingStartRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    workspace_id: UUID = Field(alias="workspaceId")
    experiment_id: UUID = Field(alias="experimentId")
    status: ModelStatus
    telemetry_topic: str = Field(alias="telemetryTopic")
    publisher_service_url: str = Field(alias="publisherServiceUrl")
    metrics_storage_key: str = Field(alias="metricsStorageKey")
