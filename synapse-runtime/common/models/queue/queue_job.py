from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

from common.enums.job_type import JobType

T = TypeVar("T")


class QueueJob(BaseModel, Generic[T]):
    timestamp: datetime
    message: str
    job_type: JobType = Field(alias="jobType")
    payload: T
