import type { ExperimentInferenceResponse } from "@/types/api/experiment/experiment-inference.response";
import type { InferenceQueueResponse } from "@/types/api/inference/inference-queue.response";
import { InferenceStatus } from "@/types/enums/transport.enums";

export interface ExperimentInferenceData {
  inference: ExperimentInferenceResponse | null;
  sampleNumber: string;
  queueResponse: InferenceQueueResponse | null;
  loading: boolean;
  running: boolean;
  error: string | null;
}

export const initialExperimentInferenceData: ExperimentInferenceData = {
  inference: null,
  sampleNumber: "0",
  queueResponse: null,
  loading: false,
  running: false,
  error: null,
};

export function isInferenceTerminal(status: InferenceStatus): boolean {
  return status === InferenceStatus.DONE || status === InferenceStatus.FAILED;
}

export function formatInferenceValue(value: number[] | number): string {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
