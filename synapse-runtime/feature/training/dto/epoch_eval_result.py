from dataclasses import dataclass
import torch


@dataclass(slots=True)
class EpochEvalResult:

    loss: float

    predictions: torch.Tensor
    targets: torch.Tensor
