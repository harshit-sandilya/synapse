import queue
import threading
import time

from common.logging.logger import get_logger
from common.models.events.published_telemetry import PublishedTelemetry
from feature.training.service.telemetry_reducer import TelemetryReducer
from infrastructure.event.event_publisher import EventPublisher

logger = get_logger(__name__)


class TelemetryPublisher:
    def __init__(self, publisher: EventPublisher, topic: str, mode: str = "async"):
        if mode not in {"async", "sync"}:
            raise ValueError("TelemetryPublisher mode must be 'async' or 'sync'")

        self.publisher = publisher
        self.topic = topic
        self.mode = mode
        self.reducer = TelemetryReducer()
        self.sequence_id = 0
        self.queue: queue.Queue = queue.Queue()
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()

    def publish(self, telemetry):
        if telemetry is None:
            return

        self.sequence_id += 1

        if telemetry.emitted_at_ms is None:
            telemetry.emitted_at_ms = time.time() * 1000.0

        telemetry.sequence_id = self.sequence_id

        if self.mode == "sync":
            self._publish_now(telemetry)
            return

        self.queue.put(telemetry)

    def _worker(self):
        while True:
            telemetry = self.queue.get()

            try:
                self._publish_now(telemetry)
            except Exception:
                logger.exception("Failed publishing telemetry")

            finally:
                self.queue.task_done()

    def _publish_now(self, telemetry):
        reduced: PublishedTelemetry = self.reducer.reduce(telemetry)
        self.publisher.publish(
            topic=self.topic,
            payload=reduced.model_dump_json(),
        )

    def shutdown(self):
        self.queue.join()
