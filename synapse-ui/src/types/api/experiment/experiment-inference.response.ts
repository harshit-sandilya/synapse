import type { InferenceStatus } from "../../enums/transport.enums";
import type { InferenceResult } from "../../runtime/inference/inference-result.type";
import type { ModelIR } from "../../runtime/model/model-ir.type";

export interface ExperimentInferenceResponse {
  experimentId: string;
  status: InferenceStatus;
  sampleNumber: number | null;
  modelIr: ModelIR | null;
  inferenceResult: InferenceResult | null;
  lastInferenceError: string | null;
}
