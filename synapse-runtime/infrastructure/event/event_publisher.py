from abc import ABC, abstractmethod


class EventPublisher(ABC):
    @abstractmethod
    def publish(self, topic: str, payload: str) -> None:
        pass
