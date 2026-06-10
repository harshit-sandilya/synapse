from pydantic import BaseModel


class SimulationParams(BaseModel):
    timesteps: int
