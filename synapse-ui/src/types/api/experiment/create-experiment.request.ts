import type { ExperimentTaskType } from "../../enums/transport.enums";

export interface CreateExperimentRequest {
  workspaceId: string;
  memberId: string;
  name: string;
  description: string;
  taskType: ExperimentTaskType;
}
