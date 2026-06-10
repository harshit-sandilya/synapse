from enum import Enum


class OptimizerType(str, Enum):
    SGD = "SGD"
    ADAM = "ADAM"
    ADAMW = "ADAMW"
    RMSPROP = "RMSPROP"
