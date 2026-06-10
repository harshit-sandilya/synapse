from pydantic import BaseModel, Field
from typing import Literal, Annotated
from feature.model.dto.neuron_types import NeuronParams


class FlattenLayer(BaseModel):
    type: Literal["Flatten"]


class LinearLayer(BaseModel):
    type: Literal["Linear"]
    out_features: int
    bias: bool = True
    neuron: NeuronParams | None = None


class Conv1DLayer(BaseModel):
    type: Literal["Conv1D"]
    out_channels: int
    kernel_size: int
    stride: int = 1
    padding: int = 0
    bias: bool = True
    neuron: NeuronParams | None = None


class Conv2DLayer(BaseModel):
    type: Literal["Conv2D"]
    out_channels: int
    kernel_size: int | tuple[int, int]
    stride: int | tuple[int, int] = 1
    padding: int | tuple[int, int] = 0
    bias: bool = True
    neuron: NeuronParams | None = None


class Conv3DLayer(BaseModel):
    type: Literal["Conv3D"]
    out_channels: int
    kernel_size: int | tuple[int, int, int]
    stride: int | tuple[int, int, int] = 1
    padding: int | tuple[int, int, int] = 0
    bias: bool = True
    neuron: NeuronParams | None = None


class MaxPool1DLayer(BaseModel):
    type: Literal["MaxPool1D"]
    kernel_size: int
    stride: int | None = None


class MaxPool2DLayer(BaseModel):
    type: Literal["MaxPool2D"]
    kernel_size: int
    stride: int | None = None


class MaxPool3DLayer(BaseModel):
    type: Literal["MaxPool3D"]
    kernel_size: int
    stride: int | None = None


class AvgPool1DLayer(BaseModel):
    type: Literal["AvgPool1D"]
    kernel_size: int
    stride: int | None = None


class AvgPool2DLayer(BaseModel):
    type: Literal["AvgPool2D"]
    kernel_size: int
    stride: int | None = None


class AvgPool3DLayer(BaseModel):
    type: Literal["AvgPool3D"]
    kernel_size: int
    stride: int | None = None


class BatchNorm1DLayer(BaseModel):
    type: Literal["BatchNorm1D"]


class BatchNorm2DLayer(BaseModel):
    type: Literal["BatchNorm2D"]


class BatchNorm3DLayer(BaseModel):
    type: Literal["BatchNorm3D"]


class DropoutLayer(BaseModel):
    type: Literal["Dropout"]
    p: float = 0.5


LayerParams = Annotated[
    FlattenLayer
    | LinearLayer
    | Conv1DLayer
    | Conv2DLayer
    | Conv3DLayer
    | MaxPool1DLayer
    | MaxPool2DLayer
    | MaxPool3DLayer
    | AvgPool1DLayer
    | AvgPool2DLayer
    | AvgPool3DLayer
    | BatchNorm1DLayer
    | BatchNorm2DLayer
    | BatchNorm3DLayer
    | DropoutLayer,
    Field(discriminator="type"),
]
