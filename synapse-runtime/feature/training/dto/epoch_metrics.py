from dataclasses import dataclass


@dataclass(slots=True)
class EpochMetrics:
    epoch: int

    train_loss: float
    train_metrics: dict[str, float]

    test_loss: float
    test_metrics: dict[str, float]
