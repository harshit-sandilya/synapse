from abc import ABC, abstractmethod


class Executor(ABC):
    @abstractmethod
    async def execute(self, payload):
        pass
