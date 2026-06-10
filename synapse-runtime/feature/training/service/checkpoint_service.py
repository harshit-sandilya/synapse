import torch
import queue
import threading

from common.logging.logger import get_logger
from feature.model.model.synapse_ssn_model import SynapseSNNModel

logger = get_logger(__name__)


class CheckpointService:
    def __init__(self, storage, cache, checkpoint_storage_key: str):
        self.storage = storage
        self.cache = cache
        self.checkpoint_storage_key = checkpoint_storage_key

        self.best_loss = float("inf")
        self.queue: queue.Queue = queue.Queue()
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()

    def checkpoint(self, epoch: int, eval_result, model):
        self.queue.put((epoch, eval_result.loss, model.state_dict()))

    def load_checkpoint(self, model: SynapseSNNModel) -> dict:
        local_path = self.cache.ensure_parent(self.checkpoint_storage_key)

        self.storage.download_file(
            self.checkpoint_storage_key,
            str(local_path),
        )

        checkpoint = torch.load(
            local_path,
            map_location="cpu",
            weights_only=False,
        )

        model.load_state_dict(checkpoint["state_dict"])

        logger.info(
            f"Loaded checkpoint "
            f"epoch={checkpoint.get('epoch')} "
            f"loss={checkpoint.get('loss')}"
        )

        return checkpoint

    def exists(self) -> bool:
        return self.storage.exists(self.checkpoint_storage_key)

    def _worker(self):
        while True:
            epoch, loss, state_dict = self.queue.get()

            try:

                if loss >= self.best_loss:
                    continue

                logger.info(
                    f"Validation improved " f"{self.best_loss:.6f} -> " f"{loss:.6f}"
                )

                self.best_loss = loss

                local_path = self.cache.ensure_parent(self.checkpoint_storage_key)

                torch.save(
                    {
                        "epoch": epoch,
                        "loss": loss,
                        "state_dict": state_dict,
                    },
                    local_path,
                )

                self.storage.upload_file(self.checkpoint_storage_key, str(local_path))

            except Exception:
                logger.exception("Checkpoint save failed")

            finally:
                self.queue.task_done()

    def shutdown(self):
        self.queue.join()
