from enum import Enum


class JobType(str, Enum):
    DATASET_VALIDATION = "DATASET_VALIDATION"
    INFERENCE = "INFERENCE"
    TRAINING = "TRAINING"
