import torch.nn as nn
from common.enums.loss_function_type import LossFunctionType

LOSS_REGISTRY = {
    LossFunctionType.CROSS_ENTROPY: nn.CrossEntropyLoss,
    LossFunctionType.NLL_LOSS: nn.NLLLoss,
    LossFunctionType.MSE: nn.MSELoss,
    LossFunctionType.MAE: nn.L1Loss,
    LossFunctionType.HUBER: nn.HuberLoss,
}
