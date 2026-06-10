from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
)
from common.enums.task_type import TaskType


class MetricsCalculator:

    def calculate(
        self,
        predictions,
        targets,
        loss,
        task_type,
    ) -> dict[str, float]:

        match task_type:

            case TaskType.CLASSIFICATION:
                return self._classification(predictions, targets, loss)

            case TaskType.REGRESSION:
                return self._regression(predictions, targets, loss)

        raise ValueError(f"Unsupported task: {task_type}")

    def _classification(self, predictions, targets, loss):
        preds = predictions.argmax(dim=1).cpu().numpy()
        labels = targets.cpu().numpy()
        return {
            "accuracy": float(accuracy_score(labels, preds)),
            "precision": float(
                precision_score(labels, preds, average="weighted", zero_division=0)
            ),
            "recall": float(
                recall_score(labels, preds, average="weighted", zero_division=0)
            ),
            "f1": float(f1_score(labels, preds, average="weighted", zero_division=0)),
            "loss": float(loss),
        }

    def _regression(self, predictions, targets, loss):
        preds = predictions.detach().cpu().numpy()
        labels = targets.detach().cpu().numpy()
        mse = mean_squared_error(labels, preds)

        return {
            "mse": float(mse),
            "rmse": float(mse**0.5),
            "mae": float(mean_absolute_error(labels, preds)),
            "r2": float(r2_score(labels, preds)),
            "loss": float(loss),
        }
