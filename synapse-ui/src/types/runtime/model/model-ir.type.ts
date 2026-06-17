import type { EncoderParams } from "./encoder-params.type";
import type { LayerParams } from "./layer-params.type";
import type { SimulationParams } from "./simulation-params.type";
import type { SurrogateParams } from "./surrogate-params.type";

export interface ModelIR {
  simulation: SimulationParams;
  encoder: EncoderParams;
  surrogate: SurrogateParams;
  layers: LayerParams[];
}
