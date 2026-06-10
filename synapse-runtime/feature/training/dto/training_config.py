from pydantic import BaseModel, Field

from common.enums.optimizer_type import OptimizerType
from common.enums.loss_function_type import LossFunctionType


class TrainingConfig(BaseModel):
    optimizer: OptimizerType
    loss_function: LossFunctionType = Field(alias="lossFunction")
    learning_rate: float = Field(alias="learningRate")
    epochs: int
