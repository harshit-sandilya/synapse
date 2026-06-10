from enum import Enum


class InferenceStatus(str, Enum):
    DONE = "DONE"
    FAILED = "FAILED"
