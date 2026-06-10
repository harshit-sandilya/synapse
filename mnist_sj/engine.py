# mnist_sj/engine.py

import torch.nn.functional as F
from spikingjelly.activation_based import (
    functional,
    encoding,
)
from .config import DEVICE, TIMESTEPS
from .monitor import SNNMonitor

encoder = encoding.PoissonEncoder()
monitor = SNNMonitor()


def train_one_epoch(
    model,
    train_loader,
    optimizer,
):
    model.train()
    total_loss = 0.0
    total_correct = 0
    total_samples = 0

    for images, labels in train_loader:
        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()
        out_fr = 0.0
        for t in range(TIMESTEPS):
            encoded_images = encoder(images)
            out_spikes, monitor_data = model(
                encoded_images,
                return_monitor=True,
            )
            for layer_name, spikes in monitor_data.items():
                monitor.update(
                    layer_name=layer_name,
                    spikes=spikes,
                )
            out_fr += out_spikes

        out_fr = out_fr / TIMESTEPS
        loss = F.cross_entropy(out_fr, labels)
        loss.backward()
        optimizer.step()
        functional.reset_net(model)
        total_loss += loss.item()
        preds = out_fr.argmax(dim=1)
        total_correct += (preds == labels).sum().item()
        total_samples += labels.numel()

    avg_loss = total_loss / len(train_loader)
    accuracy = total_correct / total_samples
    monitor_summary = monitor.summarize()
    return {
        "loss": avg_loss,
        "accuracy": accuracy,
        "monitor": monitor_summary,
    }
