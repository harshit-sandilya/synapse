from uuid import UUID
from pydantic import BaseModel, Field
from common.enums.dataset_provider import DatasetProvider
from common.enums.task_type import TaskType


class DatasetValidationJob(BaseModel):
    workspace_id: UUID = Field(alias="workspaceId")
    experiment_id: UUID = Field(alias="experimentId")
    task_type: TaskType = Field(alias="taskType")
    provider: DatasetProvider
    dataset_name: str = Field(alias="datasetName")
    dataset_config_storage_key: str = Field(alias="datasetConfigStorageKey")
