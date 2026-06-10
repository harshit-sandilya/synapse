import traceback
from pathlib import Path

from common.enums.config_status import ConfigStatus
from common.logging.logger import get_logger
from common.models.queue.dataset_validation_job import DatasetValidationJob
from common.models.transport.dataset_validation_request import DatasetValidationRequest
from feature.dataset.dto.dataloader_config import DataloaderConfig
from feature.dataset.loader.parquet_dataloader import ParquetDataLoaderFactory
from feature.dataset.service.dataset_factory import DatasetFactory
from feature.dataset.service.snapshot_service import SnapshotService
from infrastructure.storage.minio_storage import MinioObjectStorage
from infrastructure.storage.storage_cache import StorageCache
from infrastructure.transport.transport_runtime_client import HttpTransportClient

logger = get_logger(__name__)


class ValidationService:
    def __init__(self):

        self.storage = MinioObjectStorage()
        self.cache = StorageCache()

        self.snapshot_service = SnapshotService()

        self.transport = HttpTransportClient()

        self.loader_factory = ParquetDataLoaderFactory(
            storage=self.storage, cache=self.cache
        )

    async def validate(self, payload: DatasetValidationJob):
        snapshot_prefix = (
            f"datasets/"
            f"{payload.workspace_id}/"
            f"{payload.experiment_id}/"
            f"snapshot"
        )

        local_dataset_root = str(
            self.cache.ensure_parent(f"datasets/{payload.experiment_id}")
        )

        local_snapshot_dir = str(
            self.cache.ensure_parent(f"snapshots/{payload.experiment_id}")
        )

        try:
            logger.info(f"Starting dataset validation " f"{payload.dataset_name}")
            config_json = self.storage.get_json(payload.dataset_config_storage_key)
            dataloader_config = DataloaderConfig.model_validate(config_json)
            train_dataset = DatasetFactory.create(
                dataset_name=payload.dataset_name,
                root=local_dataset_root,
                train=True,
            )

            test_dataset = DatasetFactory.create(
                dataset_name=payload.dataset_name,
                root=local_dataset_root,
                train=False,
            )

            logger.info("Dataset downloaded successfully")

            metadata = self.snapshot_service.create_snapshot(
                train_dataset=train_dataset,
                test_dataset=test_dataset,
                snapshot_dir=local_snapshot_dir,
                dataset_name=payload.dataset_name,
            )

            logger.info("Snapshot created successfully")

            snapshot_root = Path(local_snapshot_dir)

            for file_path in snapshot_root.rglob("*"):
                if not file_path.is_file():
                    continue
                relative_path = file_path.relative_to(snapshot_root)
                object_name = f"{snapshot_prefix}/" f"{relative_path.as_posix()}"
                self.storage.upload_file(
                    object_name=object_name,
                    file_path=str(file_path),
                )

            train_loader, _ = self.loader_factory.create(
                snapshot_prefix=snapshot_prefix, config=dataloader_config
            )
            batch = next(iter(train_loader))

            inputs, targets = batch
            input_shape = str(list(inputs.shape))
            output_shape = str(list(targets.shape))
            response = DatasetValidationRequest(
                workspace_id=payload.workspace_id,
                experiment_id=payload.experiment_id,
                provider=payload.provider,
                dataset_name=payload.dataset_name,
                status=ConfigStatus.READY,
                dataset_config_storage_key=(payload.dataset_config_storage_key),
                dataset_snapshot_storage_key=(snapshot_prefix),
                input_shape=input_shape,
                output_shape=output_shape,
                train_sample_count=metadata["trainSampleCount"],
                test_sample_count=metadata["testSampleCount"],
                validation_error=None,
            )
            await self.transport.notify_dataset_validation(response)
            logger.info("Dataset validation completed")
        except Exception:
            error = traceback.format_exc()
            logger.exception("Dataset validation failed")
            self.storage.delete_prefix(snapshot_prefix)
            response = DatasetValidationRequest(
                workspace_id=payload.workspace_id,
                experiment_id=payload.experiment_id,
                provider=payload.provider,
                dataset_name=payload.dataset_name,
                status=ConfigStatus.FAILED,
                dataset_config_storage_key=(payload.dataset_config_storage_key),
                validation_error=error,
            )
            await self.transport.notify_dataset_validation(response)
        finally:
            self.cache.remove(f"snapshots/{payload.experiment_id}")
