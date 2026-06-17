import type { NeuronType } from "../../enums/runtime.enums";

export interface IFNeuronParams {
  type: NeuronType.IF;
  v_threshold?: number;
  v_reset?: number | null;
  detach_reset?: boolean;
}

export interface LIFNeuronParams {
  type: NeuronType.LIF;
  tau?: number;
  decay_input?: boolean;
  v_threshold?: number;
  v_reset?: number | null;
  detach_reset?: boolean;
}

export interface PLIFNeuronParams {
  type: NeuronType.PLIF;
  init_tau?: number;
  decay_input?: boolean;
  v_threshold?: number;
  v_reset?: number | null;
  detach_reset?: boolean;
}

export interface EIFNeuronParams {
  type: NeuronType.EIF;
  tau?: number;
  delta_T?: number;
  theta_rh?: number;
  v_threshold?: number;
  v_reset?: number;
  v_rest?: number;
  detach_reset?: boolean;
}

export interface KLIFNeuronParams {
  type: NeuronType.KLIF;
  tau?: number;
  scale_reset?: boolean;
  v_threshold?: number;
  v_reset?: number;
  detach_reset?: boolean;
}

export interface QIFNeuronParams {
  type: NeuronType.QIF;
  tau?: number;
  v_c?: number;
  a0?: number;
  v_threshold?: number;
  v_reset?: number;
  v_rest?: number;
  detach_reset?: boolean;
}

export interface LIAFNeuronParams {
  type: NeuronType.LIAF;
  tau?: number;
  threshold_related?: boolean;
  v_threshold?: number;
  v_reset?: number;
  detach_reset?: boolean;
}

export type NeuronParams =
  | IFNeuronParams
  | LIFNeuronParams
  | PLIFNeuronParams
  | EIFNeuronParams
  | KLIFNeuronParams
  | QIFNeuronParams
  | LIAFNeuronParams;
