import torch

if torch.backends.mps.is_available():
    device = torch.device("mps")
elif torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")

DATA_DIR = "./data"
BATCH_SIZE = 64
NUM_WORKERS = 4

DEVICE = device
TIMESTEPS = 10
LR = 1e-3
EPOCHS = 5
