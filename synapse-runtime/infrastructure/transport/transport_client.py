from abc import ABC, abstractmethod
from common.models.transport.dataset_validation_request import DatasetValidationRequest
from common.models.transport.training_start_request import TrainingStartRequest
from common.models.transport.training_end_request import TrainingEndRequest
from common.models.transport.model_inference_request import ModelInferenceRequest


class TransportClient(ABC):
    @abstractmethod
    async def notify_dataset_validation(
        self, payload: DatasetValidationRequest
    ) -> None:
        pass

    @abstractmethod
    async def notify_training_started(self, payload: TrainingStartRequest) -> None:
        pass

    @abstractmethod
    async def notify_training_ended(self, payload: TrainingEndRequest) -> None:
        pass

    @abstractmethod
    async def notify_model_inference(self, payload: ModelInferenceRequest) -> None:
        pass
