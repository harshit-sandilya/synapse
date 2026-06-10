from enum import Enum


class ConfigStatus(str, Enum):
    READY = "READY"
    FAILED = "FAILED"
