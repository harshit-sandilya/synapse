# Synapse Runtime

## Overview

Synapse Runtime is the execution engine responsible for dataset validation, model training, telemetry generation, checkpoint management, metric tracking, and model inference.

The runtime operates as an Event-Driven Architecture (EDA) service. It consumes jobs from Redis queues, executes them sequentially, interacts with MinIO object storage, and reports status updates back to the Transport service.

The runtime itself is stateless. All persistent artifacts are stored in MinIO and all job definitions originate from Transport.

---

# Architecture

```text
+-------------------+
|     Transport     |
+---------+---------+
          |
          | QueueJob
          v
+-------------------+
|   Redis Queue     |
+---------+---------+
          |
          v
+-------------------+
|      Worker       |
+---------+---------+
          |
          v
+-------------------+
|    Dispatcher     |
+---------+---------+
          |
    +-----+-----+-----+
    |           |     |
    v           v     v
 Dataset    Training  Inference
Validation   Engine    Engine
```

---

# Core Principles

## Event Driven

Runtime never receives execution requests through REST APIs.

Execution always starts from queue consumption.

Transport is responsible for:

- Creating jobs
- Scheduling jobs
- Updating experiment state

Runtime is responsible for:

- Executing jobs
- Producing artifacts
- Reporting results

---

## Stateless Execution

Runtime does not maintain long-term state.

All state is stored in:

### MinIO

- Dataset snapshots
- Metrics
- Checkpoints
- Inference outputs

### Redis

- Job queues
- Live telemetry

---

## Sequential Scheduling

Current MVP executes one job at a time.

```text
Worker
 └─ Dispatcher
     └─ Executor
         └─ Service
```

Future versions may replace the worker with:

- Multi-worker execution
- GPU schedulers
- SLURM integration
- Kubernetes batch jobs

without changing job contracts.

---

# Job Flow

Every runtime task starts with:

```json
{
  "timestamp": "...",
  "message": "...",
  "jobType": "...",
  "payload": {}
}
```

Represented by:

```python
class QueueJob[T]:
    timestamp: datetime
    message: str
    job_type: JobType
    payload: T
```

---

# Worker

Worker continuously polls Redis.

Priority order:

```text
HIGH
MEDIUM
LOW
```

Pseudo flow:

```text
while True:
    pop highest priority job
    dispatch job
```

---

# Dispatcher

Dispatcher routes jobs based on JobType.

```python
match job.job_type:
    case DATASET_VALIDATION:
        ...
    case MODEL_TRAINING:
        ...
    case MODEL_INFERENCE:
        ...
```

Dispatcher contains no business logic.

---

# Dataset Validation

## Purpose

Validate that:

- Dataset exists
- Dataset downloads correctly
- Snapshot generation succeeds
- Snapshot can be reloaded
- Shapes can be inferred

before training begins.

---

## Input

```python
class DatasetValidationJob:
    workspace_id
    experiment_id
    provider
    dataset_name
    dataset_config_storage_key
```

---

## Validation Steps

### 1. Download Dataset Config

Loads:

```json
{
  "batchSize": 16,
  "numWorkers": 4,
  "shuffle": true,
  "pinMemory": true,
  "dropLast": false,
  "prefetchFactor": 2,
  "persistentWorkers": true
}
```

---

### 2. Create Torch Dataset

Uses:

```python
DatasetFactory.create(...)
```

Supported MVP datasets:

```python
torchvision.datasets.*
```

---

### 3. Create Snapshot

Both datasets are processed:

```text
train
test
```

and converted into sharded parquet files.

Example:

```text
experiments/{experiment_id}/dataset/train/
experiments/{experiment_id}/dataset/test/
```

---

### 4. Upload Snapshot

Snapshot shards are uploaded to MinIO.

---

### 5. Reload Snapshot

Validation re-opens the snapshot through the same streaming pipeline used during training.

This guarantees:

```text
Validation success
=
Training can load data
```

---

### 6. Infer Shapes

```python
sample_x, sample_y = next(iter(loader))
```

Produces:

```python
input_shape
output_shape
```

Example:

```text
[16, 1, 28, 28]
[16]
```

---

### 7. Count Samples

Produces:

```python
train_sample_count
test_sample_count
```

---

### 8. Notify Transport

Returns:

```python
DatasetValidationRequest
```

Status:

```python
READY
```

or

```python
FAILED
```

---

# Dataset Storage Architecture

## Object Storage

MinIO acts as:

```text
S3
```

---

## Runtime Cache

Runtime cache acts as:

```text
Lustre
```

Local filesystem cache used during execution.

```text
MinIO
   ↓
Runtime Cache
   ↓
Execution
```

---

## Streaming Dataset

Training never loads the entire dataset.

Dataset is represented by:

```python
StreamingParquetDataset
```

Each worker:

```text
Downloads one shard
Processes it
Deletes local copy
Moves to next shard
```

This allows datasets larger than runtime memory.

---

# Model IR

Models are described through a JSON Intermediate Representation.

Example:

```json
{
  "simulation": {
    "timesteps": 32
  },
  "encoder": {
    "type": "poisson"
  },
  "surrogate": {
    "type": "atan"
  },
  "layers": [...]
}
```

---

# Model Construction Pipeline

```text
JSON
  ↓
ModelIRParser
  ↓
ModelValidator
  ↓
SynapseModelBuilder
  ↓
SynapseSNNModel
```

---

# Supported Components

## Encoders

```python
Poisson
Latency
Periodic
```

---

## Neurons

```python
IF
LIF
PLIF
EIF
LIAF
KLIF
QIF
```

---

## Surrogates

```python
ATan
Sigmoid
```

---

## Layers

```python
Flatten
Linear

Conv1D
Conv2D
Conv3D

MaxPool1D
MaxPool2D
MaxPool3D

AvgPool1D
AvgPool2D
AvgPool3D

BatchNorm1D
BatchNorm2D
BatchNorm3D

Dropout
```

---

# SynapseSNNModel

Runtime model abstraction.

Responsibilities:

```python
forward()
train_step()
predict_step()
reset_state()
```

Outputs:

```python
prediction
telemetry
```

---

# Runtime Telemetry

Internal telemetry structure:

```python
ModelTelemetry
```

Contains:

```python
LayerTelemetry
```

Each layer reports:

```python
spikes
membrane_potentials
threshold
tau
```

Spikes and membrane potentials are stored as:

```text
[T, N]
```

Where:

```text
T = timesteps
N = neurons/channels
```

Batch dimension is averaged away.

---

# Training Context

Training jobs are transformed into:

```python
TrainingContext
```

Containing:

```python
model
optimizer
loss_fn

train_loader
test_loader

task_type
epochs
```

and runtime artifacts:

```python
telemetry_queue_name
metrics_storage_key
checkpoint_storage_key
```

---

# Model Sanity Checking

Before training begins:

```python
ModelSanityChecker
```

executes a forward pass.

---

## Regression

Output must match expected shape.

Example:

```text
[B, 1]
```

---

## Classification

Output must satisfy:

```text
[B, X]
```

Where:

```text
X >= 2
```

---

# Training Engine

Execution flow:

```text
Build Context
    ↓
Notify Transport Start
    ↓
Epoch Loop
    ↓
Train
    ↓
Evaluate
    ↓
Metrics
    ↓
Checkpoint
    ↓
Notify Transport End
```

---

# Trainer

Runs one epoch.

Produces:

```python
EpochTrainResult
```

Containing:

```python
loss
predictions
targets
```

---

# Evaluator

Runs test evaluation.

Produces:

```python
EpochEvalResult
```

Containing:

```python
loss
predictions
targets
```

---

# Metrics Pipeline

Metrics are calculated asynchronously.

---

## Classification Metrics

```python
Loss
Accuracy
Precision
Recall
F1
```

---

## Regression Metrics

```python
Loss
MSE
RMSE
MAE
R2
```

---

## Metrics Writer

Runs in a background thread.

Consumes:

```python
EpochTrainResult
EpochEvalResult
```

Produces:

```json
{
  "epoch": 1,
  "train_metrics": {},
  "test_metrics": {}
}
```

Stored as:

```text
metrics.jsonl
```

---

# Telemetry Pipeline

Telemetry is too large to stream directly.

It is reduced before publishing.

---

## Published Telemetry

```python
PublishedTelemetry
```

Per layer:

```python
firing_rate
sparsity

mean_membrane
membrane_std

dead_neuron_ratio
saturated_neuron_ratio

threshold
tau
```

---

## Telemetry Publisher

Runs in a background thread.

Consumes:

```python
ModelTelemetry
```

Produces:

```python
PublishedTelemetry
```

Stores latest snapshot only.

Queue always contains:

```text
1 latest telemetry object
```

This prevents queue growth.

---

# Checkpointing

Checkpointing runs asynchronously.

---

## Save Strategy

Only save when:

```python
validation_loss < best_loss
```

---

## Saved Artifact

```python
{
  epoch,
  loss,
  state_dict
}
```

Stored as:

```text
best.pt
```

---

# Training Notifications

Training start:

```python
TrainingStartRequest
```

Contains:

```python
status
telemetry_queue_name
metrics_storage_key
```

---

Training end:

```python
TrainingEndRequest
```

Contains:

```python
status
metrics_storage_key
checkpoint_storage_key
```

or

```python
training_error
```

---

# Inference Engine

Inference loads:

```python
dataset
model
checkpoint
```

using the same pipeline as training.

---

## Inference Steps

### 1. Build Context

Uses:

```python
TrainingContextBuilder(
    inference_mode=True
)
```

Overrides:

```python
batch_size = 1
num_workers = 0
```

---

### 2. Load Checkpoint

```python
CheckpointService.load_checkpoint(...)
```

---

### 3. Select Sample

Uses:

```python
sample_number
```

against test dataset.

---

### 4. Predict

Produces:

```python
prediction
telemetry
```

---

### 5. Serialize Telemetry

Runtime telemetry:

```python
torch.Tensor
```

is converted into:

```python
StoredModelTelemetry
```

for JSON storage.

---

### 6. Store Result

Stored under:

```text
experiments/{id}/inference/sample_{n}.json
```

Contains:

```json
{
  "sample_number": 42,
  "prediction": [...],
  "target": [...],
  "telemetry": {...}
}
```

---

### 7. Notify Transport

Returns:

```python
ModelInferenceRequest
```

Status:

```python
DONE
```

or

```python
FAILED
```

---

# Future Roadmap

## Dataset

- HuggingFace datasets
- Custom parquet datasets
- Dataset versioning

---

## Training

- Distributed training
- Multi-GPU execution
- Slurm integration
- Checkpoint resumption

---

## Telemetry

- Temporal neuron inspection
- Interactive replay
- Layer-wise visualization
- Dead neuron diagnostics

---

## Inference

- Explainability views
- Random sample inspection
- User-uploaded inference

---

## Runtime Scheduler

Replace sequential worker with:

```text
Queue
  ↓
Scheduler
  ↓
GPU Resource Manager
  ↓
Execution Workers
```

without changing Transport contracts.
