import redis
from infrastructure.event.event_publisher import EventPublisher
from config.runtime_properties import runtime_properties


class RedisEventPublisher(EventPublisher):

    def __init__(self):
        self.redis = redis.Redis(
            host=runtime_properties.redis_host,
            port=runtime_properties.redis_port,
            decode_responses=True,
        )

    def publish(self, topic: str, payload: str):
        self.redis.set(topic, payload)
