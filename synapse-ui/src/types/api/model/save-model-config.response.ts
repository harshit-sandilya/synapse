import type {
  LossFunctionType,
  OptimizerType,
} from "../../enums/transport.enums";

export interface SaveModelConfigResponse {
  experimentId: string;
  modelIrArtifactId: string;
  trainingConfigArtifactId: string;
  optimizer: OptimizerType;
  lossFunction: LossFunctionType;
  learningRate: number;
  epochs: number;
}
