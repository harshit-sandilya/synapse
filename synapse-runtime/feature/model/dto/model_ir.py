from pydantic import BaseModel
from feature.model.dto.simulation_params import SimulationParams
from feature.model.dto.encoder_params import EncoderParams
from feature.model.dto.surrogate_params import SurrogateParams
from feature.model.dto.layer_params import LayerParams


class ModelIR(BaseModel):
    simulation: SimulationParams
    encoder: EncoderParams
    surrogate: SurrogateParams
    layers: list[LayerParams]
