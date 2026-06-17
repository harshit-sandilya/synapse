# Synapse Frontend Design Decisions

This document records frontend architecture decisions for implementing workspace, experiment IDE screens, services, MVC stores, and live telemetry.

It builds on:

- `docs/flow.md`
- `docs/frontend-context.md`
- `docs/transport-data-classes.md`
- `docs/transport-context.md`
- `docs/runtime-data-classes.md`
- current `synapse-ui/src` frontend patterns

---

## 1. Current frontend architecture observed

### 1.1 Framework shape

Frontend is a Next.js App Router app under `synapse-ui/src`.

Current structure:

```text
synapse-ui/src/
  app/                  # pages + Next API routes
  app/api/              # backend-for-frontend proxy routes
  components/           # render-only page/domain components
  features/             # Zustand MVC feature modules
  services/             # client-side services calling local /api routes
  types/                # API DTOs, runtime DTOs, enums, shared result types
```

Important project instruction: before writing Next.js implementation code, read relevant local docs in `node_modules/next/dist/docs/` because this Next version may differ from trained assumptions.

### 1.2 Current MVC feature pattern

Implemented feature example: `src/features/workspace`.

Observed pattern:

```text
features/workspace/
  workspace.model.ts       # state/data interfaces + initial state
  workspace.controller.ts  # business actions as Zustand StateCreator slice
  workspace.store.ts       # create() + persist() + model/controller composition
```

Current model style:

```ts
export interface WorkspaceForm {
  username: string;
  transportURL: string;
  workspaceName: string;
}

export interface WorkspaceEntry extends WorkspaceForm {
  id: string;
  lastConnected: number;
}

export interface WorkspaceData {
  workspaceForm: WorkspaceForm;
  currentWorkspace?: WorkspaceEntry;
  savedWorkspaces: WorkspaceEntry[];
}
```

Current controller style:

```ts
export interface WorkspaceActions {
  handleWorkspaceFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  connectToNewWorkspace: () => Promise<string | null>;
  connectToSavedWorkspace: (id: string) => Promise<string | null>;
  getWorkspaceInfo: () => WorkspaceEntry | undefined;
  disconnectWorkspace: () => Promise<void>;
}
```

Current store style:

```ts
export const useWorkspaceStore = create<WorkspaceData & WorkspaceActions>()(
  persist(
    (...a) => ({
      ...initialWorkspaceData,
      ...createWorkspaceController(...a),
    }),
    { name: "synapse:workspaces" },
  ),
);
```

### 1.3 Current service pattern

Implemented service example: `src/services/workspace.service.ts`.

Service behavior:

```text
component
  -> Zustand action/controller
  -> service function
  -> local Next API route (/api/...)
  -> Transport API (/api/v1/...)
  -> ApiSuccessResponse<T> or ApiError
  -> service maps to ServiceResult<T>
```

Current service result type:

```ts
type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};
```

Current service convention:

- calls local `/api/...` route
- receives Transport envelope passthrough
- if `!response.ok`, returns `{ data: null, error }`
- if success, maps `payload.data` into frontend feature model
- catches network/runtime exceptions and returns user-safe error string

### 1.4 Current Next API proxy pattern

Transport URL is dynamic and user-provided through workspace connection.

Connect route:

```text
POST /api/workspace/connect
  -> body has transportURL, workspaceName, username
  -> calls {transportURL}/api/v1/workspace/connect
  -> stores transportURL in httpOnly cookie when successful
```

Shared proxy helpers:

```text
src/app/api/_helpers/transport.ts
  getTransportUrl(requestPath)
  readTransportPayload(response)
  proxyTransportGet(transportPath, requestPath)
  proxyTransportPost(request, transportPath, requestPath)
```

Proxy route behavior:

- reads Transport URL from `TRANSPORT_COOKIE`
- trims trailing slashes
- forwards HTTP request to Transport `/api/v1/...`
- passes JSON payload/status back unchanged
- normalizes non-JSON Transport responses into API error-like body
- if cookie missing, returns `401 TRANSPORT_NOT_CONNECTED`
- if Transport unreachable, returns `502 TRANSPORT_UNREACHABLE`

### 1.5 Typed data layout observed

Types are already split well:

```text
src/types/api/**       # Transport request/response DTOs
src/types/runtime/**   # Runtime-safe model/telemetry/inference objects
src/types/enums/**     # Transport/runtime enums
src/types/service.*    # service result wrapper
```

This split should continue.

---

## 2. Decision: keep feature MVC, standardize names

### Decision

Keep current feature MVC pattern. Standardize each feature folder as:

```text
src/features/<domain>/<feature>/
  <feature>.model.ts
  <feature>.controller.ts
  <feature>.store.ts
```

For simple top-level domains, one-level feature folder is acceptable:

```text
src/features/workspace/
  workspace.model.ts
  workspace.controller.ts
  workspace.store.ts
```

For experiment IDE screens, use nested domain:

```text
src/features/experiments/experiment-list/
src/features/experiments/experiment-create/
src/features/experiments/experiment-ide/
src/features/experiments/experiment-home/
src/features/experiments/experiment-dataset/
src/features/experiments/experiment-model/
src/features/experiments/experiment-telemetry/
src/features/experiments/experiment-metrics/
src/features/experiments/experiment-inference/
```

### Why

- Matches existing workspace implementation.
- Matches imports already referenced by session components for experiment list.
- Keeps screen-specific state close to screen-specific actions.
- Prevents one mega experiment store from owning every screen.

### Consequence

Each screen can be built independently, but can still share Home readiness via `experiment-ide` or normal service calls.

---

## 3. Decision: model files hold feature state, not raw backend entities only

### Decision

`*.model.ts` should contain:

1. Feature state shape.
2. Form state shape.
3. View model shape.
4. Initial state/defaults.
5. Feature-local derived-state helper types.

API DTOs stay in `src/types/api/**` and should be imported, not duplicated.

### Example

```ts
// src/features/experiments/experiment-dataset/experiment-dataset.model.ts
import { ExperimentDatasetResponse } from "@/types/api/experiment/experiment-dataset.response";

export type DatasetForm = {
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

export type ExperimentDatasetState = {
  dataset: ExperimentDatasetResponse | null;
  form: DatasetForm;
  loading: boolean;
  saving: boolean;
  validating: boolean;
  error: string | null;
};
```

### Why

Backend DTOs describe transport shape. Feature models describe UI state and behavior needs.

---

## 4. Decision: controllers own orchestration and status gates

### Decision

Controllers should own:

- API call sequencing
- local validation before request
- mutation + refresh behavior
- terminal-state refresh loops
- route navigation intent
- cross-screen gating based on loaded state

Views should not directly call services.

### Existing gap

Current workspace controller accepts `React.ChangeEvent<HTMLInputElement>`. New controllers should prefer UI-agnostic setters:

```ts
setField(name: keyof Form, value: string | number | boolean): void
```

instead of:

```ts
handleChange(e: React.ChangeEvent<HTMLInputElement>): void
```

### Why

React events couple controllers to React DOM inputs. Field setters are easier to test and reuse from custom components like graph builders, selects, sliders, and numeric controls.

### Allowed exception

Existing workspace controller can stay as-is until refactor. New experiment features should use field-level setters.

---

## 5. Decision: stores use Zustand selectors and scoped persistence

### Decision

Continue Zustand. Stores expose `use<Feature>Store`. Components must use selectors:

```ts
const dataset = useExperimentDatasetStore((s) => s.dataset);
const save = useExperimentDatasetStore((s) => s.save);
```

Persist only long-lived user/session data:

- workspace sessions
- selected/saved transport URL entries
- maybe last active IDE tab

Do not persist volatile screen data:

- live telemetry
- loading flags
- API errors
- metrics chart arrays
- inference run state
- dataset validation in-flight state

### Why

Persisting server-derived states can make UI lie after reload. Server state should reload from Transport.

---

## 6. Decision: services call local Next API routes only

### Decision

Client-side services must call local `/api/...` routes, not Transport URLs directly.

```text
service -> /api/... -> Next route handler -> Transport /api/v1/...
```

### Why

- Transport URL lives in httpOnly cookie.
- Browser should not own direct Transport base URL after connect.
- Proxy can normalize errors consistently.
- Later auth/session/cors changes stay in BFF layer.

### Service responsibilities

Each service should:

1. Build local route path.
2. Send request body when needed.
3. Parse success/error payload.
4. Unwrap `ApiSuccessResponse<T>.data`.
5. Validate enums/discriminators where needed.
6. Return `ServiceResult<T>`.

### Non-responsibilities

Services should not:

- mutate Zustand directly
- navigate routes
- hold intervals
- duplicate controller business rules
- expose raw success envelope to screens by default

---

## 7. Decision: add shared service helpers

### Decision

Create shared service helper before implementing many services:

```text
src/services/_helpers/api-result.ts
```

or:

```text
src/services/api-client.ts
```

Suggested functions:

```ts
async function postLocalApi<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<ServiceResult<TResponse>>;

async function getLocalApi<TResponse>(
  path: string,
): Promise<ServiceResult<TResponse>>;
```

Helper should:

- call `fetch`
- parse JSON safely
- map non-OK `ApiError.message`
- unwrap `ApiSuccessResponse<T>.data`
- catch network errors

### Why

Workspace service currently repeats envelope parsing manually. Many new services would duplicate same code.

### Result

Feature services become thin:

```ts
export function getExperimentHome(experimentId: string) {
  return getLocalApi<ExperimentHomeResponse>(`/api/experiment/${experimentId}`);
}
```

---

## 8. Decision: keep Next API routes thin proxies

### Decision

Next route handlers in `src/app/api/**/route.ts` remain thin proxy/controllers. They should not contain screen business logic.

Allowed responsibilities:

- read request body
- map local route to Transport route
- use `proxyTransportGet` / `proxyTransportPost`
- set/delete cookies for workspace connect/disconnect
- implement frontend-server-only adapters like telemetry SSE gateway

Not allowed:

- hardcode experiment behavior
- reshape successful Transport DTOs for UI
- store UI state
- implement ML workflow rules

### Why

Transport owns backend semantics. Frontend services/controllers own UI semantics.

---

## 9. API/data flow map

### 9.1 Workspace connect

```text
Home component
  -> workspace store action connectToNewWorkspace()
  -> workspace.service.connectWorkspace(form)
  -> POST /api/workspace/connect
  -> POST {transportURL}/api/v1/workspace/connect
  -> success envelope WorkspaceConnectionResponse
  -> service maps to WorkspaceEntry
  -> store persists current/saved workspace
```

Decision: keep `transportURL` only in frontend session entry and httpOnly cookie. Do not send it to Transport except during initial frontend proxy connect.

### 9.2 Workspace experiments

```text
/session page
  -> experiment-list store load(workspaceId)
  -> experiment-list service GET /api/workspace/{workspaceId}/experiments
  -> Next proxy GET /api/v1/workspace/{workspaceId}/experiments
  -> ExperimentSummaryResponse[]
  -> cards
```

Decision: experiment list stores summaries only, not full IDE data.

### 9.3 Create experiment

```text
/experiment/new
  -> experiment-create store submit(form)
  -> POST /api/experiment/create
  -> POST /api/v1/experiment/
  -> ExperimentHomeResponse
  -> navigate /experiment/{experimentId}
```

Decision: create request contains metadata only:

```text
workspaceId, memberId, name, description, taskType
```

No dataset/model/training fields in create.

### 9.4 IDE Home

```text
/experiment/{id}/home
  -> GET /api/experiment/{id}
  -> GET /api/v1/experiment/{id}
  -> ExperimentHomeResponse
  -> readiness badges + screen gates
```

Decision: Home response is current source for readiness gates across IDE.

### 9.5 Dataset

```text
Dataset load
  -> GET /api/experiment/{id}/dataset
  -> ExperimentDatasetResponse

Dataset save
  -> POST /api/dataset/save
  -> POST /api/v1/dataset/
  -> SaveDatasetConfigResponse
  -> refresh Dataset + Home

Dataset validate
  -> POST /api/dataset/validate
  -> POST /api/v1/dataset/validate
  -> ValidateDatasetResponse
  -> refresh until READY/FAILED
```

Decision: save and validate stay separate UI actions. Auto-validate after save can be added later as controller composition, not service merge.

### 9.6 Model + training

```text
Model load
  -> GET /api/experiment/{id}/model
  -> ExperimentModelResponse

Model save
  -> POST /api/model/save
  -> POST /api/v1/model
  -> SaveModelConfigResponse
  -> refresh Model + Home

Run training
  -> POST /api/model/train
  -> POST /api/v1/model/train
  -> RunTrainingResponse
  -> navigate/show Telemetry
```

Decision: model builder internal graph model must be separate from `ModelIR`. Controller serializes builder graph into runtime `ModelIR` before save.

### 9.7 Telemetry

```text
Telemetry discovery
  -> GET /api/experiment/{id}/telemetry
  -> GET /api/v1/experiment/{id}/telemetry
  -> ExperimentTelemetryResponse

Live stream
  -> browser connects to frontend SSE endpoint
  -> frontend server reads Redis latest snapshot
  -> browser receives PublishedTelemetry
```

Decision details in telemetry section below.

### 9.8 Metrics

```text
Metrics screen
  -> GET /api/experiment/{id}/metrics
  -> GET /api/v1/experiment/{id}/metrics
  -> ExperimentMetricsResponse
  -> controller narrows finalMetrics by taskType
  -> render final cards + train/test series
```

Decision: `finalMetrics` stays `unknown` at service boundary until narrowed by task type.

### 9.9 Inference

```text
Inference load
  -> GET /api/experiment/{id}/inference
  -> ExperimentInferenceResponse

Queue inference
  -> POST /api/inference/queue
  -> POST /api/v1/inference
  -> InferenceQueueResponse
  -> refresh until DONE/FAILED
```

Decision: stored inference artifact keeps runtime snake_case in API/runtime type. UI can map to camelCase only inside screen view model.

---

## 10. Decision: strict runtime/API parsing at boundaries

### Decision

Add guards/parsers for:

- transport enum strings
- runtime discriminator strings
- `ModelIR`
- `PublishedTelemetry`
- `InferenceResult`
- task-type-specific final metrics

Location options:

```text
src/types/enums/*.guards.ts
src/types/runtime/model/model-ir.guard.ts
src/types/runtime/telemetry/published-telemetry.guard.ts
src/types/runtime/inference/inference-result.guard.ts
```

Services should call guards when returning `JsonNode`/unknown fields.

### Why

Docs explicitly require rejecting unknown enum strings and preserving case-sensitive discriminators. Runtime shape is Pydantic-driven and may reject invalid frontend builder output.

---

## 11. Decision: Redis live telemetry handled through frontend SSE gateway

### Decision

Do not connect browser directly to Redis.

Implement browser live telemetry as:

```text
Browser EventSource
  -> GET /api/experiment/{id}/telemetry/stream
  -> Next API route/server handler
  -> calls Transport telemetry discovery or reuses query metadata
  -> server connects to Redis publisherServiceUrl
  -> server reads publisherTopic latest payload
  -> emits Server-Sent Events with PublishedTelemetry JSON
```

Protocol to browser: **SSE/EventSource**.

Backend data source: **Redis latest-value key**, using `publisherServiceUrl` and `publisherTopic` from Transport discovery.

### Why SSE over WebSocket

Telemetry is one-way runtime-to-browser. Browser does not need bidirectional messages for current flow.

Benefits:

- simpler client API
- native browser reconnect
- plain HTTP streaming
- easier infra than WebSocket
- fits scalar telemetry snapshots

### Why not browser -> Redis direct

- Browsers cannot safely speak raw Redis.
- Redis URL may expose infrastructure details.
- Current runtime publisher uses Redis `SET(topic, payload)`, not browser-safe Pub/Sub/WebSocket.
- Direct Redis from browser would create security and CORS/network problems.

### Why frontend-server gateway instead of Transport streaming now

Existing architecture already uses Next API routes as backend-for-frontend, and Transport already exposes discovery. Adding gateway in frontend layer avoids changing Transport immediately.

If deployment puts Next server outside Redis network, move this same gateway into Transport later and keep frontend `TelemetryClient` interface unchanged.

### Runtime behavior to account for

Runtime currently publishes reduced telemetry as latest snapshot:

```text
redis.set(topic, payload)
```

This means:

- no guaranteed event history
- each topic stores latest telemetry only
- missed timesteps may be lost
- frontend should treat stream as live sampled state, not audit log

### SSE endpoint design

Suggested route:

```text
GET /api/experiment/[id]/telemetry/stream
```

Behavior:

```text
1. Read experiment id.
2. Use Transport cookie to call /api/v1/experiment/{id}/telemetry.
3. If no publisherServiceUrl/topic:
   - return SSE waiting events, or 409 with retry advice.
4. Server connects to Redis using publisherServiceUrl.
5. Poll GET publisherTopic every 250-500ms.
6. Parse payload as PublishedTelemetry.
7. Emit only when timestep changes.
8. Send heartbeat comments every ~15s.
9. Close on client disconnect.
10. Stop emitting when discovery/status becomes DONE or FAILED.
```

Sample event format:

```text
event: telemetry
data: {"timestep":12,"layers":[...]}

```

Optional status events:

```text
event: status
data: {"status":"TRAINING"}

```

Error events:

```text
event: error
data: {"message":"Telemetry publisher unavailable."}

```

### Client abstraction

Create:

```text
src/services/telemetry-live.service.ts
```

Interface:

```ts
type TelemetryLiveClient = {
  connect(experimentId: string): void;
  disconnect(): void;
  onTelemetry(handler: (event: PublishedTelemetry) => void): void;
  onStatus(handler: (status: ModelStatus) => void): void;
  onError(handler: (message: string) => void): void;
};
```

Implementation now uses EventSource. Future WebSocket/Transport gateway can replace internals.

### Store behavior

Telemetry store should keep bounded data:

```ts
type TelemetryState = {
  discovery: ExperimentTelemetryResponse | null;
  connectionState: "idle" | "discovering" | "waiting" | "connecting" | "connected" | "closed" | "error";
  latest: PublishedTelemetry | null;
  samples: PublishedTelemetry[];
  maxSamples: number;
  error: string | null;
};
```

Default `maxSamples`: 500 or less. Charts can downsample further.

### Stale/duplicate handling

Use `timestep` to drop stale or duplicate events:

```text
if incoming.timestep <= latest.timestep:
  ignore
else:
  append bounded sample
```

If runtime timestep resets per epoch/batch in future, include sequence metadata then. Until then, protect against duplicates but do not assume perfect timeline.

### Discovery flow

```text
Telemetry screen mounts
  -> GET /api/experiment/{id}/telemetry
  -> if status QUEUED or no topic/url:
       show "waiting for telemetry publisher"
       refresh discovery every 1-3s
  -> if status TRAINING and topic/url exists:
       open EventSource /api/experiment/{id}/telemetry/stream
  -> if status DONE:
       show completed, link metrics
  -> if status FAILED:
       show failed, link model error
```

### Dependency note

SSE gateway needs a server-side Redis client dependency in `synapse-ui` if implemented in Next API route. Do not import Redis client into browser bundles.

---

## 12. Decision: terminal refresh loops live in controllers

### Decision

Dataset validation, training status, and inference completion need refresh loops. These loops belong in controllers/stores, not components.

Pattern:

```text
run mutation
  -> set optimistic status
  -> start refreshUntilTerminal()
  -> update store after each GET
  -> stop on terminal status or timeout
  -> cleanup on screen leave/disconnect
```

Terminal states:

```text
Dataset:   READY | FAILED
Model:     DONE | FAILED
Inference: DONE | FAILED
```

For model training live telemetry, use SSE for live telemetry but still refresh Home/Model status periodically or when stream closes.

### Why

Keeps components declarative and prevents multiple intervals from duplicated renders.

---

## 13. Feature map to implement

### 13.1 Workspace

Existing:

```text
src/features/workspace/
  workspace.model.ts
  workspace.controller.ts
  workspace.store.ts

src/services/workspace.service.ts
```

Decision:

- keep existing feature
- later add `memberId` to `WorkspaceEntry` because Transport returns it and create experiment needs it
- keep `transportURL` local only
- maybe rename UI labels later from Runtime to Workspace/Transport for consistency

### 13.2 Experiment list

```text
src/features/experiments/experiment-list/
  experiment-list.model.ts
  experiment-list.controller.ts
  experiment-list.store.ts

src/services/experiment-list.service.ts
```

State:

```text
experiments
loading
error
lastLoadedWorkspaceId
```

Actions:

```text
loadExperiments(workspaceId)
openExperiment(id)
clear()
```

### 13.3 Experiment create

```text
src/features/experiments/experiment-create/
  experiment-create.model.ts
  experiment-create.controller.ts
  experiment-create.store.ts

src/services/experiment-create.service.ts
```

State:

```text
form: name, description, taskType
submitting
error
```

Actions:

```text
setField()
submit(currentWorkspace)
reset()
```

### 13.4 Experiment IDE shell

```text
src/features/experiments/experiment-ide/
  experiment-ide.model.ts
  experiment-ide.controller.ts
  experiment-ide.store.ts
```

State:

```text
experimentId
activeTab
homeSnapshot
loadingHome
error
```

Actions:

```text
setExperimentId(id)
setActiveTab(tab)
refreshHome()
```

### 13.5 Experiment Home

```text
src/features/experiments/experiment-home/
  experiment-home.model.ts
  experiment-home.controller.ts
  experiment-home.store.ts

src/services/experiment-home.service.ts
```

State:

```text
home
readinessView
loading
error
```

Actions:

```text
loadHome(experimentId)
```

### 13.6 Dataset

```text
src/features/experiments/experiment-dataset/
  experiment-dataset.model.ts
  experiment-dataset.controller.ts
  experiment-dataset.store.ts

src/services/experiment-dataset.service.ts
```

Actions:

```text
loadDataset(experimentId)
setField(field, value)
saveDataset(experimentId)
validateDataset(experimentId)
refreshUntilDatasetTerminal(experimentId)
```

### 13.7 Model

```text
src/features/experiments/experiment-model/
  experiment-model.model.ts
  experiment-model.controller.ts
  experiment-model.store.ts

src/services/experiment-model.service.ts
```

Actions:

```text
loadModel(experimentId)
setTrainingField(field, value)
setBuilderGraph(graph)
serializeBuilderGraphToModelIr()
saveModel(experimentId)
runTraining(experimentId)
```

### 13.8 Telemetry

```text
src/features/experiments/experiment-telemetry/
  experiment-telemetry.model.ts
  experiment-telemetry.controller.ts
  experiment-telemetry.store.ts

src/services/experiment-telemetry.service.ts
src/services/telemetry-live.service.ts
```

Actions:

```text
loadDiscovery(experimentId)
connectLive(experimentId)
disconnectLive()
handleTelemetry(event)
clearSamples()
```

### 13.9 Metrics

```text
src/features/experiments/experiment-metrics/
  experiment-metrics.model.ts
  experiment-metrics.controller.ts
  experiment-metrics.store.ts

src/services/experiment-metrics.service.ts
```

Actions:

```text
loadMetrics(experimentId)
buildCharts(response)
```

### 13.10 Inference

```text
src/features/experiments/experiment-inference/
  experiment-inference.model.ts
  experiment-inference.controller.ts
  experiment-inference.store.ts

src/services/experiment-inference.service.ts
```

Actions:

```text
loadInference(experimentId)
setSampleNumber(value)
queueInference(experimentId)
refreshUntilInferenceTerminal(experimentId)
```

---

## 14. Local API route map

Current/future services should use these local routes:

| Client service call | Local route | Transport route |
| --- | --- | --- |
| `connectWorkspace` | `POST /api/workspace/connect` | `POST /api/v1/workspace/connect` |
| `disconnectWorkspace` | `POST /api/workspace/disconnect` | local cookie clear |
| `getWorkspaceExperiments` | `GET /api/workspace/{id}/experiments` | `GET /api/v1/workspace/{id}/experiments` |
| `createExperiment` | `POST /api/experiment/create` | `POST /api/v1/experiment/` |
| `getExperimentHome` | `GET /api/experiment/{id}` | `GET /api/v1/experiment/{id}` |
| `getDataset` | `GET /api/experiment/{id}/dataset` | `GET /api/v1/experiment/{id}/dataset` |
| `saveDatasetConfig` | `POST /api/dataset/save` | `POST /api/v1/dataset/` |
| `validateDataset` | `POST /api/dataset/validate` | `POST /api/v1/dataset/validate` |
| `getModel` | `GET /api/experiment/{id}/model` | `GET /api/v1/experiment/{id}/model` |
| `saveModelConfig` | `POST /api/model/save` | `POST /api/v1/model/` |
| `runTraining` | `POST /api/model/train` | `POST /api/v1/model/train` |
| `getTelemetryInfo` | `GET /api/experiment/{id}/telemetry` | `GET /api/v1/experiment/{id}/telemetry` |
| `streamTelemetry` | `GET /api/experiment/{id}/telemetry/stream` | Redis via discovered URL/topic |
| `getMetrics` | `GET /api/experiment/{id}/metrics` | `GET /api/v1/experiment/{id}/metrics` |
| `getInference` | `GET /api/experiment/{id}/inference` | `GET /api/v1/experiment/{id}/inference` |
| `queueInference` | `POST /api/inference/queue` | `POST /api/v1/inference/` |

---

## 15. Error-handling decisions

### Decision

Keep service-level return shape:

```ts
type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};
```

But standardize error source:

1. `ApiError.message` when backend/local route returns `!ok`.
2. JSON parse failure -> `Unexpected API response.`
3. network/exception -> domain-specific fallback, e.g. `Failed to load experiment.`

Controllers store user-facing `error: string | null`.

### Why

Current UI already expects `string | null` style. Avoid throwing through React components for normal request failures.

---

## 16. Naming decisions

### Decision

Use these names going forward:

- Workspace: connected backend workspace context.
- Transport URL: URL typed on Home form; stored in cookie by BFF.
- Experiment IDE: screen shell under experiment ID.
- Dataset/Model/Telemetry/Metrics/Inference: IDE screens.

Avoid mixing Runtime and Workspace in new feature names. Existing UI copy can be cleaned later.

### File casing

Use PascalCase for React component filenames going forward:

```text
ConnectionForm.tsx
RecentWorkspaces.tsx
RuntimeBar.tsx
ExperimentList.tsx
```

Keep feature/service filenames kebab/lowercase:

```text
experiment-list.store.ts
experiment-list.service.ts
```

---

## 17. Known gaps to fix during implementation

1. `WorkspaceEntry` lacks `memberId`, but create experiment requires `memberId`.
2. Session components import missing feature stores:
   - `@/features/session/session.store`
   - `@/features/experiments/experiment-list/experiment-list.store`
3. Navigation after connect is currently stubbed/commented in home components.
4. No shared service helper exists yet, so envelope parsing would be duplicated.
5. No live telemetry client exists yet.
6. No Redis/SSE gateway exists yet.
7. Some docs use runtime/session wording while API uses workspace/transport wording.
8. Dataset status prose mentions queue-like states not present in current `ConfigStatus`; frontend must follow actual enum file.
9. Model builder internal graph schema still needs design separate from Runtime `ModelIR`.

---

## 18. Implementation sequence from these decisions

1. Add shared service API helper.
2. Add missing `memberId` to workspace model/service mapping.
3. Implement experiment-list feature + service.
4. Implement experiment-create feature + service.
5. Implement IDE route shell + Home screen/store/service.
6. Implement dataset feature with save and validate refresh loop.
7. Implement ModelIR guards and model builder serializer boundary.
8. Implement model feature with save/train.
9. Implement telemetry discovery service.
10. Implement SSE telemetry gateway route.
11. Implement EventSource telemetry live service.
12. Implement bounded telemetry store/charts.
13. Implement metrics feature.
14. Implement inference feature.
15. Clean naming/casing inconsistencies.

---

## 19. Final architecture summary

```text
React component
  reads Zustand selector
  calls store action

Zustand store
  holds feature state
  exposes controller actions

Controller
  validates
  sequences service calls
  refreshes related state
  owns intervals/live connection lifecycle

Service
  calls local Next /api route
  unwraps ApiSuccessResponse<T>
  maps ApiError to ServiceResult<T>
  parses unsafe JSON/enums

Next API route
  proxies to Transport using httpOnly transport cookie
  or handles frontend-server-only bridge like telemetry SSE

Transport
  owns metadata, queues jobs, serves screen DTOs

Runtime
  executes dataset/training/inference and publishes reduced telemetry
```

Primary live telemetry decision:

```text
Runtime Redis SET latest telemetry
  -> Next server SSE gateway polls Redis latest topic
  -> Browser EventSource receives PublishedTelemetry
  -> Telemetry store keeps bounded latest samples
```
