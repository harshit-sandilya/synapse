from spikingjelly.activation_based import surrogate

SURROGATE_REGISTRY: dict = {
    "atan": surrogate.ATan,
    "sigmoid": surrogate.Sigmoid,
    "piecewise_quadratic": surrogate.PiecewiseQuadratic,
    "softsign": surrogate.SoftSign,
    "leaky_k_relu": surrogate.LeakyKReLU,
}
