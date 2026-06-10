# mnist_sj/data.py

from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from .config import DATA_DIR, BATCH_SIZE, NUM_WORKERS

train_transform = transforms.Compose(
    [
        transforms.RandomRotation(degrees=10),
        transforms.RandomAffine(
            degrees=0,
            translate=(0.1, 0.1),
            scale=(0.95, 1.05),
        ),
        transforms.ToTensor(),
        transforms.Normalize(mean=(0.1307,), std=(0.3081,)),
    ]
)

test_transform = transforms.Compose(
    [
        transforms.ToTensor(),
        transforms.Normalize(mean=(0.1307,), std=(0.3081,)),
    ]
)

train_dataset = datasets.MNIST(
    root=DATA_DIR,
    train=True,
    transform=train_transform,
    download=True,
)

test_dataset = datasets.MNIST(
    root=DATA_DIR,
    train=False,
    transform=test_transform,
    download=True,
)

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=NUM_WORKERS,
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=NUM_WORKERS,
)
