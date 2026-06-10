import inspect
from feature.model.dto.model_ir import ModelIR
from feature.model.registry.encoder_registry import ENCODER_REGISTRY
from feature.model.registry.surrogate_registry import SURROGATE_REGISTRY
from feature.model.registry.layer_registry import LAYER_REGISTRY
from feature.model.registry.neuron_registry import NEURON_REGISTRY


class ModelValidator:
    @staticmethod
    def validate(model_ir: ModelIR) -> None:
        ModelValidator._validate_encoder(model_ir)
        ModelValidator._validate_surrogate(model_ir)
        ModelValidator._validate_layers(model_ir)

    @staticmethod
    def _validate_encoder(model_ir: ModelIR):
        encoder = model_ir.encoder

        if encoder.type not in ENCODER_REGISTRY:
            raise ValueError(f"Unknown encoder '{encoder.type}'")

    @staticmethod
    def _validate_surrogate(model_ir: ModelIR):
        surrogate = model_ir.surrogate

        if surrogate.type not in SURROGATE_REGISTRY:
            raise ValueError(f"Unknown surrogate '{surrogate.type}'")

    @staticmethod
    def _validate_layers(model_ir: ModelIR):

        for layer in model_ir.layers:

            if layer.type not in LAYER_REGISTRY:
                raise ValueError(f"Unknown layer '{layer.type}'")

            ModelValidator._validate_layer_params(layer)

            if getattr(layer, "neuron", None) is not None:
                ModelValidator._validate_neuron(layer.neuron)

    @staticmethod
    def _validate_layer_params(layer):

        layer_cls = LAYER_REGISTRY[layer.type]

        signature = inspect.signature(layer_cls.__init__)

        valid_args = set(signature.parameters.keys())

        supplied_args = set(
            layer.model_dump(
                exclude_none=True,
                exclude={"type", "neuron"},
            ).keys()
        )

        invalid = supplied_args - valid_args

        if invalid:
            raise ValueError(f"Invalid params for layer " f"{layer.type}: {invalid}")

    @staticmethod
    def _validate_neuron(neuron):

        if neuron.type not in NEURON_REGISTRY:
            raise ValueError(f"Unknown neuron '{neuron.type}'")

        neuron_cls = NEURON_REGISTRY[neuron.type]

        signature = inspect.signature(neuron_cls.__init__)

        valid_args = set(signature.parameters.keys())

        supplied_args = set(
            neuron.model_dump(
                exclude_none=True,
                exclude={"type"},
            ).keys()
        )

        invalid = supplied_args - valid_args

        if invalid:
            raise ValueError(f"Invalid params for neuron " f"{neuron.type}: {invalid}")
