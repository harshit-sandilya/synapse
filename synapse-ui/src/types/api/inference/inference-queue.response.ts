import type { InferenceStatus } from "../../enums/transport.enums";

export interface InferenceQueueResponse {
  experimentId: string;
  sampleNumber: number;
  status: InferenceStatus;
}
