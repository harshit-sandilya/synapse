# Synapse Transport Service

## Overview

Transport is the orchestration and metadata service for Synapse.

It acts as the control plane between:

- Frontend IDE
- Runtime workers
- Storage (MinIO)
- Queueing system (Redis)
- PostgreSQL metadata database

Transport does **not** execute training, dataset validation, or inference itself.

Instead it:

- Stores experiment metadata
- Stores artifact references
- Queues jobs for runtime
- Receives runtime callbacks
- Exposes frontend-facing APIs
- Parses and serves artifacts stored in MinIO

---

# Architecture

```text
Frontend
    |
    v
Transport
    |
    +---- PostgreSQL
    |
    +---- Redis Queue
    |
    +---- MinIO
    |
    v
Runtime
```

Responsibilities:

| Component | Responsibility           |
| --------- | ------------------------ |
| Frontend  | User interaction         |
| Transport | Metadata + orchestration |
| Runtime   | Actual ML execution      |
| MinIO     | Artifact storage         |
| Redis     | Job queue                |

---

# Experiment Lifecycle

Every experiment progresses through three major phases:

```text
Dataset
    ↓
Model Training
    ↓
Inference
```

Transport stores state inside:

```java
Experiment
```

using:

```java
ConfigStatus datasetReady
ModelStatus modelReady
InferenceStatus inferenceReady
```

---

# Database Entities

## Experiment

Central experiment metadata.

Stores:

```java
name
description
taskType

datasetReady
modelReady
inferenceReady

status
```

---

## ExperimentDatasetConfig

Stores dataset configuration and validation results.

```java
datasetProvider
datasetName

datasetConfigArtifact
datasetArtifact

trainSampleCount
testSampleCount

inputShape
outputShape

lastValidationError
```

---

## ExperimentModelConfig

Stores model configuration.

```java
modelArtifact
modelConfigArtifact

publisherTopic
publisherServiceUrl

startedAt
endedAt

metricsStorageArtifact
checkpointStorageArtifact

lastTrainingError
```

---

## ExperimentInferenceConfig

Stores inference state.

```java
sampleNumber

inferenceArtifact

lastInferenceError
```

---

## ClassificationMetrics

```java
accuracy
precisionScore
recallScore
f1Score
```

---

## RegressionMetrics

```java
mse
rmse
mae
r2Score
```

---

## Artifact

All storage references are represented as artifacts.

```java
artifactType
storageKey
```

Artifact types:

```java
DATASET_CONFIG
DATASET_CACHE

MODEL_CONFIG
MODEL_IR

TRAINING_METRICS
CHECKPOINT

INFERENCE_RESULT
```

---

# Storage Layout

## Dataset Config

```json
{
  "batchSize": 64,
  "numWorkers": 4,
  "shuffle": true,
  "pinMemory": true,
  "dropLast": false,
  "prefetchFactor": 2,
  "persistentWorkers": true
}
```

Artifact Type:

```text
DATASET_CONFIG
```

---

## Dataset Snapshot

Runtime creates:

```text
train/
test/
metadata.json
```

Artifact Type:

```text
DATASET_CACHE
```

---

## Model IR

Stored exactly as produced by frontend graph builder.

Example:

```json
{
  "simulation": {
    "timesteps": 32
  },
  "encoder": {
    "type": "poisson"
  },
  "layers": [...]
}
```

Artifact Type:

```text
MODEL_IR
```

---

## Model Config

```json
{
  "optimizer": "ADAM",
  "lossFunction": "CROSS_ENTROPY",
  "learningRate": 0.001,
  "epochs": 10
}
```

Artifact Type:

```text
MODEL_CONFIG
```

---

## Training Metrics

Stored as JSONL.

Each row:

```json
{
  "epoch": 1,
  "train_metrics": {...},
  "test_metrics": {...}
}
```

Artifact Type:

```text
TRAINING_METRICS
```

---

## Inference Result

Stored as JSON.

```json
{
  "sample_number": 123,
  "prediction": [...],
  "target": [...],
  "telemetry": {...}
}
```

Artifact Type:

```text
INFERENCE_RESULT
```

---

# Queueing

Transport publishes jobs into Redis.

Runtime consumes jobs.

Priority support exists at queue level.

---

# Dataset Validation Flow

## Step 1

Frontend:

```http
POST /api/v1/dataset
```

Stores:

- dataset config artifact
- dataset metadata row

Updates:

```java
datasetReady = PENDING
```

---

## Step 2

Frontend:

```http
POST /api/v1/dataset/validate
```

Transport creates:

```java
DatasetValidationJob
```

```java
workspaceId
experimentId

provider
datasetName

datasetConfigStorageKey
```

Queues job.

Updates:

```java
datasetReady = QUEUED
```

---

## Step 3

Runtime validates dataset.

Runtime:

- downloads config
- creates snapshot
- computes metadata

---

## Step 4

Runtime callback:

```http
POST /api/v1/runtime/dataset
```

Transport:

- creates DATASET_CACHE artifact
- updates dataset config row
- updates experiment status

Result:

```java
datasetReady = READY
```

or

```java
datasetReady = FAILED
```

---

# Model Training Flow

## Step 1

Frontend:

```http
POST /api/v1/model
```

Uploads:

- model IR
- model config

Creates:

```java
MODEL_IR
MODEL_CONFIG
```

Updates:

```java
modelReady = CONFIGURED
```

---

## Step 2

Frontend:

```http
POST /api/v1/model/train
```

Transport verifies:

```java
datasetReady == READY
modelReady == CONFIGURED
```

Loads:

- dataset config artifact
- dataset snapshot artifact
- model config artifact
- model IR artifact

Creates:

```java
ModelTrainingJob
```

```java
workspaceId
experimentId

datasetConfigStorageKey
datasetStorageKey

modelIrStorageKey
modelConfigStorageKey
```

Queues job.

Updates:

```java
modelReady = QUEUED
```

---

## Step 3

Runtime starts training.

Runtime callback:

```http
POST /api/v1/runtime/training/start
```

Updates:

```java
publisherTopic
publisherServiceUrl

startedAt

modelReady = TRAINING
```

---

## Step 4

Runtime trains model.

Produces:

```text
metrics.jsonl
checkpoint.pt
```

---

## Step 5

Runtime completion callback:

```http
POST /api/v1/runtime/training/end
```

Creates:

```java
TRAINING_METRICS
CHECKPOINT
```

Updates:

```java
endedAt
```

Extracts:

- final classification metrics
- final regression metrics

from:

```text
last row of metrics.jsonl
```

Stores results into metrics tables.

Updates:

```java
modelReady = DONE
```

or

```java
modelReady = FAILED
```

---

# Inference Flow

## Step 1

Frontend:

```http
POST /api/v1/inference
```

Transport validates:

```java
sampleNumber < testSampleCount
```

Loads:

- dataset config artifact
- dataset snapshot artifact
- model config artifact
- model IR artifact

Creates:

```java
ModelInferenceJob
```

Queues job.

Updates:

```java
inferenceReady = QUEUED
```

---

## Step 2

Runtime performs inference.

Produces:

```text
inference_result.json
```

---

## Step 3

Runtime callback:

```http
POST /api/v1/runtime/inference
```

Creates:

```java
INFERENCE_RESULT
```

Updates:

```java
inferenceReady = DONE
```

or

```java
inferenceReady = FAILED
```

---

# Frontend IDE Endpoints

All IDE endpoints are under:

```text
/api/v1/experiment/{id}
```

---

## Home

```http
GET /
```

Returns:

```java
ExperimentHomeResponse
```

Contains:

- experiment info
- status
- creator
- timestamps

---

## Dataset Screen

```http
GET /dataset
```

Returns:

```java
ExperimentDatasetResponse
```

Contains:

- provider
- dataset name
- shapes
- sample counts
- config
- validation error

---

## Model Screen

```http
GET /model
```

Returns:

```java
ExperimentModelResponse
```

Contains:

- model IR
- optimizer
- loss function
- learning rate
- epochs
- shapes
- training status

---

## Telemetry Screen

```http
GET /telemetry
```

Returns:

```java
ExperimentTelemetryResponse
```

Contains:

```java
publisherServiceUrl
publisherTopic
startedAt
endedAt
```

Frontend connects directly to telemetry service.

Transport is not involved after discovery.

---

## Metrics Screen

```http
GET /metrics
```

Returns:

```java
ExperimentMetricsResponse
```

Contains:

```java
finalMetrics
trainMetrics
testMetrics
```

Graph data is extracted from JSONL.

Final metrics are served from database tables.

---

## Inference Screen

```http
GET /inference
```

Returns:

```java
ExperimentInferenceResponse
```

Contains:

```java
sampleNumber
modelIr
inferenceResult
lastInferenceError
```

---

# Infrastructure Services

## ObjectStorageService

Provides:

```java
upload()
download()

readJson()
readJsonLines()
readLastJsonLine()

delete()
generatePresignedUrl()
```

Used by:

- dataset
- model
- metrics
- inference

---

## ActionQueueService

Provides:

```java
enqueue(priority, payload)
```

Used by:

- dataset validation jobs
- training jobs
- inference jobs

---

# Design Principles

1. Runtime performs computation.
2. Transport stores metadata.
3. Artifacts are immutable files in MinIO.
4. Database stores references, not blobs.
5. Frontend never accesses MinIO directly.
6. Frontend never knows queue internals.
7. Metrics are materialized into database tables for fast retrieval.
8. Training telemetry is streamed directly from telemetry infrastructure after discovery.
9. Every workflow is recoverable from database + artifacts.
