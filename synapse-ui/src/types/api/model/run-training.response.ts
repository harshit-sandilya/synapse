import type { ModelStatus } from "../../enums/transport.enums";

export interface RunTrainingResponse {
  experimentId: string;
  status: ModelStatus;
}
