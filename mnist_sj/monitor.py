# mnist_sj/monitor.py

import torch


class SNNMonitor:

    def __init__(self):

        self.reset()

    def reset(self):

        self.total_spikes = 0.0
        self.total_neurons = 0

        self.layer_stats = {}

    def update(
        self,
        layer_name: str,
        spikes: torch.Tensor,
    ):
        """
        spikes shape:
            [batch, neurons]
            or higher-dimensional tensor
        """

        spike_count = spikes.sum().item()

        neuron_count = spikes.numel()

        firing_rate = spike_count / neuron_count

        if layer_name not in self.layer_stats:

            self.layer_stats[layer_name] = {
                "spike_count": 0.0,
                "neuron_count": 0,
            }

        self.layer_stats[layer_name]["spike_count"] += spike_count

        self.layer_stats[layer_name]["neuron_count"] += neuron_count

        self.total_spikes += spike_count

        self.total_neurons += neuron_count

        return {
            "firing_rate": firing_rate,
            "spike_count": spike_count,
        }

    def summarize(self):

        summary = {}

        for layer_name, stats in self.layer_stats.items():

            firing_rate = stats["spike_count"] / stats["neuron_count"]

            silent_ratio = 1.0 - firing_rate

            summary[layer_name] = {
                "firing_rate": firing_rate,
                "silent_ratio": silent_ratio,
            }

        overall_firing_rate = self.total_spikes / self.total_neurons

        summary["overall"] = {
            "firing_rate": overall_firing_rate,
        }

        return summary
