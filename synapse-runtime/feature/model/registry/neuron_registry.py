from spikingjelly.activation_based import neuron

NEURON_REGISTRY: dict = {
    "IF": neuron.IFNode,
    "LIF": neuron.LIFNode,
    "PLIF": neuron.ParametricLIFNode,
    "EIF": neuron.EIFNode,
    "LIAF": neuron.LIAFNode,
    "KLIF": neuron.KLIFNode,
    "QIF": neuron.QIFNode,
}
