import ast
import inspect
import math

import torch
from feature.model.builder.neuron_builder import NeuronBuilder
from feature.model.dto.model_ir import ModelIR
from feature.model.model.synapse_ssn_model import SynapseSNNModel
from feature.model.registry.encoder_registry import ENCODER_REGISTRY
from feature.model.registry.layer_registry import LAYER_REGISTRY
from feature.model.registry.surrogate_registry import SURROGATE_REGISTRY
from torch import nn


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

        self._dry_run(
            model,
            batch_size,
            shape[1:],
            encoder_type=model_ir.encoder.type,
        )
        model.output_shape = current_shape
        return model

    def _parse_shape(self, shape_str: str):
        return tuple(ast.literal_eval(shape_str))

    def _build_encoder(self, encoder_cfg):
        encoder_cls = ENCODER_REGISTRY[encoder_cfg.type]
        params = encoder_cfg.model_dump(exclude={"type"}, exclude_none=True)

        if (
            "function_type" in params
            and "enc_function" in inspect.signature(encoder_cls.__init__).parameters
        ):
            params["enc_function"] = params.pop("function_type")

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

        if layer_type.startswith("Conv"):
            return self._build_convolution(layer_cfg, current_shape)

        if layer_type.startswith("MaxPool") or layer_type.startswith("AvgPool"):
            return self._build_pool(layer_cfg, current_shape)

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

    def _build_convolution(self, layer_cfg, current_shape):
        layer_type = layer_cfg.type
        spatial_dims = self._layer_dimensions(layer_type)
        self._ensure_shape_rank(layer_type, current_shape, spatial_dims + 1)

        in_channels = current_shape[0]
        spatial_shape = current_shape[1:]
        kernel_size = self._normalize_shape_arg(layer_cfg.kernel_size, spatial_dims)
        stride = self._normalize_shape_arg(layer_cfg.stride, spatial_dims)
        padding = self._normalize_shape_arg(layer_cfg.padding, spatial_dims)

        module = LAYER_REGISTRY[layer_type](
            in_channels=in_channels,
            out_channels=layer_cfg.out_channels,
            kernel_size=layer_cfg.kernel_size,
            stride=layer_cfg.stride,
            padding=layer_cfg.padding,
            bias=layer_cfg.bias,
        )

        output_spatial = self._compute_conv_output_shape(
            spatial_shape=spatial_shape,
            kernel_size=kernel_size,
            stride=stride,
            padding=padding,
            layer_type=layer_type,
        )

        return (
            module,
            (
                layer_cfg.out_channels,
                *output_spatial,
            ),
        )

    def _build_pool(self, layer_cfg, current_shape):
        layer_type = layer_cfg.type
        spatial_dims = self._layer_dimensions(layer_type)
        self._ensure_shape_rank(layer_type, current_shape, spatial_dims + 1)

        module = LAYER_REGISTRY[layer_type](
            kernel_size=layer_cfg.kernel_size,
            stride=layer_cfg.stride,
        )

        channels = current_shape[0]
        spatial_shape = current_shape[1:]
        kernel_size = self._normalize_shape_arg(layer_cfg.kernel_size, spatial_dims)
        stride = self._normalize_shape_arg(
            layer_cfg.stride or layer_cfg.kernel_size,
            spatial_dims,
        )

        output_spatial = self._compute_pool_output_shape(
            spatial_shape=spatial_shape,
            kernel_size=kernel_size,
            stride=stride,
            layer_type=layer_type,
        )

        return (
            module,
            (
                channels,
                *output_spatial,
            ),
        )

    def _layer_dimensions(self, layer_type: str) -> int:
        return int(layer_type[-2])

    def _normalize_shape_arg(self, value, dimensions: int) -> tuple[int, ...]:
        if isinstance(value, (tuple, list)):
            if len(value) != dimensions:
                raise ValueError(
                    f"Expected {dimensions} values but got {len(value)} for {value}"
                )
            return tuple(int(part) for part in value)

        return tuple(int(value) for _ in range(dimensions))

    def _ensure_shape_rank(
        self,
        layer_type: str,
        current_shape: tuple[int, ...],
        expected_rank: int,
    ) -> None:
        if len(current_shape) != expected_rank:
            raise ValueError(
                f"{layer_type} expects input rank {expected_rank} without batch, "
                f"got shape {current_shape}"
            )

    def _compute_conv_output_shape(
        self,
        *,
        spatial_shape: tuple[int, ...],
        kernel_size: tuple[int, ...],
        stride: tuple[int, ...],
        padding: tuple[int, ...],
        layer_type: str,
    ) -> tuple[int, ...]:
        output = []
        for dim, kernel, step, pad in zip(spatial_shape, kernel_size, stride, padding):
            size = ((dim + (2 * pad) - kernel) // step) + 1
            if size <= 0:
                raise ValueError(
                    f"{layer_type} produced invalid output size {size} from "
                    f"input={spatial_shape}, kernel={kernel_size}, stride={stride}, padding={padding}"
                )
            output.append(size)
        return tuple(output)

    def _compute_pool_output_shape(
        self,
        *,
        spatial_shape: tuple[int, ...],
        kernel_size: tuple[int, ...],
        stride: tuple[int, ...],
        layer_type: str,
    ) -> tuple[int, ...]:
        output = []
        for dim, kernel, step in zip(spatial_shape, kernel_size, stride):
            size = ((dim - kernel) // step) + 1
            if size <= 0:
                raise ValueError(
                    f"{layer_type} produced invalid output size {size} from "
                    f"input={spatial_shape}, kernel={kernel_size}, stride={stride}"
                )
            output.append(size)
        return tuple(output)

    def _dry_run(
        self,
        model,
        batch_size,
        data_shape,
        *,
        encoder_type: str,
    ):
        if encoder_type == "latency":
            dummy = torch.rand(batch_size, *data_shape)
        else:
            dummy = torch.randn(batch_size, *data_shape)

        with torch.no_grad():
            model(dummy)
