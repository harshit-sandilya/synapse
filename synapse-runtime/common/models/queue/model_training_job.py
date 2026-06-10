from uuid import UUID
from pydantic import BaseModel, Field
from common.enums.task_type import TaskType


class ModelTrainingJob(BaseModel):
    workspace_id: UUID = Field(alias="workspaceId")
    experiment_id: UUID = Field(alias="experimentId")
    task_type: TaskType = Field(alias="taskType")
    dataset_config_storage_key: str = Field(alias="datasetConfigStorageKey")
    dataset_storage_key: str = Field(alias="datasetStorageKey")
    model_ir_storage_key: str = Field(alias="modelIrStorageKey")
    model_config_storage_key: str = Field(alias="modelConfigStorageKey")
