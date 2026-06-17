import type {
  ExperimentTaskType,
  LossFunctionType,
  ModelStatus,
  OptimizerType,
} from "../../enums/transport.enums";
import type { ModelIR } from "../../runtime/model/model-ir.type";

export interface ExperimentModelResponse {
  experimentId: string;
  taskType: ExperimentTaskType;
  modelStatus: ModelStatus;
  modelIr: ModelIR | null;
  inputShape: string | null;
  outputShape: string | null;
  optimizer: OptimizerType | null;
  lossFunction: LossFunctionType | null;
  learningRate: number | null;
  epochs: number | null;
  lastTrainingError: string | null;
}
