from dataclasses import dataclass
import os
from common.enums.job_priority import JobPriority


@dataclass(frozen=True)
class RuntimeProperties:
    transport_url: str

    redis_host: str
    redis_port: int

    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str

    action_queue_prefix: str
    runtime_cache_dir: str

    def queue_name(self, priority: JobPriority) -> str:
        return f"{self.action_queue_prefix}:" f"{priority.value.lower()}"

    @property
    def redis_url(self) -> str:
        return f"redis://" f"{self.redis_host}:" f"{self.redis_port}"

    def validate(self) -> None:
        required = {
            "transport_url": self.transport_url,
            "redis_host": self.redis_host,
            "redis_port": self.redis_port,
            "minio_endpoint": self.minio_endpoint,
            "action_queue_prefix": self.action_queue_prefix,
        }

        missing = [key for key, value in required.items() if not value]

        if missing:
            raise ValueError(f"Missing configuration: {missing}")


def load_runtime_properties() -> RuntimeProperties:
    return RuntimeProperties(
        transport_url=os.getenv(
            "TRANSPORT_URL",
            "http://localhost:8080",
        ),
        redis_host=os.getenv(
            "REDIS_HOST",
            "localhost",
        ),
        redis_port=int(
            os.getenv(
                "REDIS_PORT",
                "6379",
            )
        ),
        minio_endpoint=os.getenv(
            "MINIO_ENDPOINT",
            "http://localhost:9000",
        ),
        minio_access_key=os.getenv(
            "MINIO_ACCESS_KEY",
            "",
        ),
        minio_secret_key=os.getenv(
            "MINIO_SECRET_KEY",
            "",
        ),
        minio_bucket=os.getenv(
            "MINIO_BUCKET",
            "synapse-dev",
        ),
        action_queue_prefix=os.getenv(
            "ACTION_QUEUE_PREFIX",
            "synapse:jobs",
        ),
        runtime_cache_dir=os.getenv(
            "RUNTIME_CACHE_DIR",
            "/tmp/synapse",
        ),
    )


runtime_properties = load_runtime_properties()
