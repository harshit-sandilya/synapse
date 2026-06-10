from common.enums.job_type import JobType

from feature.dataset.service.validation_service import ValidationService
from feature.training.engine.training_engine import TrainingEngine
from feature.inference.service.model_inference_service import ModelInferenceService
from common.models.queue.dataset_validation_job import DatasetValidationJob
from common.models.queue.model_training_job import ModelTrainingJob
from common.models.queue.model_inference_job import ModelInferenceJob
from common.models.queue.queue_job import QueueJob

from common.logging.logger import get_logger

logger = get_logger(__name__)


class Dispatcher:

    def __init__(self):
        self.dataset_validation_service = ValidationService()
        self.training_engine = TrainingEngine()
        self.inference_service = ModelInferenceService()

    async def dispatch(self, job: QueueJob):
        logger.info(f"Dispatching job {job.job_type}")
        match job.job_type:
            case JobType.DATASET_VALIDATION:
                payload = DatasetValidationJob.model_validate(job.payload)
                return await self.dataset_validation_service.validate(payload)
            case JobType.TRAINING:
                payload = ModelTrainingJob.model_validate(job.payload)
                return await self.training_engine.train(payload)
            case JobType.INFERENCE:
                payload = ModelInferenceJob.model_validate(job.payload)
                return await self.inference_service.infer(payload)
            case _:
                raise ValueError(f"Unsupported job type " f"{job.job_type}")
