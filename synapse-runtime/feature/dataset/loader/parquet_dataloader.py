from torch.utils.data import DataLoader
import torch

from feature.dataset.loader.streaming_parquet_dataset import StreamingParquetDataset
from feature.dataset.dto.dataloader_config import DataloaderConfig
from infrastructure.storage.minio_storage import MinioObjectStorage


class ParquetDataLoaderFactory:
    def __init__(
        self,
        storage,
        cache,
    ):
        self.storage = storage
        self.cache = cache

    def create(
        self,
        snapshot_prefix: str,
        config: DataloaderConfig,
    ):
        train_keys = sorted(self.storage.list_objects(f"{snapshot_prefix}/train"))
        test_keys = sorted(self.storage.list_objects(f"{snapshot_prefix}/test"))

        train_dataset = StreamingParquetDataset(
            storage_factory=MinioObjectStorage,
            cache=self.cache,
            shard_keys=train_keys,
        )

        test_dataset = StreamingParquetDataset(
            storage_factory=MinioObjectStorage,
            cache=self.cache,
            shard_keys=test_keys,
        )

        loader_kwargs = {
            "batch_size": config.batch_size,
            "num_workers": config.num_workers,
            "shuffle": False,
            "drop_last": config.drop_last,
        }

        if config.num_workers > 0:
            loader_kwargs["prefetch_factor"] = config.prefetch_factor
            loader_kwargs["persistent_workers"] = config.persistent_workers
        if torch.cuda.is_available():
            loader_kwargs["pin_memory"] = config.pin_memory

        train_loader = DataLoader(train_dataset, **loader_kwargs)
        test_loader = DataLoader(test_dataset, **loader_kwargs)

        return (
            train_loader,
            test_loader,
        )
