import torch
import torch.nn as nn
from feature.model.dto.telemetry import LayerTelemetry, ModelTelemetry
from spikingjelly.activation_based import functional
from spikingjelly.activation_based.neuron import BaseNode


class SynapseSNNModel(nn.Module):
    def __init__(self, encoder, network: nn.ModuleList, timesteps: int):
        super().__init__()

        self.encoder = encoder
        self.network = network
        self.timesteps = timesteps

        self.telemetry_layers = []
        self.output_shape: tuple[int, ...] | None = None

        for idx, layer in enumerate(network):
            if isinstance(layer, BaseNode):
                self.telemetry_layers.append(
                    {
                        "index": idx,
                        "name": f"{layer.__class__.__name__}_{idx}",
                        "threshold": float(
                            getattr(
                                layer,
                                "v_threshold",
                                1.0,
                            )
                        ),
                    }
                )

    def reset_state(self):
        functional.reset_net(self)

    def _reduce_activity(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        Convert arbitrary neuron output into [N].

        Linear:
            [B,N] -> [N]

        Conv:
            [B,C,H,W] -> [C]
            [B,C,L]   -> [C]
            [B,C,D,H,W] -> [C]
        """

        if tensor.dim() == 2:
            return tensor.mean(dim=0)

        if tensor.dim() >= 3:
            spatial_dims = tuple(range(2, tensor.dim()))
            return tensor.mean(dim=(0, *spatial_dims))
        return tensor

    def forward(
        self,
        x: torch.Tensor,
        collect_telemetry: bool = True,
        capture_raw_telemetry: bool = False,
    ):
        output_sum = None
        telemetry_cache = {}
        if collect_telemetry:
            for layer_meta in self.telemetry_layers:
                telemetry_cache[layer_meta["index"]] = {
                    "spikes": [],
                    "membrane_potentials": [],
                    "raw_spikes": [] if capture_raw_telemetry else None,
                    "raw_membrane_potentials": [] if capture_raw_telemetry else None,
                }

        for _ in range(self.timesteps):
            encoded = self.encoder(x)
            current = encoded
            for layer_idx, layer in enumerate(self.network):
                current = layer(current)
                if collect_telemetry and isinstance(layer, BaseNode):
                    raw_spikes = current.detach()
                    raw_membrane = layer.v.detach()
                    spikes = self._reduce_activity(raw_spikes)
                    membrane = self._reduce_activity(raw_membrane)
                    telemetry_cache[layer_idx]["spikes"].append(spikes)
                    telemetry_cache[layer_idx]["membrane_potentials"].append(membrane)

                    if capture_raw_telemetry:
                        telemetry_cache[layer_idx]["raw_spikes"].append(raw_spikes)
                        telemetry_cache[layer_idx]["raw_membrane_potentials"].append(
                            raw_membrane
                        )

            if output_sum is None:
                output_sum = current
            else:
                output_sum += current

        if output_sum is None:
            raise ValueError("Model produced no output during forward pass")

        output = output_sum / self.timesteps

        if not collect_telemetry:
            return output, None

        telemetry = []
        for layer_meta in self.telemetry_layers:
            idx = layer_meta["index"]
            neuron_layer = self.network[idx]
            tau = getattr(neuron_layer, "tau", None)
            telemetry.append(
                LayerTelemetry(
                    layer_index=idx,
                    layer_name=layer_meta["name"],
                    spikes=torch.stack(telemetry_cache[idx]["spikes"]),
                    membrane_potentials=torch.stack(
                        telemetry_cache[idx]["membrane_potentials"]
                    ),
                    threshold=layer_meta["threshold"],
                    tau=float(tau) if tau is not None else None,
                    raw_spikes=(
                        torch.stack(telemetry_cache[idx]["raw_spikes"])
                        if capture_raw_telemetry
                        else None
                    ),
                    raw_membrane_potentials=(
                        torch.stack(telemetry_cache[idx]["raw_membrane_potentials"])
                        if capture_raw_telemetry
                        else None
                    ),
                )
            )
        telemetry = ModelTelemetry(timestep=self.timesteps, layers=telemetry)

        return output, telemetry

    def train_step(self, x: torch.Tensor):
        return self.forward(x, collect_telemetry=True)

    def predict_step(self, x: torch.Tensor):
        return self.forward(x, collect_telemetry=True)
