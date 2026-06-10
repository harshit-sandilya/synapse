import json
import queue
import threading
from common.logging.logger import get_logger
from feature.training.service.metrics_calculator import MetricsCalculator

logger = get_logger(__name__)


class MetricsWriter:

    def __init__(self, storage, cache, metrics_storage_key: str, task_type):
        self.storage = storage
        self.cache = cache
        self.metrics_storage_key = metrics_storage_key
        self.task_type = task_type

        self.calculator = MetricsCalculator()

        self.queue: queue.Queue = queue.Queue()
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()

    def write(self, epoch: int, train_result, eval_result):
        self.queue.put((epoch, train_result, eval_result))

    def _worker(self):
        while True:
            epoch, train_result, eval_result = self.queue.get()

            try:
                train_metrics = self.calculator.calculate(
                    predictions=train_result.predictions,
                    targets=train_result.targets,
                    loss=train_result.loss,
                    task_type=self.task_type,
                )

                eval_metrics = self.calculator.calculate(
                    predictions=eval_result.predictions,
                    targets=eval_result.targets,
                    loss=eval_result.loss,
                    task_type=self.task_type,
                )

                record = {
                    "epoch": epoch,
                    "train_metrics": train_metrics,
                    "test_metrics": eval_metrics,
                }

                self._append_record(record)

            except Exception:
                logger.exception("Metrics writer failed")

            finally:
                self.queue.task_done()

    def _append_record(
        self,
        record: dict,
    ):
        local_path = self.cache.ensure_parent(self.metrics_storage_key)

        with open(local_path, "a", encoding="utf-8") as fp:
            fp.write(json.dumps(record))
            fp.write("\n")

        self.storage.upload_file(self.metrics_storage_key, str(local_path))

    def shutdown(self):
        self.queue.join()
