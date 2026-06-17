# Transport Data Classes

Scope: transport service request/response DTOs, endpoint shapes, response wrappers, and queue payload classes. Excludes runtime endpoints as primary frontend APIs, but documents them separately because runtime sends them into transport and frontend may see resulting state.

Sources inspected only from backend/transport/runtime:

- `synapse-transport/src/main/java/com/synapse/transport/feature/**/controller/**`
- `synapse-transport/src/main/java/com/synapse/transport/feature/**/dto/**`
- `synapse-transport/src/main/java/com/synapse/transport/exception/dto/**`
- `synapse-transport/src/main/java/com/synapse/transport/common/enums/**`
- `synapse-runtime/common/models/queue/**`

## Common HTTP envelope

All transport success responses use:

Source: `synapse-transport/src/main/java/com/synapse/transport/exception/dto/ApiSuccessResponse.java`

```ts
type ApiSuccessResponse<T> = {
  timestamp: string;
  message: string;
  data: T;
};
```

Errors use:

Source: `synapse-transport/src/main/java/com/synapse/transport/exception/dto/ApiError.java`

```ts
type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: unknown;
  path: string;
};
```

Frontend API layer should unwrap `data` at service boundary, but keep envelope available for error/logging adapters.

## Workspace endpoints

Controller: `WorkspaceController.java`

Base: `/api/v1/workspace`

### `POST /connect`

Request: `WorkspaceConnectionRequest`

```ts
type WorkspaceConnectionRequest = {
  workspaceName: string;
  username: string;
};
```

Response data: `WorkspaceConnectionResponse`

```ts
type WorkspaceConnectionResponse = {
  workspaceId: string;
  memberId: string;
  workspaceName: string;
  username: string;
};
```

### `GET /{id}/experiments`

Response data: `ExperimentSummaryResponse[]`

```ts
type ExperimentSummaryResponse = {
  id: string;
  name: string;
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
};
```

## Experiment endpoints

Controller: `ExperimentController.java`

Base: `/api/v1/experiment`

### `POST /`

Request: `CreateExperimentRequest`

```ts
type CreateExperimentRequest = {
  workspaceId: string;
  memberId: string;
  name: string;
  description: string;
  taskType: ExperimentTaskType;
};
```

Response data: `ExperimentHomeResponse`

### `GET /{id}`

Response data: `ExperimentHomeResponse`

```ts
type ExperimentHomeResponse = {
  workspaceId: string;
  experimentId: string;
  name: string;
  description: string;
  taskType: ExperimentTaskType;
  status: ExperimentStatus;
  datasetReady: ConfigStatus;
  modelReady: ModelStatus;
  inferenceReady: InferenceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
```

### `GET /{id}/dataset`

Response data: `ExperimentDatasetResponse`

```ts
type ExperimentDatasetResponse = {
  experimentId: string;
  datasetStatus: ConfigStatus;
  provider: DatasetProvider;
  datasetName: string;
  trainSampleCount: number | null;
  testSampleCount: number | null;
  inputShape: string | null;
  outputShape: string | null;
  batchSize: number | null;
  numWorkers: number | null;
  shuffle: boolean | null;
  pinMemory: boolean | null;
  dropLast: boolean | null;
  prefetchFactor: number | null;
  persistentWorkers: boolean | null;
  lastValidationError: string | null;
};
```

Nullability note: Java DTO fields are boxed types (`Integer`, `Boolean`) in response. Treat absent config values as nullable until backend guarantees config exists.

### `GET /{id}/model`

Response data: `ExperimentModelResponse`

```ts
type ExperimentModelResponse = {
  experimentId: string;
  taskType: ExperimentTaskType;
  modelStatus: ModelStatus;
  modelIr: ModelIR | null;
  inputShape: string | null;
  outputShape: string | null;
  optimizer: OptimizerType | null;
  lossFunction: LossFunctionType | null;
  learningRate: number | null;
  epochs: number | null;
  lastTrainingError: string | null;
};
```

`modelIr` source type is `JsonNode`; frontend should parse as `ModelIR` at boundary and reject invalid discriminators.

### `GET /{id}/metrics`

Response data: `ExperimentMetricsResponse`

```ts
type MetricSeries = {
  name: string;
  values: number[];
};

type ExperimentMetricsResponse = {
  experimentId: string;
  taskType: ExperimentTaskType;
  finalMetrics: JsonObject;
  trainMetrics: MetricSeries[];
  testMetrics: MetricSeries[];
};
```

`finalMetrics` source type is `Object`; frontend should narrow by `taskType` before rendering.

### `GET /{id}/telemetry`

Response data: `ExperimentTelemetryResponse`

```ts
type ExperimentTelemetryResponse = {
  experimentId: string;
  status: ModelStatus;
  publisherServiceUrl: string | null;
  publisherTopic: string | null;
  startedAt: string | null;
  endedAt: string | null;
};
```

### `GET /{id}/inference`

Response data: `ExperimentInferenceResponse`

```ts
type ExperimentInferenceResponse = {
  experimentId: string;
  status: InferenceStatus;
  sampleNumber: number | null;
  modelIr: ModelIR | null;
  inferenceResult: InferenceResult | null;
  lastInferenceError: string | null;
};
```

`modelIr` and `inferenceResult` source type is `JsonNode`; frontend should parse and validate.

## Dataset endpoints

Controller: `DatasetController.java`

Base: `/api/v1/dataset`

### `POST /`

Request: `SaveDatasetConfigRequest`

```ts
type SaveDatasetConfigRequest = {
  experimentId: string;
  provider: DatasetProvider;
  datasetName: string;
  batchSize: number;
  numWorkers: number;
  shuffle: boolean;
  pinMemory: boolean;
  dropLast: boolean;
  prefetchFactor: number;
  persistentWorkers: boolean;
};
```

Response data: `SaveDatasetConfigResponse`

```ts
type SaveDatasetConfigResponse = {
  experimentId: string;
  provider: DatasetProvider;
  datasetName: string;
  datasetConfigArtifactId: string;
  batchSize: number;
  numWorkers: number;
  shuffle: boolean;
  pinMemory: boolean;
  dropLast: boolean;
  prefetchFactor: number;
  persistentWorkers: boolean;
};
```

### `POST /validate`

Request: `ValidateDatasetRequest`

```ts
type ValidateDatasetRequest = {
  experimentId: string;
};
```

Response data: `ValidateDatasetResponse`

```ts
type ValidateDatasetResponse = {
  experimentId: string;
  status: ConfigStatus;
};
```

## Model endpoints

Controller: `ModelController.java`

Base: `/api/v1/model`

### `POST /`

Request: `SaveModelConfigRequest`

```ts
type SaveModelConfigRequest = {
  experimentId: string;
  modelIr: ModelIR;
  optimizer: OptimizerType;
  lossFunction: LossFunctionType;
  learningRate: number;
  epochs: number;
};
```

Response data: `SaveModelConfigResponse`

```ts
type SaveModelConfigResponse = {
  experimentId: string;
  modelIrArtifactId: string;
  trainingConfigArtifactId: string;
  optimizer: OptimizerType;
  lossFunction: LossFunctionType;
  learningRate: number;
  epochs: number;
};
```

### `POST /train`

Request: `RunTrainingRequest`

```ts
type RunTrainingRequest = {
  experimentId: string;
};
```

Response data: `RunTrainingResponse`

```ts
type RunTrainingResponse = {
  experimentId: string;
  status: ModelStatus;
};
```

## Inference endpoints

Controller: `InferenceController.java`

Base: `/api/v1/inference`

### `POST /`

Request: `InferenceQueueRequest`

```ts
type InferenceQueueRequest = {
  experimentId: string;
  sampleNumber: number;
};
```

Response data: `InferenceQueueResponse`

```ts
type InferenceQueueResponse = {
  experimentId: string;
  sampleNumber: number;
  status: InferenceStatus;
};
```

## Pollution guardrails

- Keep transport endpoint DTOs in API layer. Convert to UI view models outside shared data contracts.
- Do not merge runtime callback DTOs into normal user-facing API DTOs.
- Treat `JsonNode` fields as `unknown` until parsed into runtime data classes (`ModelIR`, `InferenceResult`).
- Keep queue data classes separate from endpoint request/response classes.
- Keep envelope (`ApiSuccessResponse<T>`) separate from unwrapped data. Avoid returning envelope-shaped objects from app services unless caller needs metadata.
