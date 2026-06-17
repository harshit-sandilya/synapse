import type { LayerType } from "../../enums/runtime.enums";
import type { NeuronParams } from "./neuron-params.type";

export interface FlattenLayerParams {
  type: LayerType.FLATTEN;
}

export interface LinearLayerParams {
  type: LayerType.LINEAR;
  out_features: number;
  bias?: boolean;
  neuron?: NeuronParams | null;
}

export interface Conv1DLayerParams {
  type: LayerType.CONV_1D;
  out_channels: number;
  kernel_size: number;
  stride?: number;
  padding?: number;
  bias?: boolean;
  neuron?: NeuronParams | null;
}

export interface Conv2DLayerParams {
  type: LayerType.CONV_2D;
  out_channels: number;
  kernel_size: number | [number, number];
  stride?: number | [number, number];
  padding?: number | [number, number];
  bias?: boolean;
  neuron?: NeuronParams | null;
}

export interface Conv3DLayerParams {
  type: LayerType.CONV_3D;
  out_channels: number;
  kernel_size: number | [number, number, number];
  stride?: number | [number, number, number];
  padding?: number | [number, number, number];
  bias?: boolean;
  neuron?: NeuronParams | null;
}

export interface MaxPool1DLayerParams {
  type: LayerType.MAX_POOL_1D;
  kernel_size: number;
  stride?: number | null;
}

export interface MaxPool2DLayerParams {
  type: LayerType.MAX_POOL_2D;
  kernel_size: number;
  stride?: number | null;
}

export interface MaxPool3DLayerParams {
  type: LayerType.MAX_POOL_3D;
  kernel_size: number;
  stride?: number | null;
}

export interface AvgPool1DLayerParams {
  type: LayerType.AVG_POOL_1D;
  kernel_size: number;
  stride?: number | null;
}

export interface AvgPool2DLayerParams {
  type: LayerType.AVG_POOL_2D;
  kernel_size: number;
  stride?: number | null;
}

export interface AvgPool3DLayerParams {
  type: LayerType.AVG_POOL_3D;
  kernel_size: number;
  stride?: number | null;
}

export interface BatchNorm1DLayerParams {
  type: LayerType.BATCH_NORM_1D;
}

export interface BatchNorm2DLayerParams {
  type: LayerType.BATCH_NORM_2D;
}

export interface BatchNorm3DLayerParams {
  type: LayerType.BATCH_NORM_3D;
}

export interface DropoutLayerParams {
  type: LayerType.DROPOUT;
  p?: number;
}

export type LayerParams =
  | FlattenLayerParams
  | LinearLayerParams
  | Conv1DLayerParams
  | Conv2DLayerParams
  | Conv3DLayerParams
  | MaxPool1DLayerParams
  | MaxPool2DLayerParams
  | MaxPool3DLayerParams
  | AvgPool1DLayerParams
  | AvgPool2DLayerParams
  | AvgPool3DLayerParams
  | BatchNorm1DLayerParams
  | BatchNorm2DLayerParams
  | BatchNorm3DLayerParams
  | DropoutLayerParams;
