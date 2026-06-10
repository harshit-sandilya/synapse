from spikingjelly.activation_based import encoding

ENCODER_REGISTRY: dict = {
    "poisson": encoding.PoissonEncoder,
    "latency": encoding.LatencyEncoder,
}
