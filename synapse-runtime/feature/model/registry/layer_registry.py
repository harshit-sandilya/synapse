from spikingjelly.activation_based import layer

LAYER_REGISTRY: dict = {
    "Linear": layer.Linear,
    "Flatten": layer.Flatten,
    "Conv1D": layer.Conv1d,
    "Conv2D": layer.Conv2d,
    "Conv3D": layer.Conv3d,
    "MaxPool1D": layer.MaxPool1d,
    "MaxPool2D": layer.MaxPool2d,
    "MaxPool3D": layer.MaxPool3d,
    "AvgPool1D": layer.AvgPool1d,
    "AvgPool2D": layer.AvgPool2d,
    "AvgPool3D": layer.AvgPool3d,
    "BatchNorm1D": layer.BatchNorm1d,
    "BatchNorm2D": layer.BatchNorm2d,
    "BatchNorm3D": layer.BatchNorm3d,
    "Dropout": layer.Dropout,
}
