import json
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from common.logging.logger import get_logger

logger = get_logger(__name__)


class SnapshotService:

    def __init__(
        self,
        shard_size: int = 1000,
    ):
        self.shard_size = shard_size

    def create_snapshot(
        self,
        train_dataset,
        test_dataset,
        snapshot_dir: str,
        dataset_name: str,
    ) -> dict:

        snapshot_path = Path(snapshot_dir)

        train_dir = snapshot_path / "train"
        test_dir = snapshot_path / "test"

        train_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        test_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        train_shards = self._write_split(
            dataset=train_dataset,
            split_dir=train_dir,
        )

        test_shards = self._write_split(
            dataset=test_dataset,
            split_dir=test_dir,
        )

        metadata = {
            "snapshotVersion": 1,
            "datasetName": dataset_name,
            "trainSampleCount": len(train_dataset),
            "testSampleCount": len(test_dataset),
            "trainShardCount": train_shards,
            "testShardCount": test_shards,
        }

        metadata_path = snapshot_path / "metadata.json"

        with open(
            metadata_path,
            "w",
        ) as f:
            json.dump(
                metadata,
                f,
                indent=2,
            )

        return metadata

    def _write_split(
        self,
        dataset,
        split_dir: Path,
    ) -> int:

        shard_index = 0

        images = []
        labels = []

        for index in range(len(dataset)):
            image, label = dataset[index]
            images.append(image.numpy().tolist())
            labels.append(int(label))

            if len(images) >= self.shard_size:

                self._write_shard(
                    split_dir,
                    shard_index,
                    images,
                    labels,
                )

                shard_index += 1

                images = []
                labels = []

        if images:

            self._write_shard(
                split_dir,
                shard_index,
                images,
                labels,
            )

            shard_index += 1

        return shard_index

    def _write_shard(
        self,
        split_dir: Path,
        shard_index: int,
        images: list,
        labels: list,
    ):

        dataframe = pd.DataFrame(
            {
                "image": images,
                "label": labels,
            }
        )

        table = pa.Table.from_pandas(
            dataframe,
            preserve_index=False,
        )

        shard_path = split_dir / f"shard_{shard_index:05d}.parquet"

        pq.write_table(
            table,
            shard_path,
        )

        logger.info(
            "Created shard %s",
            shard_path.name,
        )
