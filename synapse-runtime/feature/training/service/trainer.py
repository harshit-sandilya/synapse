import torch

from feature.training.dto.epoch_train_result import EpochTrainResult
from feature.training.dto.training_context import TrainingContext
from feature.training.service.telemetry_publisher import TelemetryPublisher


class Trainer:

    def __init__(self, telemetry_publisher: TelemetryPublisher):
        self.telemetry_publisher = telemetry_publisher

    def train_epoch(self, context: TrainingContext) -> EpochTrainResult:

        model = context.model
        optimizer = context.optimizer
        loss_fn = context.loss_fn

        model.train()

        total_loss = 0.0
        total_batches = 0

        predictions = []
        targets = []

        for x, y in context.train_loader:
            optimizer.zero_grad()
            output, telemetry = model(x)
            loss = loss_fn(output, y)
            loss.backward()
            optimizer.step()
            model.reset_state()

            total_loss += loss.item()
            total_batches += 1

            predictions.append(output.detach().cpu())
            targets.append(y.detach().cpu())

            self.telemetry_publisher.publish(telemetry)

        avg_loss = total_loss / total_batches if total_batches > 0 else 0.0

        return EpochTrainResult(
            loss=avg_loss,
            predictions=torch.cat(predictions, dim=0),
            targets=torch.cat(targets, dim=0),
        )
