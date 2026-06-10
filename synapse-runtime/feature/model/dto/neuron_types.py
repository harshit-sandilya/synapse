from pydantic import BaseModel, Field
from typing import Literal, Annotated


class IFNeuronParams(BaseModel):
    type: Literal["IF"]
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float | None = 0.0
    detach_reset: bool = True


class LIFNeuronParams(BaseModel):
    type: Literal["LIF"]
    tau: float = Field(default=2.0, gt=1.0)
    decay_input: bool = True
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float | None = 0.0
    detach_reset: bool = True


class PLIFNeuronParams(BaseModel):
    type: Literal["PLIF"]
    init_tau: float = Field(default=2.0, gt=1.0)
    decay_input: bool = True
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float | None = 0.0
    detach_reset: bool = True


class EIFNeuronParams(BaseModel):
    type: Literal["EIF"]
    tau: float = Field(default=2.0, gt=1.0)
    delta_T: float = Field(default=1.0, gt=0.0)
    theta_rh: float = 1.0
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float = 0.0
    v_rest: float = 0.0
    detach_reset: bool = True


class KLIFNeuronParams(BaseModel):
    type: Literal["KLIF"]
    tau: float = Field(default=2.0, gt=1.0)
    scale_reset: bool = True
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float = 0.0
    detach_reset: bool = True


class QIFNeuronParams(BaseModel):
    type: Literal["QIF"]
    tau: float = Field(default=2.0, gt=1.0)
    v_c: float = 1.0
    a0: float = Field(default=1.0, gt=0.0)
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float = 0.0
    v_rest: float = 0.0
    detach_reset: bool = True


class LIAFNeuronParams(BaseModel):
    type: Literal["LIAF"]
    tau: float = Field(default=2.0, gt=1.0)
    threshold_related: bool = True
    v_threshold: float = Field(default=1.0, gt=0.0)
    v_reset: float = 0.0
    detach_reset: bool = True


NeuronParams = Annotated[
    IFNeuronParams
    | LIFNeuronParams
    | PLIFNeuronParams
    | EIFNeuronParams
    | KLIFNeuronParams
    | QIFNeuronParams
    | LIAFNeuronParams,
    Field(discriminator="type"),
]
