from enum import Enum


class LossFunctionType(str, Enum):
    CROSS_ENTROPY = "CROSS_ENTROPY"
    NLL_LOSS = "NLL_LOSS"
    MSE = "MSE"
    MAE = "MAE"
    HUBER = "HUBER"
