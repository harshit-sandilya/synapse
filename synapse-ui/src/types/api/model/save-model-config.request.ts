import type {
  LossFunctionType,
  OptimizerType,
} from "../../enums/transport.enums";
import type { ModelIR } from "../../runtime/model/model-ir.type";

export interface SaveModelConfigRequest {
  experimentId: string;
  modelIr: ModelIR;
  optimizer: OptimizerType;
  lossFunction: LossFunctionType;
  learningRate: number;
  epochs: number;
}
