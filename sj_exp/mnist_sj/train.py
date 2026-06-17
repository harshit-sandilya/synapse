# mnist_sj/train.py

import torch

from .config import (
    DEVICE,
    LR,
    EPOCHS,
)

from .data import (
    train_loader,
    test_loader,
)

from .model import (
    MNISTSNN,
)

from .engine import (
    train_one_epoch,
)

from spikingjelly.activation_based import (
    functional,
)
from .logger import ExperimentLogger


def main():

    print("\nInitializing Training...\n")

    model = MNISTSNN().to(DEVICE)

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=LR,
    )
    logger = ExperimentLogger()

    print(model)

    print(f"\nRunning on device: {DEVICE}")
    print(f"Epochs: {EPOCHS}")
    print(f"Learning Rate: {LR}")

    print("\nStarting Training...\n")

    for epoch in range(EPOCHS):

        metrics = train_one_epoch(
            model=model,
            train_loader=train_loader,
            optimizer=optimizer,
        )

        print(
            f"[Epoch {epoch+1}/{EPOCHS}] "
            f"Loss: {metrics['loss']:.4f} | "
            f"Accuracy: {metrics['accuracy']:.4f}"
        )
        logger.log(
            {
                "epoch": epoch + 1,
                "loss": metrics["loss"],
                "accuracy": metrics["accuracy"],
                "monitor": metrics["monitor"],
            }
        )

        for layer_name, stats in metrics["monitor"].items():
            print(f"{layer_name} | " f"firing_rate={stats['firing_rate']:.4f}")

    print("\nTraining Complete.\n")


if __name__ == "__main__":
    main()
