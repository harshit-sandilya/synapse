from enum import Enum


class TaskType(str, Enum):
    REGRESSION = "REGRESSION"
    CLASSIFICATION = "CLASSIFICATION"
