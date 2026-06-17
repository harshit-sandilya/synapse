# Synapse Frontend Flow

This document is frontend implementation reference. It compiles flow from existing docs, with `docs/*-context.md`, `docs/*-data-classes.md`, and `docs/frontend-enums.md` treated as source of truth.

Goal: make screen services, controllers, stores, and view models easy to build without re-reading backend/runtime docs.

---

## 1. System roles

```text
Frontend IDE
  |
  | HTTP API
  v
Transport service
  |
  +-- PostgreSQL metadata
  +-- MinIO immutable artifacts
  +-- Redis job queue
  +-- Telemetry discovery
  v
Runtime workers
```

Responsibilities:

| Layer      | Owns                                                                                                                | Does not own                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Frontend   | user flow, forms, graph model builder, local UI state, API unwrapping, screen view models                           | ML execution, queue internals, MinIO access |
| Transport  | workspace/experiment metadata, screen APIs, artifact references, queue creation, runtime callbacks, metrics parsing | training/dataset/inference computation      |
| Runtime    | dataset validation, model construction, training, telemetry publishing, checkpointing, inference                    | frontend-facing screen state                |
| MinIO      | artifact files                                                                                                      | UI state                                    |
| Redis      | job queue, telemetry transport                                                                                      | durable metadata                            |
| PostgreSQL | durable metadata, statuses, artifact references, final metrics                                                      | large JSON/blob artifact payloads           |

Hard frontend rules:

1. Frontend talks to Transport APIs, not Runtime workers.
2. Frontend never reads MinIO directly.
3. Frontend never knows Redis queue payload internals during normal UI flow.
4. Transport responses use `ApiSuccessResponse<T>`; services unwrap `data`.
5. `JsonNode`/JSON fields from API are `unknown` until parsed into frontend-safe types.
6. Enums/discriminators are strict, case-sensitive, and validated at API boundary.

---

## 2. Feature architecture pattern

Each feature should follow MVC-style split:

```text
features/<feature>/
  model.ts       # DTO imports/type guards/view models/screen state
  service.ts     # HTTP calls, response envelope unwrap, DTO parsing
  controller.ts  # business flow, validation, orchestration
  store.ts       # Zustand state + controller binding
```

Views should:

- read store state
- call controller/store actions
- render view models
- avoid endpoint knowledge
- avoid backend DTO mutation

Services should:

- call exact Transport endpoints
- unwrap `ApiSuccessResponse<T>.data`
- map transport errors into service errors
- parse enum/discriminator values
- return typed DTOs or feature view models

Controllers should:

- enforce flow order
- block invalid transitions in UI before backend rejects
- refresh screen state after mutating calls
- navigate between routes when needed

Stores should:

- hold screen loading/error/submission state
- hold current entity IDs
- expose actions used by views

---

## 3. Common API envelope

All successful Transport responses:

```ts
type ApiSuccessResponse<T> = {
  timestamp: string;
  message: string;
  data: T;
};
```

Errors:

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

Frontend service boundary:

```text
HTTP response envelope
  -> unwrap data
  -> validate enum/discriminator fields
  -> parse JSON fields if screen needs them
  -> return frontend DTO/view model
```

Do not leak `ApiSuccessResponse<T>` into view state unless UI explicitly needs metadata like `timestamp`.

---

## 4. Core routes and product flow

```text
/                         Home / workspace connect
/session                  Workspace dashboard + experiments
/experiment/new           Experiment creation
/experiment/:id           Experiment IDE shell
/experiment/:id/home      IDE Home screen
/experiment/:id/dataset   Dataset screen
/experiment/:id/model     Model builder/training config screen
/experiment/:id/telemetry Live telemetry screen
/experiment/:id/metrics   Metrics screen
/experiment/:id/inference Inference screen
```

If using nested route state instead of actual nested URLs, keep same conceptual screens in IDE sidebar.

Full user journey:

```text
User opens Home
  -> connects workspace
  -> lands on Workspace / Session dashboard
  -> gets experiments for workspace
  -> creates or opens experiment
  -> enters Experiment IDE
  -> configures dataset
  -> validates dataset
  -> configures model + training config
  -> queues training
  -> watches telemetry
  -> checks final metrics
  -> runs inference on test sample
```

---

## 5. Workspace connection flow

Workspace connect replaces older "runtime session" naming in docs for frontend API purposes. UI can still display connection/session wording, but service model should use workspace DTOs.

### Endpoint

```http
POST /api/v1/workspace/connect
```

Request:

```ts
type WorkspaceConnectionRequest = {
  workspaceName: string;
  username: string;
};
```

Response data:

```ts
type WorkspaceConnectionResponse = {
  workspaceId: string;
  memberId: string;
  workspaceName: string;
  username: string;
};
```

### Frontend state

Suggested local entry:

```ts
type WorkspaceSession = {
  workspaceId: string;
  memberId: string;
  workspaceName: string;
  username: string;
  lastConnected: number;
};
```

Persist locally with Zustand persist:

```text
localStorage
  currentWorkspaceSession
  savedWorkspaceSessions
```

### Controller flow

```text
Home form submit
  -> validate workspaceName + username
  -> workspaceService.connect({ workspaceName, username })
  -> save/update WorkspaceSession locally
  -> set currentWorkspaceSession
  -> navigate /session
```

### MVC pieces

```text
features/workspace-connect/
  model.ts       WorkspaceConnectionRequest/Response, WorkspaceSession
  service.ts     connectWorkspace()
  controller.ts  connect(), connectSaved(), disconnect()
  store.ts       current session, saved sessions, loading/error
```

---

## 6. Workspace experiments flow

Workspace dashboard loads experiments for connected workspace.

### Endpoint

```http
GET /api/v1/workspace/{workspaceId}/experiments
```

Response data:

```ts
type ExperimentSummaryResponse = {
  id: string;
  name: string;
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
};
```

### Controller flow

```text
/session mounts
  -> require currentWorkspaceSession
  -> experimentListService.getWorkspaceExperiments(workspaceId)
  -> parse statuses/timestamps
  -> populate list store
  -> render cards
```

### UI states

- no workspace session: redirect `/`
- loading experiments
- empty experiments: show empty state + create button
- error: retry
- loaded: show cards

### MVC pieces

```text
features/experiment-list/
  model.ts       ExperimentSummary, list state
  service.ts     getWorkspaceExperiments(workspaceId)
  controller.ts  loadExperiments(), openExperiment(), createExperiment()
  store.ts       experiments/loading/error
```

---

## 7. Experiment creation flow

Experiment creation registers metadata only. No dataset, model, training, telemetry, or inference data should be sent here.

### Endpoint

```http
POST /api/v1/experiment/
```

Request:

```ts
type CreateExperimentRequest = {
  workspaceId: string;
  memberId: string;
  name: string;
  description: string;
  taskType: ExperimentTaskType;
};
```

Response data: `ExperimentHomeResponse`.

### Controller flow

```text
Click + on /session
  -> navigate /experiment/new
  -> user fills name, description, taskType
  -> require currentWorkspaceSession.workspaceId + memberId
  -> experimentCreateService.createExperiment(request)
  -> receive ExperimentHomeResponse
  -> navigate /experiment/{experimentId}
```

### Default post-create experiment state

Expected initial readiness:

```text
datasetReady = NOT_CONFIGURED
modelReady = NOT_CONFIGURED
inferenceReady = NOT_CONFIGURED
status = DRAFT
```

Backend source of truth may return exact values; frontend should display response, not invent final state.

### MVC pieces

```text
features/experiment-create/
  model.ts       CreateExperimentForm, CreateExperimentRequest
  service.ts     createExperiment()
  controller.ts  submitCreateExperiment()
  store.ts       form/submitting/error
```

---

## 8. Experiment IDE shell

IDE shell owns experiment ID context and screen navigation.

```text
Experiment IDE
  Sidebar
    Home
    Dataset
    Model
    Telemetry
    Metrics
    Inference
```

Shell responsibilities:

- parse `experimentId` from route
- keep active tab/route
- render common experiment header/status
- protect screens from missing `experimentId`
- optionally preload Home response for global readiness badges

Suggested feature:

```text
features/experiment-ide/
  model.ts       ExperimentIdeRouteState, SidebarItem
  controller.ts  navigateTab(), ensureExperimentId()
  store.ts       activeTab, cachedHomeSummary
```

---

## 9. IDE Home screen

Read-only overview: identity, status, readiness.

### Endpoint

```http
GET /api/v1/experiment/{experimentId}
```

Response data:

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

### Controller flow

```text
Home screen mounts
  -> experimentHomeService.getHome(experimentId)
  -> parse enum fields
  -> derive readiness cards
  -> render read-only overview
```

### Derived UI model

```ts
type ExperimentReadiness = {
  dataset: ConfigStatus;
  model: ModelStatus;
  inference: InferenceStatus;
  canConfigureModel: boolean; // datasetReady === READY
  canTrain: boolean; // datasetReady === READY && modelReady === CONFIGURED
  canRunInference: boolean; // modelReady === DONE
};
```

### MVC pieces

```text
features/experiment-home/
  model.ts       ExperimentHomeResponse, readiness view model
  service.ts     getExperimentHome(experimentId)
  controller.ts  loadHome()
  store.ts       home/loading/error
```

---

## 10. Dataset screen flow

Dataset screen configures and validates dataset. Save config and validate are separate actions.

### Read endpoint

```http
GET /api/v1/experiment/{experimentId}/dataset
```

Response data:

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

Nullable fields mean config may not exist yet.

### Save config endpoint

```http
POST /api/v1/dataset/
```

Request:

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

Response data:

```ts
type SaveDatasetConfigResponse = SaveDatasetConfigRequest & {
  datasetConfigArtifactId: string;
};
```

Transport stores `DATASET_CONFIG` artifact and metadata row. Experiment dataset status moves toward pending/configured state per backend.

### Validate endpoint

```http
POST /api/v1/dataset/validate
```

Request:

```ts
type ValidateDatasetRequest = {
  experimentId: string;
};
```

Response data:

```ts
type ValidateDatasetResponse = {
  experimentId: string;
  status: ConfigStatus;
};
```

Transport queues `DatasetValidationJob`. Runtime validates dataset, creates dataset snapshot, computes shapes/counts, calls Transport callback. Final result becomes `READY` or `FAILED`.

### Controller flow

```text
Dataset screen mounts
  -> loadDataset(experimentId)
  -> if no config, initialize form defaults

User edits form
  -> local form state only

User clicks Save
  -> validate form locally
  -> POST /api/v1/dataset/
  -> refresh GET /experiment/{id}/dataset

User clicks Validate
  -> require saved provider + datasetName + loader config
  -> POST /api/v1/dataset/validate
  -> show status from response
  -> refresh/poll screen state, or subscribe if event bridge exists
  -> display READY metadata or FAILED error
```

### Status behavior

```text
NOT_CONFIGURED -> user has not saved dataset config
CONFIGURED/PENDING/VALIDATING/QUEUED -> config/validation in progress depending backend enum usage
READY -> dataset snapshot exists, shapes/counts available
FAILED -> validation error available
```

Use backend enum values only. If UI needs `saving` or `loading`, keep it in `FrontendLoadingState`, not `ConfigStatus`.

### MVC pieces

```text
features/experiment-dataset/
  model.ts       dataset DTOs, form type, defaults, view model
  service.ts     getDataset(), saveDatasetConfig(), validateDataset()
  controller.ts  load(), save(), validate(), refreshUntilTerminal()
  store.ts       response/form/loading/saving/validating/error
```

---

## 11. Model screen flow

Model screen contains graph-based visual model builder plus training config. It saves both `modelIr` and training parameters. Training queue is separate.

### Read endpoint

```http
GET /api/v1/experiment/{experimentId}/model
```

Response data:

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

`modelIr` arrives as backend JSON. Parse before using in builder.

### Save endpoint

```http
POST /api/v1/model/
```

Request:

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

Response data:

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

Transport stores `MODEL_IR` and `MODEL_CONFIG` artifacts, then sets model readiness to `CONFIGURED`.

### Train endpoint

```http
POST /api/v1/model/train
```

Request:

```ts
type RunTrainingRequest = {
  experimentId: string;
};
```

Response data:

```ts
type RunTrainingResponse = {
  experimentId: string;
  status: ModelStatus;
};
```

Transport verifies:

```text
datasetReady == READY
modelReady == CONFIGURED
```

Then queues `ModelTrainingJob`, updates model status to `QUEUED`, and runtime later calls training start/end callbacks.

### ModelIR shape

```ts
type ModelIR = {
  simulation: SimulationParams;
  encoder: EncoderParams;
  surrogate: SurrogateParams;
  layers: LayerParams[];
};
```

Minimum builder sections:

- simulation: `timesteps`
- encoder: `poisson` or `latency`
- surrogate: `atan`, `sigmoid`, `piecewise_quadratic`, `softsign`, `leaky_k_relu`
- layers: `Flatten`, `Linear`, `Conv*`, `Pool*`, `BatchNorm*`, `Dropout`
- neuron configs inside trainable layers: `IF`, `LIF`, `PLIF`, `EIF`, `KLIF`, `QIF`, `LIAF`

Runtime discriminators are case-sensitive. Preserve exact strings.

### Controller flow

```text
Model screen mounts
  -> loadModel(experimentId)
  -> parse ModelIR or create starter graph
  -> load taskType/inputShape/outputShape from response

User edits graph builder
  -> graph state changes
  -> serialize graph to ModelIR
  -> validate ModelIR locally

User edits training config
  -> optimizer/loss/lr/epochs state changes

User clicks Save
  -> require dataset input/output shape if screen needs shape-aware validation
  -> POST /api/v1/model/
  -> refresh GET /experiment/{id}/model

User clicks Train
  -> require datasetReady READY from Home or Dataset state
  -> require modelStatus CONFIGURED
  -> POST /api/v1/model/train
  -> navigate/show Telemetry screen
```

### MVC pieces

```text
features/experiment-model/
  model.ts       ModelIR types, builder graph model, training config forms
  service.ts     getModel(), saveModelConfig(), runTraining()
  controller.ts  load(), updateGraph(), save(), train()
  store.ts       dto/builderGraph/form/status/loading/error
```

---

## 12. Telemetry screen flow

Telemetry screen discovers live stream metadata through Transport, then connects to telemetry infrastructure directly.

### Discovery endpoint

```http
GET /api/v1/experiment/{experimentId}/telemetry
```

Response data:

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

### Live telemetry event shape

```ts
type PublishedLayerTelemetry = {
  layer_index: number;
  layer_name: string;
  firing_rate: number;
  sparsity: number;
  mean_membrane: number;
  membrane_std: number;
  dead_neuron_ratio: number;
  saturated_neuron_ratio: number;
  threshold: number;
  tau: number | null;
};

type PublishedTelemetry = {
  timestep: number;
  layers: PublishedLayerTelemetry[];
};
```

Frontend should consume reduced `PublishedTelemetry`, not runtime tensor objects.

### Controller flow

```text
Telemetry screen mounts
  -> telemetryService.getTelemetryInfo(experimentId)
  -> if publisherServiceUrl/topic exists and status TRAINING:
       connect telemetry client
       subscribe topic
       append/reduce live event state
  -> if status QUEUED:
       show waiting and refresh discovery until publisher exists
  -> if status DONE/FAILED:
       stop live connection, show final state + link metrics/error
```

Transport is not in streaming path after discovery.

### MVC pieces

```text
features/experiment-telemetry/
  model.ts       ExperimentTelemetryResponse, PublishedTelemetry, chart state
  service.ts     getTelemetryInfo(), connectLiveTelemetry()
  controller.ts  loadDiscovery(), connect(), disconnect(), handleEvent()
  store.ts       discovery/liveEvents/connectionState/error
```

---

## 13. Metrics screen flow

Metrics screen reads persisted final metrics and train/test series after or during training.

### Endpoint

```http
GET /api/v1/experiment/{experimentId}/metrics
```

Response data:

```ts
type MetricSeries = {
  name: string;
  values: number[];
};

type ExperimentMetricsResponse = {
  experimentId: string;
  taskType: ExperimentTaskType;
  finalMetrics: unknown;
  trainMetrics: MetricSeries[];
  testMetrics: MetricSeries[];
};
```

Transport extracts graph series from `metrics.jsonl`. Final metrics come from database tables.

### Narrowing final metrics

Classification likely uses:

```ts
type ClassificationMetrics = {
  accuracy: number;
  precisionScore: number;
  recallScore: number;
  f1Score: number;
};
```

Regression likely uses:

```ts
type RegressionMetrics = {
  mse: number;
  rmse: number;
  mae: number;
  r2Score: number;
};
```

Use `taskType` to narrow `finalMetrics`. Do not render unknown shapes blindly.

### Controller flow

```text
Metrics screen mounts
  -> metricsService.getMetrics(experimentId)
  -> parse taskType
  -> narrow finalMetrics by taskType
  -> convert train/test series into chart-ready data
  -> render final cards + curves
```

### MVC pieces

```text
features/experiment-metrics/
  model.ts       series/final metrics/view models
  service.ts     getMetrics()
  controller.ts  loadMetrics(), buildCharts()
  store.ts       metrics/loading/error
```

---

## 14. Inference screen flow

Inference screen queues inference for a test sample, then reads stored result.

### Read endpoint

```http
GET /api/v1/experiment/{experimentId}/inference
```

Response data:

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

### Queue endpoint

```http
POST /api/v1/inference/
```

Request:

```ts
type InferenceQueueRequest = {
  experimentId: string;
  sampleNumber: number;
};
```

Response data:

```ts
type InferenceQueueResponse = {
  experimentId: string;
  sampleNumber: number;
  status: InferenceStatus;
};
```

Transport validates:

```text
sampleNumber < testSampleCount
```

Then queues `ModelInferenceJob`. Runtime loads dataset/model/checkpoint, predicts, writes `inference_result.json`, and callbacks update state to `DONE` or `FAILED`.

### Inference artifact shape

Runtime artifact uses snake_case:

```ts
type InferenceResult = {
  sample_number: number;
  prediction: number[] | number;
  target: number[] | number;
  telemetry: StoredModelTelemetry;
};

type StoredModelTelemetry = {
  timestep: number;
  layers: StoredLayerTelemetry[];
};

type StoredLayerTelemetry = {
  layer_index: number;
  layer_name: string;
  spikes: number[][];
  membrane_potentials: number[][];
  threshold: number;
  tau: number | null;
};
```

Do not camelCase runtime artifact fields unless mapping into separate UI-only view model.

### Controller flow

```text
Inference screen mounts
  -> inferenceService.getInference(experimentId)
  -> parse modelIr + inferenceResult if present

User enters sampleNumber
  -> validate integer >= 0
  -> optionally validate against cached Dataset.testSampleCount

User clicks Run Inference
  -> require modelReady DONE or equivalent trained state
  -> POST /api/v1/inference/
  -> show QUEUED
  -> refresh GET /experiment/{id}/inference until DONE/FAILED

DONE
  -> show prediction, target, telemetry visualization

FAILED
  -> show lastInferenceError
```

### MVC pieces

```text
features/experiment-inference/
  model.ts       inference DTOs, stored telemetry, result view model
  service.ts     getInference(), queueInference()
  controller.ts  load(), runInference(), refreshUntilTerminal()
  store.ts       response/sampleNumber/running/error
```

---

## 15. End-to-end state transitions

### Experiment lifecycle

```text
DRAFT
  -> dataset config saved/validation queued
  -> dataset READY
  -> model config saved
  -> training QUEUED/TRAINING
  -> model DONE
  -> inference QUEUED/DONE
```

Top-level `ExperimentStatus` values:

```text
DRAFT | READY | PENDING | RUNNING | COMPLETED | FAILED
```

Screen readiness fields are more useful for IDE gating:

```text
datasetReady:   NOT_CONFIGURED | CONFIGURED | VALIDATING | READY | FAILED
modelReady:     NOT_CONFIGURED | CONFIGURED | QUEUED | TRAINING | DONE | FAILED
inferenceReady: NOT_CONFIGURED | CONFIGURED | QUEUED | DONE | FAILED
```

Docs mention queue-like states for dataset (`PENDING`, `QUEUED`) in prose, but frontend enum doc lists `ConfigStatus` as `NOT_CONFIGURED | CONFIGURED | VALIDATING | READY | FAILED`. Implement against actual enum source and reject unknowns unless backend adds them.

### Main gating matrix

| Action                 | Required state                                               | Source screen/API          |
| ---------------------- | ------------------------------------------------------------ | -------------------------- |
| Open experiment        | experiment summary exists                                    | workspace experiments      |
| Save dataset config    | experiment exists                                            | dataset screen             |
| Validate dataset       | dataset config saved                                         | dataset screen             |
| Save model config      | experiment exists; ideally dataset shape known               | model screen               |
| Queue training         | `datasetReady === READY` and `modelReady === CONFIGURED`     | home/model screen          |
| Connect live telemetry | telemetry discovery has service URL/topic                    | telemetry screen           |
| View final metrics     | training has produced metrics; `modelReady === DONE` best UX | metrics screen             |
| Queue inference        | trained model/checkpoint exists; sample valid                | inference + dataset screen |

---

## 16. Recommended frontend service map

```text
api/httpClient.ts
  request<T>()
  unwrapApiSuccess<T>()
  mapApiError()

features/workspace-connect/service.ts
  connectWorkspace(request)

features/experiment-list/service.ts
  getWorkspaceExperiments(workspaceId)

features/experiment-create/service.ts
  createExperiment(request)

features/experiment-home/service.ts
  getExperimentHome(experimentId)

features/experiment-dataset/service.ts
  getDataset(experimentId)
  saveDatasetConfig(request)
  validateDataset(experimentId)

features/experiment-model/service.ts
  getModel(experimentId)
  saveModelConfig(request)
  runTraining(experimentId)

features/experiment-telemetry/service.ts
  getTelemetryInfo(experimentId)
  connectLiveTelemetry(url, topic)

features/experiment-metrics/service.ts
  getMetrics(experimentId)

features/experiment-inference/service.ts
  getInference(experimentId)
  queueInference(request)
```

---

## 17. Recommended stores

```text
workspaceSessionStore
  currentWorkspaceSession
  savedWorkspaceSessions
  connect()
  connectSaved()
  disconnect()

experimentListStore
  experiments
  loading
  error
  load(workspaceId)

experimentCreateStore
  form
  submitting
  error
  submit()

experimentIdeStore
  experimentId
  activeTab
  cachedHome
  setActiveTab()
  refreshHome()

datasetStore
  dataset
  form
  loading/saving/validating
  error
  load/save/validate

modelStore
  model
  builderGraph
  trainingForm
  loading/saving/training
  error
  load/save/train

telemetryStore
  discovery
  connectionState
  liveEvents
  error
  load/connect/disconnect/handleEvent

metricsStore
  metrics
  charts
  loading
  error
  load

inferenceStore
  inference
  sampleNumber
  loading/running
  error
  load/run
```

---

## 18. Enum and discriminator source of truth

Keep frontend unions explicit.

Transport enums:

```ts
type ArtifactType =
  | "DATASET_CONFIG"
  | "DATASET_CACHE"
  | "MODEL_CONFIG"
  | "MODEL_IR"
  | "TRAINING_METRICS"
  | "CHECKPOINT"
  | "INFERENCE_RESULT";

type ConfigStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "VALIDATING"
  | "READY"
  | "FAILED";

type DatasetProvider = "PYTORCH";

type ExperimentStatus =
  | "DRAFT"
  | "READY"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

type ExperimentTaskType = "CLASSIFICATION" | "REGRESSION";

type InferenceStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "QUEUED"
  | "DONE"
  | "FAILED";

type ModelStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "QUEUED"
  | "TRAINING"
  | "DONE"
  | "FAILED";

type OptimizerType = "SGD" | "ADAM" | "ADAMW" | "RMSPROP";

type LossFunctionType = "CROSS_ENTROPY" | "NLL_LOSS" | "MSE" | "MAE" | "HUBER";
```

Runtime discriminators:

```ts
type EncoderType = "poisson" | "latency";
type LatencyFunctionType = "linear" | "log";
type SurrogateType =
  | "atan"
  | "sigmoid"
  | "piecewise_quadratic"
  | "softsign"
  | "leaky_k_relu";
type NeuronType = "IF" | "LIF" | "PLIF" | "EIF" | "KLIF" | "QIF" | "LIAF";
type LayerType =
  | "Flatten"
  | "Linear"
  | "Conv1D"
  | "Conv2D"
  | "Conv3D"
  | "MaxPool1D"
  | "MaxPool2D"
  | "MaxPool3D"
  | "AvgPool1D"
  | "AvgPool2D"
  | "AvgPool3D"
  | "BatchNorm1D"
  | "BatchNorm2D"
  | "BatchNorm3D"
  | "Dropout";
```

---

## 19. Polling vs streaming guidance

Use normal GET refresh/poll for persisted state unless event bridge exists:

- dataset validation terminal state
- model queued/training/done state discovery
- metrics availability
- inference terminal state

Use direct telemetry stream only after:

```text
GET /api/v1/experiment/{id}/telemetry
  returns publisherServiceUrl + publisherTopic
```

No polling for live telemetry values themselves.

Suggested refresh strategy:

```text
mutation returns QUEUED / VALIDATING / TRAINING
  -> optimistic status update
  -> interval refresh relevant screen every 1-3 seconds
  -> stop when terminal status reached
  -> terminal: READY/DONE/FAILED
```

Keep interval lifecycle inside controller/store, not React component scattered logic.

---

## 20. Artifact mental model for frontend

Frontend sends/receives high-level DTOs. Transport stores details as artifacts:

```text
Dataset save
  SaveDatasetConfigRequest
  -> DATASET_CONFIG artifact

Dataset validation runtime output
  -> DATASET_CACHE artifact
  -> shapes/counts in DB

Model save
  ModelIR
  -> MODEL_IR artifact
  Training config
  -> MODEL_CONFIG artifact

Training runtime output
  metrics.jsonl
  -> TRAINING_METRICS artifact
  checkpoint.pt
  -> CHECKPOINT artifact
  final metrics
  -> DB tables

Inference runtime output
  inference_result.json
  -> INFERENCE_RESULT artifact
  -> exposed through ExperimentInferenceResponse
```

Frontend should not expose artifact IDs as primary UX unless debugging/admin.

---

## 21. Implementation order for frontend

Recommended build order:

1. `api/httpClient` with envelope unwrap and error mapping.
2. shared enum/discriminator guards.
3. workspace connect + persisted session store.
4. workspace experiments list.
5. experiment create form.
6. IDE shell + Home screen.
7. Dataset screen save/load.
8. Dataset validation action + terminal refresh.
9. ModelIR types + builder serializer.
10. Model screen save/load.
11. Training queue action.
12. Telemetry discovery + live client.
13. Metrics screen charts.
14. Inference queue/read/result visualization.

Build thin views after service contracts and stores exist.

---

## 22. Screen-to-endpoint quick reference

| Screen/action         | Method | Endpoint                                      | Request                      | Response data                 |
| --------------------- | ------ | --------------------------------------------- | ---------------------------- | ----------------------------- |
| Workspace connect     | POST   | `/api/v1/workspace/connect`                   | `WorkspaceConnectionRequest` | `WorkspaceConnectionResponse` |
| Workspace experiments | GET    | `/api/v1/workspace/{workspaceId}/experiments` | none                         | `ExperimentSummaryResponse[]` |
| Create experiment     | POST   | `/api/v1/experiment/`                         | `CreateExperimentRequest`    | `ExperimentHomeResponse`      |
| IDE Home              | GET    | `/api/v1/experiment/{experimentId}`           | none                         | `ExperimentHomeResponse`      |
| Dataset read          | GET    | `/api/v1/experiment/{experimentId}/dataset`   | none                         | `ExperimentDatasetResponse`   |
| Dataset save          | POST   | `/api/v1/dataset/`                            | `SaveDatasetConfigRequest`   | `SaveDatasetConfigResponse`   |
| Dataset validate      | POST   | `/api/v1/dataset/validate`                    | `ValidateDatasetRequest`     | `ValidateDatasetResponse`     |
| Model read            | GET    | `/api/v1/experiment/{experimentId}/model`     | none                         | `ExperimentModelResponse`     |
| Model save            | POST   | `/api/v1/model/`                              | `SaveModelConfigRequest`     | `SaveModelConfigResponse`     |
| Run training          | POST   | `/api/v1/model/train`                         | `RunTrainingRequest`         | `RunTrainingResponse`         |
| Telemetry discovery   | GET    | `/api/v1/experiment/{experimentId}/telemetry` | none                         | `ExperimentTelemetryResponse` |
| Metrics read          | GET    | `/api/v1/experiment/{experimentId}/metrics`   | none                         | `ExperimentMetricsResponse`   |
| Inference read        | GET    | `/api/v1/experiment/{experimentId}/inference` | none                         | `ExperimentInferenceResponse` |
| Queue inference       | POST   | `/api/v1/inference/`                          | `InferenceQueueRequest`      | `InferenceQueueResponse`      |

---

## 23. Open frontend decisions to confirm during implementation

These are not blockers for service/MVC scaffolding, but should be resolved before final UX polish:

1. Route scheme: nested URLs vs single `/experiment/:id` with tab state.
2. Telemetry protocol/client: WebSocket, SSE, Redis-backed gateway, or custom service URL contract.
3. Dataset provider UX: fixed `PYTORCH` + datasetName text field vs curated dataset catalog.
4. Model builder graph schema: internal visual graph format separate from `ModelIR` serializer.
5. Poll interval and cancellation policy for dataset/training/inference refresh.
6. Whether to keep backward UI wording "runtime session" or rename fully to "workspace".
