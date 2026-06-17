from common.enums.model_status import ModelStatus
from common.logging.logger import get_logger
from common.models.queue.model_training_job import ModelTrainingJob
from common.models.transport.training_end_request import TrainingEndRequest
from common.models.transport.training_start_request import TrainingStartRequest
from config.runtime_properties import runtime_properties
from feature.training.service.checkpoint_service import CheckpointService
from feature.training.service.evaluator import Evaluator
from feature.training.service.metrics_writer import MetricsWriter
from feature.training.service.telemetry_publisher import TelemetryPublisher
from feature.training.service.trainer import Trainer
from feature.training.service.training_context_builder import TrainingContextBuilder
from infrastructure.event.redis_event_publisher import RedisEventPublisher
from infrastructure.queue.redis_action_queue import RedisActionQueue
from infrastructure.storage.minio_storage import MinioObjectStorage
from infrastructure.storage.storage_cache import StorageCache
from infrastructure.transport.transport_runtime_client import HttpTransportClient

logger = get_logger(__name__)


class TrainingEngine:
    def __init__(self):
        self.redis = RedisActionQueue()
        self.storage = MinioObjectStorage()
        self.cache = StorageCache()
        self.publisher = RedisEventPublisher()
        self.transport = HttpTransportClient()
        self.context_builder = TrainingContextBuilder(self.storage, self.cache)

    async def train(self, job: ModelTrainingJob):
        checkpoint_key = f"experiments/{job.experiment_id}/training/model.pt"
        metrics_key = f"experiments/{job.experiment_id}/training/metrics.jsonl"
        telemetry_topic = f"telemetry:{job.experiment_id}"

        self.telemetry_publisher = TelemetryPublisher(
            publisher=self.publisher, topic=telemetry_topic
        )
        self.metrics_writer = MetricsWriter(
            self.storage, self.cache, metrics_key, job.task_type
        )
        self.checkpoint_service = CheckpointService(
            self.storage,
            self.cache,
            checkpoint_key,
        )
        self.trainer = Trainer(telemetry_publisher=self.telemetry_publisher)
        self.evaluator = Evaluator()

        try:
            logger.info(f"Starting training experiment={job.experiment_id}")
            context = self.context_builder.build(job)

            await self.transport.notify_training_started(
                TrainingStartRequest(
                    workspace_id=job.workspace_id,
                    experiment_id=job.experiment_id,
                    status=ModelStatus.TRAINING,
                    telemetry_topic=telemetry_topic,
                    publisher_service_url=f"redis://{runtime_properties.redis_host}:{runtime_properties.redis_port}",
                    metrics_storage_key=metrics_key,
                )
            )

            for epoch in range(context.epochs):
                logger.info(f"Epoch {epoch + 1}/{context.epochs}")
                train_result = self.trainer.train_epoch(context)
                eval_result = self.evaluator.evaluate(context)
                logger.info(
                    f"Epoch {epoch + 1}/{context.epochs} completed. Loss Train: {train_result.loss}. Loss Eval: {eval_result.loss}"
                )

                self.metrics_writer.write(
                    epoch=epoch + 1,
                    train_result=train_result,
                    eval_result=eval_result,
                )

                self.checkpoint_service.checkpoint(
                    model=context.model,
                    epoch=epoch + 1,
                    eval_result=eval_result,
                )

            self.telemetry_publisher.shutdown()
            self.metrics_writer.shutdown()
            self.checkpoint_service.shutdown()

            await self.transport.notify_training_ended(
                TrainingEndRequest(
                    workspace_id=job.workspace_id,
                    experiment_id=job.experiment_id,
                    status=ModelStatus.DONE,
                    metrics_storage_key=metrics_key,
                    checkpoint_storage_key=checkpoint_key,
                )
            )

            logger.info(f"Training completed experiment={job.experiment_id}")

        except Exception as ex:
            logger.exception("Training failed")

            try:
                self.telemetry_publisher.shutdown()
                self.metrics_writer.shutdown()
                self.checkpoint_service.shutdown()
            except Exception:
                logger.exception("Failed draining async training services")

            await self.transport.notify_training_ended(
                TrainingEndRequest(
                    workspace_id=job.workspace_id,
                    experiment_id=job.experiment_id,
                    status=ModelStatus.FAILED,
                    metrics_storage_key="",
                    checkpoint_storage_key=checkpoint_key,
                    training_error=str(ex),
                )
            )
