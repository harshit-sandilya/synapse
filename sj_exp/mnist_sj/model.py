# mnist_sj/model.py

import torch.nn as nn
from spikingjelly.activation_based import (
    neuron,
    surrogate,
    layer,
)


class MNISTSNN(nn.Module):

    def __init__(
        self,
        tau: float = 2.0,
        surrogate_function=None,
    ):
        super().__init__()

        if surrogate_function is None:
            surrogate_function = surrogate.ATan()

        self.flatten = layer.Flatten()

        self.fc1 = layer.Linear(
            28 * 28,
            256,
        )

        self.lif1 = neuron.LIFNode(
            tau=tau,
            surrogate_function=surrogate_function,
            detach_reset=True,
        )

        self.fc2 = layer.Linear(
            256,
            10,
        )

        self.lif2 = neuron.LIFNode(
            tau=tau,
            surrogate_function=surrogate_function,
            detach_reset=True,
        )

    def forward(self, x, return_monitor=False):
        monitor_data = {}
        x = self.flatten(x)
        x = self.fc1(x)
        x = self.lif1(x)
        if return_monitor:
            monitor_data["lif1"] = x.detach()
        x = self.fc2(x)
        x = self.lif2(x)
        if return_monitor:
            monitor_data["lif2"] = x.detach()
        if return_monitor:
            return x, monitor_data

        return x
