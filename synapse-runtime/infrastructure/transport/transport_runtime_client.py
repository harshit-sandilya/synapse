import httpx
from infrastructure.transport.transport_client import TransportClient
from config.runtime_properties import runtime_properties
from common.models.transport.dataset_validation_request import DatasetValidationRequest
from common.models.transport.training_start_request import TrainingStartRequest
from common.models.transport.training_end_request import TrainingEndRequest
from common.models.transport.model_inference_request import ModelInferenceRequest
from common.logging.logger import get_logger

logger = get_logger(__name__)


class HttpTransportClient(TransportClient):

    def __init__(self):
        self.base_url = runtime_properties.transport_url

    async def notify_dataset_validation(self, payload: DatasetValidationRequest):
        data = payload.model_dump(by_alias=True, mode="json")
        logger.info(f"Data to transport: {data}")
        async with httpx.AsyncClient() as client:
            await client.post(f"{self.base_url}/api/v1/runtime/dataset", json=data)

    async def notify_training_started(self, payload: TrainingStartRequest):
        data = payload.model_dump(by_alias=True, mode="json")
        logger.info(f"Data to transport: {data}")
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.base_url}/api/v1/runtime/training/start", json=data
            )

    async def notify_training_ended(self, payload: TrainingEndRequest):
        data = payload.model_dump(by_alias=True, mode="json")
        logger.info(f"Data to transport: {data}")
        async with httpx.AsyncClient() as client:
            await client.post(f"{self.base_url}/api/v1/runtime/training/end", json=data)

    async def notify_model_inference(self, payload: ModelInferenceRequest):
        data = payload.model_dump(by_alias=True, mode="json")
        logger.info(f"Data to transport: {data}")
        async with httpx.AsyncClient() as client:
            await client.post(f"{self.base_url}/api/v1/runtime/inference", json=data)
