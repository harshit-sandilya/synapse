import queue
import threading
from common.logging.logger import get_logger
from common.models.events.published_telemetry import PublishedTelemetry
from feature.training.service.telemetry_reducer import TelemetryReducer
from infrastructure.event.event_publisher import EventPublisher

logger = get_logger(__name__)


class TelemetryPublisher:
    def __init__(self, publisher: EventPublisher, topic: str):
        self.publisher = publisher
        self.topic = topic
        self.reducer = TelemetryReducer()
        self.queue: queue.Queue = queue.Queue()
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()

    def publish(self, telemetry):
        self.queue.put(telemetry)

    def _worker(self):
        while True:
            telemetry = self.queue.get()

            try:
                reduced: PublishedTelemetry = self.reducer.reduce(telemetry)
                self.publisher.publish(
                    topic=self.topic,
                    payload=reduced.model_dump_json(),
                )
            except Exception:
                logger.exception("Failed publishing telemetry")

            finally:
                self.queue.task_done()

    def shutdown(self):
        self.queue.join()
