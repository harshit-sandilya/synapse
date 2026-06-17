from __future__ import annotations

import random
from pathlib import Path

from torch.utils.data import DataLoader, Subset
from torchvision import datasets
from torchvision.transforms import ToTensor

from .io import DATA_ROOT, ensure_directory


def create_mnist_loaders(
    batch_size: int,
    train_samples: int,
    test_samples: int,
    seed: int,
    *,
    shuffle: bool = True,
    drop_last: bool = True,
    num_workers: int = 0,
) -> tuple[DataLoader, DataLoader]:
    dataset_root = ensure_directory(DATA_ROOT / "mnist")

    train_dataset = datasets.MNIST(
        root=str(dataset_root),
        train=True,
        download=True,
        transform=ToTensor(),
    )
    test_dataset = datasets.MNIST(
        root=str(dataset_root),
        train=False,
        download=True,
        transform=ToTensor(),
    )

    train_subset = Subset(
        train_dataset, _sample_indices(len(train_dataset), train_samples, seed)
    )
    test_subset = Subset(
        test_dataset, _sample_indices(len(test_dataset), test_samples, seed + 1)
    )

    train_loader = DataLoader(
        train_subset,
        batch_size=batch_size,
        shuffle=shuffle,
        drop_last=drop_last,
        num_workers=num_workers,
    )
    test_loader = DataLoader(
        test_subset,
        batch_size=batch_size,
        shuffle=False,
        drop_last=drop_last,
        num_workers=num_workers,
    )

    return train_loader, test_loader


def cycle_batches(loader: DataLoader):
    while True:
        for batch in loader:
            yield batch


def _sample_indices(size: int, sample_count: int, seed: int) -> list[int]:
    sample_count = min(size, sample_count)
    indices = list(range(size))
    random.Random(seed).shuffle(indices)
    return indices[:sample_count]
