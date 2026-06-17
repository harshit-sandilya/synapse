export enum EncoderType {
  POISSON = "poisson",
  LATENCY = "latency",
}

export enum LatencyEncoderFunctionType {
  LINEAR = "linear",
  LOG = "log",
}

export enum SurrogateType {
  ATAN = "atan",
  SIGMOID = "sigmoid",
  PIECEWISE_QUADRATIC = "piecewise_quadratic",
  SOFTSIGN = "softsign",
  LEAKY_K_RELU = "leaky_k_relu",
}

export enum NeuronType {
  IF = "IF",
  LIF = "LIF",
  PLIF = "PLIF",
  EIF = "EIF",
  KLIF = "KLIF",
  QIF = "QIF",
  LIAF = "LIAF",
}

export enum LayerType {
  FLATTEN = "Flatten",
  LINEAR = "Linear",
  CONV_1D = "Conv1D",
  CONV_2D = "Conv2D",
  CONV_3D = "Conv3D",
  MAX_POOL_1D = "MaxPool1D",
  MAX_POOL_2D = "MaxPool2D",
  MAX_POOL_3D = "MaxPool3D",
  AVG_POOL_1D = "AvgPool1D",
  AVG_POOL_2D = "AvgPool2D",
  AVG_POOL_3D = "AvgPool3D",
  BATCH_NORM_1D = "BatchNorm1D",
  BATCH_NORM_2D = "BatchNorm2D",
  BATCH_NORM_3D = "BatchNorm3D",
  DROPOUT = "Dropout",
}
