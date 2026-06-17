export interface PublishedLayerTelemetry {
  layer_index: number;
  layer_name: string;
  firing_rate: number;
  sparsity: number;
  mean_membrane: number;
  membrane_std: number;
  dead_neuron_ratio: number;
  saturated_neuron_ratio: number;
  threshold: number;
  tau: number | null;
}

export interface PublishedTelemetry {
  timestep: number;
  layers: PublishedLayerTelemetry[];
}
