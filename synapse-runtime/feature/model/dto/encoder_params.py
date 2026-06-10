from typing import Literal, Annotated
from pydantic import BaseModel, Field


class PoissonEncoderParams(BaseModel):
    type: Literal["poisson"]


class LatencyEncoderParams(BaseModel):
    type: Literal["latency"]
    T: int = 20
    function_type: Literal[
        "linear",
        "log",
    ] = "linear"


EncoderParams = Annotated[
    PoissonEncoderParams | LatencyEncoderParams,
    Field(discriminator="type"),
]
