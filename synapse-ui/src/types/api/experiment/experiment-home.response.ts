import type {
  ConfigStatus,
  ExperimentStatus,
  ExperimentTaskType,
  InferenceStatus,
  ModelStatus,
} from "../../enums/transport.enums";

export interface ExperimentHomeResponse {
  workspaceId: string;
  experimentId: string;
  name: string;
  description: string;
  taskType: ExperimentTaskType;
  status: ExperimentStatus;
  datasetReady: ConfigStatus;
  modelReady: ModelStatus;
  inferenceReady: InferenceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
