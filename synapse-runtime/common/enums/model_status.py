from enum import Enum


class ModelStatus(str, Enum):
    TRAINING = "TRAINING"
    DONE = "DONE"
    FAILED = "FAILED"
