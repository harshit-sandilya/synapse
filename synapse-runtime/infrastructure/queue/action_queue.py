from abc import ABC, abstractmethod
from common.enums.job_priority import JobPriority


class ActionQueue(ABC):

    @abstractmethod
    def pop(self, priority: JobPriority) -> str | None:
        pass

    @abstractmethod
    def push(self, priority: JobPriority, payload: str) -> None:
        pass
