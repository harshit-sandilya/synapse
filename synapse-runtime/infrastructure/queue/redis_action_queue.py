import redis

from config.runtime_properties import runtime_properties
from common.enums.job_priority import JobPriority

from infrastructure.queue.action_queue import ActionQueue


class RedisActionQueue(ActionQueue):

    def __init__(self):
        self.redis_client = redis.Redis(
            host=runtime_properties.redis_host,
            port=runtime_properties.redis_port,
            decode_responses=True,
        )

    def push(self, priority: JobPriority, payload: str) -> None:
        queue_name = runtime_properties.queue_name(priority)
        self.redis_client.rpush(queue_name, payload)

    def pop(self, priority: JobPriority) -> str | None:
        queue_name = runtime_properties.queue_name(priority)
        return self.redis_client.lpop(queue_name)
