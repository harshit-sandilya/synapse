from dataclasses import dataclass
import torch


@dataclass(slots=True)
class EpochTrainResult:

    loss: float

    predictions: torch.Tensor
    targets: torch.Tensor
