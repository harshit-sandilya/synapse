from pydantic import BaseModel, Field


class DataloaderConfig(BaseModel):
    batch_size: int = Field(alias="batchSize")
    num_workers: int = Field(alias="numWorkers")
    shuffle: bool
    pin_memory: bool = Field(alias="pinMemory")
    drop_last: bool = Field(alias="dropLast")
    prefetch_factor: int = Field(alias="prefetchFactor")
    persistent_workers: bool = Field(alias="persistentWorkers")
