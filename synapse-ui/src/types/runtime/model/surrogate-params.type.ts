import type { SurrogateType } from "../../enums/runtime.enums";

export interface ATanSurrogateParams {
  type: SurrogateType.ATAN;
  alpha?: number;
}

export interface SigmoidSurrogateParams {
  type: SurrogateType.SIGMOID;
  alpha?: number;
}

export interface PiecewiseQuadraticSurrogateParams {
  type: SurrogateType.PIECEWISE_QUADRATIC;
  alpha?: number;
}

export interface SoftSignSurrogateParams {
  type: SurrogateType.SOFTSIGN;
  alpha?: number;
}

export interface LeakyKReLUSurrogateParams {
  type: SurrogateType.LEAKY_K_RELU;
  leak?: number;
  k?: number;
}

export type SurrogateParams =
  | ATanSurrogateParams
  | SigmoidSurrogateParams
  | PiecewiseQuadraticSurrogateParams
  | SoftSignSurrogateParams
  | LeakyKReLUSurrogateParams;
