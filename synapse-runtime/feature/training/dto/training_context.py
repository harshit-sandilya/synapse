from dataclasses import dataclass
from feature.model.model.synapse_ssn_model import SynapseSNNModel
from torch.optim import Optimizer
import torch.nn as nn
from feature.dataset.loader.parquet_dataloader import DataLoader
from common.enums.task_type import TaskType


@dataclass(slots=True)
class TrainingContext:

    model: SynapseSNNModel

    optimizer: Optimizer
    loss_fn: nn.Module

    train_loader: DataLoader
    test_loader: DataLoader

    task_type: TaskType

    epochs: int

    experiment_id: str
    workspace_id: str

    telemetry_queue_name: str
    metrics_storage_key: str
    checkpoint_storage_key: str
