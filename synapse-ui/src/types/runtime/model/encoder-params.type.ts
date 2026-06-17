import type {
  EncoderType,
  LatencyEncoderFunctionType,
} from "../../enums/runtime.enums";

export interface PoissonEncoderParams {
  type: EncoderType.POISSON;
}

export interface LatencyEncoderParams {
  type: EncoderType.LATENCY;
  T?: number;
  function_type?: LatencyEncoderFunctionType;
}

export type EncoderParams = PoissonEncoderParams | LatencyEncoderParams;
