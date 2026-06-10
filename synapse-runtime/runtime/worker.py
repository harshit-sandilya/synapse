import asyncio
import json

from common.enums.job_priority import JobPriority
from infrastructure.queue.redis_action_queue import RedisActionQueue
from runtime.dispatcher import Dispatcher
from common.models.queue.queue_job import QueueJob

from common.logging.logger import get_logger

logger = get_logger(__name__)


class Worker:
    def __init__(self):
        self.queue = RedisActionQueue()
        self.dispatcher = Dispatcher()

    async def start(self):
        logger.info("Runtime worker started")
        while True:
            try:
                job = await self._next_job()
                if job is None:
                    await asyncio.sleep(1)
                    continue
                await self.dispatcher.dispatch(job)

            except Exception:
                logger.exception("Worker execution failed")

    async def _next_job(self):
        for priority in [
            JobPriority.HIGH,
            JobPriority.MEDIUM,
            JobPriority.LOW,
        ]:
            payload = self.queue.pop(priority)
            if payload:
                logger.info(f"Received " f"{priority.name} " f"priority job")
                return QueueJob.model_validate_json(payload)
        return None
