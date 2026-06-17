import type { ExperimentStatus } from "../../enums/transport.enums";

export interface ExperimentSummaryResponse {
  id: string;
  name: string;
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
}
