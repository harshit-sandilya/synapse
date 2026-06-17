export interface StoredLayerTelemetry {
  layer_index: number;
  layer_name: string;
  spikes: number[][];
  membrane_potentials: number[][];
  threshold: number;
  tau: number | null;
}

export interface StoredModelTelemetry {
  timestep: number;
  layers: StoredLayerTelemetry[];
}
