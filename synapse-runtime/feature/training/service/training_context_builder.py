from common.logging.logger import get_logger
from common.models.queue.model_training_job import ModelTrainingJob
from feature.training.dto.training_context import TrainingContext
from feature.dataset.dto.dataloader_config import DataloaderConfig
from feature.dataset.loader.parquet_dataloader import ParquetDataLoaderFactory
from feature.model.builder.synapse_model_builder import SynapseModelBuilder
from feature.model.builder.model_sanity_checker import ModelSanityChecker
from feature.model.parser.model_ir_parser import ModelIRParser
from feature.model.validation.model_validator import ModelValidator
from feature.training.dto.training_config import TrainingConfig
from feature.training.registry.loss_registry import LOSS_REGISTRY
from feature.training.registry.optimizer_registry import OPTIMIZER_REGISTRY

logger = get_logger(__name__)


class TrainingContextBuilder:
    def __init__(self, storage, cache):
        self.storage = storage
        self.cache = cache

        self.model_builder = SynapseModelBuilder()
        self.sanity_checker = ModelSanityChecker()

    def build(
        self,
        job: ModelTrainingJob,
        inference_mode: bool = False,
    ) -> TrainingContext:
        logger.info(f"Building training context " f"for experiment={job.experiment_id}")

        # Load configs
        dataset_config_json = self.storage.get_json(job.dataset_config_storage_key)
        training_config_json = self.storage.get_json(job.model_config_storage_key)
        model_ir_json = self.storage.get_json(job.model_ir_storage_key)
        dataset_config = DataloaderConfig.model_validate(dataset_config_json)
        training_config = TrainingConfig.model_validate(training_config_json)
        model_ir = ModelIRParser.parse(model_ir_json)

        if inference_mode:
            dataset_config.batch_size = 1
            dataset_config.num_workers = 0
            dataset_config.shuffle = False
            dataset_config.drop_last = False
            dataset_config.pin_memory = False
            dataset_config.persistent_workers = False

        # Validate model IR
        ModelValidator.validate(model_ir)

        # Create dataloaders
        dataloader_factory = ParquetDataLoaderFactory(
            storage=self.storage,
            cache=self.cache,
        )

        train_loader, test_loader = dataloader_factory.create(
            snapshot_prefix=job.dataset_storage_key,
            config=dataset_config,
        )

        # Infer shapes
        sample_x, sample_y = next(iter(train_loader))
        input_shape = str(list(sample_x.shape))
        output_shape = str(list(sample_y.shape))
        logger.info(
            f"Inferred shapes " f"input={input_shape} " f"output={output_shape}"
        )

        # Build model
        model = self.model_builder.build(
            model_ir=model_ir,
            input_shape=input_shape,
        )

        # Sanity check
        sanity_result = self.sanity_checker.validate(
            model=model,
            output_shape=output_shape,
            task_type=job.task_type,
        )

        if not sanity_result.valid:
            raise ValueError("\n".join(sanity_result.errors))

        # Create optimizer
        optimizer_cls = OPTIMIZER_REGISTRY[training_config.optimizer]
        optimizer = optimizer_cls(
            model.parameters(),
            lr=training_config.learning_rate,
        )

        # Create loss
        loss_cls = LOSS_REGISTRY[training_config.loss_function]
        loss_fn = loss_cls()

        # Runtime artifacts
        experiment_id = str(job.experiment_id)
        telemetry_queue_name = f"telemetry:{experiment_id}"
        metrics_storage_key = (
            f"experiments/" f"{experiment_id}/" f"training/metrics.jsonl"
        )

        checkpoint_storage_key = f"experiments/" f"{experiment_id}/" f"training/best.pt"
        logger.info(f"Training context built " f"for experiment={experiment_id}")

        return TrainingContext(
            model=model,
            optimizer=optimizer,
            loss_fn=loss_fn,
            train_loader=train_loader,
            test_loader=test_loader,
            task_type=job.task_type,
            epochs=training_config.epochs,
            experiment_id=experiment_id,
            workspace_id=str(job.workspace_id),
            telemetry_queue_name=telemetry_queue_name,
            metrics_storage_key=metrics_storage_key,
            checkpoint_storage_key=checkpoint_storage_key,
        )
