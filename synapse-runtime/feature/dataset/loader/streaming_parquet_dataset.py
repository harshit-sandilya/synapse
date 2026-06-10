from pathlib import Path

import pyarrow.parquet as pq
import numpy as np
import torch
from torch.utils.data import IterableDataset, get_worker_info
from infrastructure.storage.object_storage import ObjectStorage

from common.logging.logger import get_logger

logger = get_logger(__name__)


class StreamingParquetDataset(IterableDataset):

    def __init__(self, storage_factory, cache, shard_keys):
        super().__init__()

        self.storage_factory = storage_factory
        self.cache = cache
        self.shard_keys = shard_keys

    def __iter__(self):
        storage: ObjectStorage = self.storage_factory()
        worker_info = get_worker_info()
        if worker_info is None:
            shard_keys = self.shard_keys
        else:
            shard_keys = self.shard_keys[worker_info.id :: worker_info.num_workers]

        for shard_key in shard_keys:
            local_path = self.cache.ensure_parent(shard_key)
            storage.download_file(
                shard_key,
                str(local_path),
            )
            table = pq.read_table(local_path)
            images = table["image"]
            labels = table["label"]
            for image, label in zip(images, labels):
                x = torch.tensor(np.asarray(image.as_py(), dtype=np.float32))
                y = torch.tensor(label.as_py())
                yield x, y
            Path(local_path).unlink(missing_ok=True)
