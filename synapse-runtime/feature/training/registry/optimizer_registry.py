import torch.optim as optim
from common.enums.optimizer_type import OptimizerType

OPTIMIZER_REGISTRY = {
    OptimizerType.SGD: optim.SGD,
    OptimizerType.ADAM: optim.Adam,
    OptimizerType.ADAMW: optim.AdamW,
    OptimizerType.RMSPROP: optim.RMSprop,
}
