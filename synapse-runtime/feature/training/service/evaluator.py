import torch

from feature.training.dto.epoch_eval_result import EpochEvalResult
from feature.training.dto.training_context import TrainingContext


class Evaluator:

    @torch.no_grad()
    def evaluate(
        self,
        context: TrainingContext,
    ) -> EpochEvalResult:

        model = context.model
        loss_fn = context.loss_fn

        model.eval()
        model.reset_state()

        total_loss = 0.0
        total_batches = 0

        predictions = []
        targets = []

        for x, y in context.test_loader:
            output, _ = model(x)
            loss = loss_fn(output, y)
            total_loss += loss.item()
            total_batches += 1

            predictions.append(output.detach().cpu())
            targets.append(y.detach().cpu())

            model.reset_state()

        avg_loss = total_loss / total_batches if total_batches > 0 else 0.0

        return EpochEvalResult(
            loss=avg_loss,
            predictions=torch.cat(predictions, dim=0),
            targets=torch.cat(targets, dim=0),
        )
