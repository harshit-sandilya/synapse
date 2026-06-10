from pydantic import BaseModel, Field
from typing import Literal, Annotated


class ATanSurrogateParams(BaseModel):
    type: Literal["atan"]
    alpha: float = 2.0


class SigmoidSurrogateParams(BaseModel):
    type: Literal["sigmoid"]
    alpha: float = 4.0


class PiecewiseQuadraticParams(BaseModel):
    type: Literal["piecewise_quadratic"]
    alpha: float = 1.0


class SoftSignParams(BaseModel):
    type: Literal["softsign"]
    alpha: float = 2.0


class LeakyKReLUParams(BaseModel):
    type: Literal["leaky_k_relu"]
    leak: float = 0.01
    k: float = 1.0


SurrogateParams = Annotated[
    ATanSurrogateParams
    | SigmoidSurrogateParams
    | PiecewiseQuadraticParams
    | SoftSignParams
    | LeakyKReLUParams,
    Field(discriminator="type"),
]
