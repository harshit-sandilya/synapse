from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from common.enums.config_status import ConfigStatus
from common.enums.dataset_provider import DatasetProvider


class DatasetValidationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    workspace_id: UUID = Field(alias="workspaceId")
    experiment_id: UUID = Field(alias="experimentId")
    provider: DatasetProvider
    dataset_name: str = Field(alias="datasetName")
    status: ConfigStatus
    dataset_config_storage_key: str = Field(alias="datasetConfigStorageKey")

    dataset_snapshot_storage_key: str | None = Field(
        default=None, alias="datasetSnapshotStorageKey"
    )
    input_shape: str | None = Field(default=None, alias="inputShape")
    output_shape: str | None = Field(default=None, alias="outputShape")
    train_sample_count: int | None = Field(default=None, alias="trainSampleCount")
    test_sample_count: int | None = Field(default=None, alias="testSampleCount")

    validation_error: str | None = Field(default=None, alias="validationError")
