import type { StoredModelTelemetry } from "../telemetry/stored-model-telemetry.type";

export interface InferenceResult {
  sample_number: number;
  prediction: number[] | number;
  target: number[] | number;
  telemetry: StoredModelTelemetry;
}
