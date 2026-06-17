# Frontend-Maintained Enums

Scope: enum values frontend must keep explicit so data does not go rogue. Source of truth is backend/transport plus runtime. Frontend should reject unknown enum strings at API boundaries and avoid free-form status/type strings in UI state.

## Transport enums

Source: `synapse-transport/src/main/java/com/synapse/transport/common/enums`

### `ArtifactType`

Source: `ArtifactType.java`

Values:

- `DATASET_CONFIG`
- `DATASET_CACHE`
- `MODEL_CONFIG`
- `MODEL_IR`
- `TRAINING_METRICS`
- `CHECKPOINT`
- `INFERENCE_RESULT`

### `ConfigStatus`

Source: `ConfigStatus.java`

Values:

- `NOT_CONFIGURED`
- `CONFIGURED`
- `VALIDATING`
- `READY`
- `FAILED`

### `DatasetProvider`

Source: `DatasetProvider.java`

Values:

- `PYTORCH`

### `EncodingScheme`

Source: `EncodingScheme.java`

Values:

- `LATENCY`
- `POISSON`

### `ExperimentStatus`

Source: `ExperimentStatus.java`

Values:

- `DRAFT`
- `READY`
- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`

### `ExperimentTaskType`

Source: `ExperimentTaskType.java`

Values:

- `CLASSIFICATION`
- `REGRESSION`

Runtime source name: `TaskType` in `synapse-runtime/common/enums/task_type.py` with same values.

### `InferenceStatus`

Source: `InferenceStatus.java`

Values:

- `NOT_CONFIGURED`
- `CONFIGURED`
- `QUEUED`
- `DONE`
- `FAILED`

### `LossFunctionType`

Source: `LossFunctionType.java`

Values:

- `CROSS_ENTROPY`
- `NLL_LOSS`
- `MSE`
- `MAE`
- `HUBER`

Runtime same values in `synapse-runtime/common/enums/loss_function_type.py`.

### `ModelStatus`

Source: `ModelStatus.java`

Values:

- `NOT_CONFIGURED`
- `CONFIGURED`
- `QUEUED`
- `TRAINING`
- `DONE`
- `FAILED`

### `OptimizerType`

Source: `OptimizerType.java`

Values:

- `SGD`
- `ADAM`
- `ADAMW`
- `RMSPROP`

Runtime same values in `synapse-runtime/common/enums/optimizer_type.py`.

## Runtime model discriminators

Frontend must also maintain these literal unions for model IR builders/editors. These are not Java enums; they are Pydantic discriminators in runtime model DTOs.

### Encoder `type`

Source: `synapse-runtime/feature/model/dto/encoder_params.py`

- `poisson`
- `latency`

`latency.function_type` values:

- `linear`
- `log`

### Surrogate `type`

Source: `synapse-runtime/feature/model/dto/surrogate_params.py`

- `atan`
- `sigmoid`
- `piecewise_quadratic`
- `softsign`
- `leaky_k_relu`

### Neuron `type`

Source: `synapse-runtime/feature/model/dto/neuron_types.py`

- `IF`
- `LIF`
- `PLIF`
- `EIF`
- `KLIF`
- `QIF`
- `LIAF`

### Layer `type`

Source: `synapse-runtime/feature/model/dto/layer_params.py`

- `Flatten`
- `Linear`
- `Conv1D`
- `Conv2D`
- `Conv3D`
- `MaxPool1D`
- `MaxPool2D`
- `MaxPool3D`
- `AvgPool1D`
- `AvgPool2D`
- `AvgPool3D`
- `BatchNorm1D`
- `BatchNorm2D`
- `BatchNorm3D`
- `Dropout`

## Frontend guard rules

- Use string literal unions or enums, not raw `string`.
- Parse inbound API data through enum guards at boundary.
- Treat runtime subsets as producer constraints, not frontend full-domain constraints. Example: transport can show `NOT_CONFIGURED`, runtime only emits terminal `READY`/`FAILED` for dataset validation.
- Keep model discriminator values case-sensitive. Runtime uses mixed casing (`Conv2D`, `IF`) and lowercase snake case (`piecewise_quadratic`).
- Do not invent UI-only statuses inside core API/runtime models. If UI needs local state, namespace separately (example: `FrontendLoadingState`) and never send it to backend.
