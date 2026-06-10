import json
import traceback

from common.enums.inference_status import InferenceStatus
from common.logging.logger import get_logger
from common.models.transport.model_inference_request import ModelInferenceRequest
from feature.training.service.training_context_builder import TrainingContextBuilder
from feature.training.service.checkpoint_service import CheckpointService
from infrastructure.storage.minio_storage import MinioObjectStorage
from infrastructure.storage.storage_cache import StorageCache
from infrastructure.transport.transport_runtime_client import HttpTransportClient
from common.models.queue.model_inference_job import ModelInferenceJob
from feature.model.dto.telemetry import ModelTelemetry
from feature.inference.dto.stored_model_telemetry import (
    StoredModelTelemetry,
    StoredLayerTelemetry,
)
from feature.inference.dto.inference_result import InferenceResult

logger = get_logger(__name__)


class ModelInferenceService:

    def __init__(self):
        self.storage = MinioObjectStorage()
        self.cache = StorageCache()
        self.transport_client = HttpTransportClient()
        self.context_builder = TrainingContextBuilder(
            storage=self.storage, cache=self.cache
        )

    async def infer(self, job: ModelInferenceJob):
        try:

            context = self.context_builder.build(job, inference_mode=True)
            checkpoint_service = CheckpointService(
                storage=self.storage,
                cache=self.cache,
                checkpoint_storage_key=job.model_checkpoint_storage_key,
            )

            checkpoint_service.load_checkpoint(context.model)

            sample_x, sample_y = self._get_test_sample(
                context.test_loader,
                job.sample_number,
            )

            prediction, telemetry = context.model.predict_step(sample_x)
            telemetry = self.serialize(telemetry)

            result_key = (
                f"experiments/"
                f"{job.experiment_id}/"
                f"inference/"
                f"sample_{job.sample_number}.json"
            )

            self._store_result(
                result_key=result_key,
                prediction=prediction,
                target=sample_y,
                telemetry=telemetry,
                sample_number=job.sample_number,
            )

            request = ModelInferenceRequest(
                workspaceId=job.workspace_id,
                experimentId=job.experiment_id,
                status=InferenceStatus.DONE,
                inferenceResultStorageKey=result_key,
            )

            await self.transport_client.notify_model_inference(request)

        except Exception:

            logger.exception("Inference failed")

            request = ModelInferenceRequest(
                workspaceId=job.workspace_id,
                experimentId=job.experiment_id,
                status=InferenceStatus.FAILED,
                inferenceError=traceback.format_exc(),
            )

            await self.transport_client.notify_model_inference(request)

    def _get_test_sample(self, test_loader, sample_number: int):
        for idx, (x, y) in enumerate(test_loader):
            if idx == sample_number:
                return x, y
        raise ValueError(f"Sample {sample_number} not found")

    def _store_result(
        self,
        result_key: str,
        prediction,
        target,
        telemetry: StoredModelTelemetry,
        sample_number: int,
    ):
        inference_result = InferenceResult(
            sample_number=sample_number,
            prediction=prediction.squeeze(0).detach().cpu().tolist(),
            target=target.squeeze(0).detach().cpu().tolist(),
            telemetry=telemetry,
        )

        local_path = self.cache.ensure_parent(result_key)

        with open(local_path, "w", encoding="utf-8") as fp:
            fp.write(inference_result.model_dump_json(indent=2))

        self.storage.upload_file(result_key, str(local_path))

    def serialize(self, telemetry: ModelTelemetry) -> StoredModelTelemetry:
        return StoredModelTelemetry(
            timestep=telemetry.timestep,
            layers=[
                StoredLayerTelemetry(
                    layer_index=layer.layer_index,
                    layer_name=layer.layer_name,
                    spikes=layer.spikes.detach().cpu().tolist(),
                    membrane_potentials=layer.membrane_potentials.detach()
                    .cpu()
                    .tolist(),
                    threshold=layer.threshold,
                    tau=layer.tau,
                )
                for layer in telemetry.layers
            ],
        )
