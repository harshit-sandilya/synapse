from spikingjelly.activation_based import neuron

from feature.model.registry.neuron_registry import (
    NEURON_REGISTRY,
)


class NeuronBuilder:

    @staticmethod
    def build(
        neuron_config,
        surrogate_function,
    ):
        if neuron_config is None:
            return None

        neuron_type = neuron_config.type
        neuron_cls = NEURON_REGISTRY[neuron_type]

        params = neuron_config.model_dump(
            exclude={"type"},
            exclude_none=True,
        )

        params["surrogate_function"] = surrogate_function

        if neuron_type == "PLIF":
            if "tau" in params:
                params["init_tau"] = params.pop("tau")

        return neuron_cls(**params)
