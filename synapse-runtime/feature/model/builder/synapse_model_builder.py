import ast
import math

import torch
from torch import nn

from feature.model.builder.neuron_builder import NeuronBuilder
from feature.model.model.synapse_ssn_model import SynapseSNNModel
from feature.model.dto.model_ir import ModelIR
from feature.model.registry.encoder_registry import ENCODER_REGISTRY
from feature.model.registry.layer_registry import LAYER_REGISTRY
from feature.model.registry.surrogate_registry import SURROGATE_REGISTRY


class SynapseModelBuilder:
    def build(self, model_ir: ModelIR, input_shape: str) -> SynapseSNNModel:
        shape = self._parse_shape(input_shape)
        batch_size = shape[0]
        current_shape = shape[1:]
        surrogate_fn = self._build_surrogate(model_ir.surrogate)
        encoder = self._build_encoder(model_ir.encoder)
        modules = []

        for layer_cfg in model_ir.layers:
            layer_module, current_shape = self._build_layer(layer_cfg, current_shape)
            modules.append(layer_module)
            neuron_cfg = getattr(layer_cfg, "neuron", None)
            if neuron_cfg is not None:
                neuron_module = NeuronBuilder.build(neuron_cfg, surrogate_fn)
                modules.append(neuron_module)

        network = nn.ModuleList(modules)
        model = SynapseSNNModel(
            encoder=encoder,
            network=network,
            timesteps=model_ir.simulation.timesteps,
        )

        self._dry_run(model, batch_size, shape[1:])
        model.output_shape = current_shape
        return model

    def _parse_shape(self, shape_str: str):
        return tuple(ast.literal_eval(shape_str))

    def _build_encoder(self, encoder_cfg):
        encoder_cls = ENCODER_REGISTRY[encoder_cfg.type]
        params = encoder_cfg.model_dump(exclude={"type"}, exclude_none=True)
        return encoder_cls(**params)

    def _build_surrogate(self, surrogate_cfg):
        surrogate_cls = SURROGATE_REGISTRY[surrogate_cfg.type]
        params = surrogate_cfg.model_dump(exclude={"type"}, exclude_none=True)
        return surrogate_cls(**params)

    def _build_layer(self, layer_cfg, current_shape):
        layer_type = layer_cfg.type
        if layer_type == "Flatten":
            return (LAYER_REGISTRY["Flatten"](), (math.prod(current_shape),))

        if layer_type == "Linear":

            in_features = current_shape[0]

            module = LAYER_REGISTRY["Linear"](
                in_features=in_features,
                out_features=layer_cfg.out_features,
                bias=layer_cfg.bias,
            )

            return (
                module,
                (layer_cfg.out_features,),
            )

        if layer_type == "Conv2D":

            c, h, w = current_shape

            k = layer_cfg.kernel_size
            s = layer_cfg.stride
            p = layer_cfg.padding

            module = LAYER_REGISTRY["Conv2D"](
                in_channels=c,
                out_channels=layer_cfg.out_channels,
                kernel_size=k,
                stride=s,
                padding=p,
                bias=layer_cfg.bias,
            )

            if isinstance(k, tuple):
                kh, kw = k
            else:
                kh = kw = k

            if isinstance(s, tuple):
                sh, sw = s
            else:
                sh = sw = s

            if isinstance(p, tuple):
                ph, pw = p
            else:
                ph = pw = p

            h_out = ((h + 2 * ph - kh) // sh) + 1

            w_out = ((w + 2 * pw - kw) // sw) + 1

            return (
                module,
                (
                    layer_cfg.out_channels,
                    h_out,
                    w_out,
                ),
            )

        if layer_type.startswith("MaxPool"):
            return self._build_pool(
                layer_cfg,
                current_shape,
                "MaxPool",
            )

        if layer_type.startswith("AvgPool"):
            return self._build_pool(
                layer_cfg,
                current_shape,
                "AvgPool",
            )

        if layer_type.startswith("BatchNorm"):

            channels = current_shape[0]

            module = LAYER_REGISTRY[layer_type](channels)

            return (
                module,
                current_shape,
            )

        if layer_type == "Dropout":

            return (
                LAYER_REGISTRY["Dropout"](p=layer_cfg.p),
                current_shape,
            )

        raise ValueError(f"Unsupported layer: {layer_type}")

    def _build_pool(
        self,
        layer_cfg,
        current_shape,
        prefix,
    ):

        layer_type = layer_cfg.type

        module = LAYER_REGISTRY[layer_type](
            kernel_size=layer_cfg.kernel_size,
            stride=layer_cfg.stride,
        )

        if len(current_shape) == 3:

            c, h, w = current_shape

            s = layer_cfg.stride or layer_cfg.kernel_size

            h_out = h // s

            w_out = w // s

            return (
                module,
                (
                    c,
                    h_out,
                    w_out,
                ),
            )

        return (
            module,
            current_shape,
        )

    def _dry_run(
        self,
        model,
        batch_size,
        data_shape,
    ):

        dummy = torch.randn(batch_size, *data_shape)

        with torch.no_grad():
            model(dummy)
