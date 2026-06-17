import torch
from common.models.events.published_telemetry import (
    PublishedLayerTelemetry,
    PublishedTelemetry,
)
from feature.model.dto.telemetry import ModelTelemetry


class TelemetryReducer:
    SATURATION_FACTOR = 0.95

    @classmethod
    def reduce(cls, telemetry: ModelTelemetry) -> PublishedTelemetry:
        layers = []

        for layer in telemetry.layers:
            spikes = layer.spikes.float()
            membrane = layer.membrane_potentials.float()
            firing_rate = float(spikes.mean())
            sparsity = float((spikes == 0).float().mean())
            mean_membrane = float(membrane.mean())
            membrane_std = float(membrane.std())

            dead_neuron_ratio = cls._dead_ratio(spikes)
            saturated_ratio = cls._saturated_ratio(membrane, layer.threshold)

            layers.append(
                PublishedLayerTelemetry(
                    layer_index=layer.layer_index,
                    layer_name=layer.layer_name,
                    firing_rate=firing_rate,
                    sparsity=sparsity,
                    mean_membrane=mean_membrane,
                    membrane_std=membrane_std,
                    dead_neuron_ratio=dead_neuron_ratio,
                    saturated_neuron_ratio=saturated_ratio,
                    threshold=layer.threshold,
                    tau=layer.tau,
                )
            )

        return PublishedTelemetry(
            timestep=telemetry.timestep,
            layers=layers,
            emitted_at_ms=telemetry.emitted_at_ms,
            sequence_id=telemetry.sequence_id,
        )

    @staticmethod
    def _dead_ratio(spikes: torch.Tensor) -> float:
        neuron_activity = spikes.sum(dim=0)
        dead = neuron_activity == 0
        return float(dead.float().mean())

    @classmethod
    def _saturated_ratio(cls, membrane: torch.Tensor, threshold: float) -> float:
        saturated = membrane >= threshold * cls.SATURATION_FACTOR
        return float(saturated.float().mean())
