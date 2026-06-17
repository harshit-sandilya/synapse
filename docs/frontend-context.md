# Synapse Frontend Architecture & Flow

## Overview

Synapse is designed as an experimentation platform for Spiking Neural Networks (SNNs). The frontend acts as a thin orchestration layer responsible for:

- Managing runtime connections
- Managing experiment metadata
- Building experiment configurations
- Monitoring experiment execution
- Displaying experiment results

The frontend never directly manages training execution. All execution responsibility belongs to the Transport Layer and Runtime Layer.

---

# High Level Flow

```text
User
 │
 ▼
Home Page
 │
 ├── Create Runtime Session
 │
 └── Connect Existing Runtime Session
          │
          ▼
      Session Page
          │
          ├── Load Experiments
          ├── Create Experiment
          └── Open Experiment
                    │
                    ▼
            Experiment IDE
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    Dataset      Model      Training
 Configuration  Builder     Monitor

                    │
                    ▼
             Submit Experiment
                    │
                    ▼
             Transport Layer
```

---

# Design Philosophy

## MVC-Based Features

Every feature follows:

```text
feature/
├── model.ts
├── controller.ts
├── store.ts
├── service.ts
```

### Model

Contains DTOs and screen state.

### Controller

Contains all business logic.

### Store

Combines Zustand state + controller.

### Service

Handles API communication.

Views should contain as little logic as possible.

---

# Session System

---

## Purpose

A session represents a connection to a Runtime.

A Runtime is not an experiment.

A Runtime is an execution environment.

Example:

```text
Runtime URL:
http://localhost:8080

Runtime Name:
research-cluster

Username:
harshit
```

---

## Session Model

```ts
export interface SessionForm {
  username: string;
  runtimeURL: string;
  runtimeName: string;
}

export interface SessionEntry extends SessionForm {
  id: string;
  lastConnected: number;
}
```

---

## Session Storage

Stored locally using Zustand Persist.

```text
localStorage
 ├── currentSession
 └── savedSessions
```

No manual localStorage calls.

Persist middleware handles everything.

---

## Home Page

Route:

```text
/
```

Contains:

```text
┌───────────────────────────┐
│ Runtime Initialization    │
│                           │
│ Username                  │
│ Runtime URL               │
│ Runtime Name              │
│                           │
│ Connect                   │
└───────────────────────────┘

┌───────────────────────────┐
│ Recent Sessions           │
│                           │
│ Session Card              │
│ Session Card              │
│ Session Card              │
│ Scrollable                │
└───────────────────────────┘
```

---

## Connection Flow

### New Session

```text
User fills form
        │
        ▼
connectToNewSession()
        │
        ▼
Create SessionEntry
        │
        ▼
Store in savedSessions
        │
        ▼
Set currentSession
        │
        ▼
Navigate /session
```

---

### Existing Session

```text
Click Recent Session
        │
        ▼
connectToSavedSession(id)
        │
        ▼
Set currentSession
        │
        ▼
Update lastConnected
        │
        ▼
Navigate /session
```

---

# Session Page

Route

```text
/session
```

Purpose:

Runtime-level dashboard.

---

## Layout

```text
┌─────────────────────────────┐
│ Runtime Bar                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Experiment List             │
│                             │
│ Experiment                  │
│ Experiment                  │
│ Experiment                  │
└─────────────────────────────┘

                (+)
```

---

# Runtime Bar

Displays:

```text
● Connected

runtime-name
runtime-url

[ Disconnect ]
```

---

## Disconnect Flow

```text
Disconnect
      │
      ▼
disconnectSession()
      │
      ▼
currentSession = undefined
      │
      ▼
Navigate /
```

---

# Experiment List Feature

Feature Folder

```text
features/
└── experiment-list
```

---

## Purpose

Displays experiments available in current runtime.

---

## Model

```ts
export interface RuntimeExperiments {
  experiments: Experiment[];
  loading: boolean;
  error?: string;
}
```

---

## Load Flow

```text
Session Page Loads
        │
        ▼
loadExperiments()
        │
        ▼
experimentService.getExperiments()
        │
        ▼
/api/experiments
        │
        ▼
Store populated
        │
        ▼
Render Experiment Cards
```

---

# Experiment DTO

Frontend receives a lightweight DTO.

```ts
export interface Experiment {
  id: string;

  name: string;

  status: ExperimentStatus;

  createdAt: number;

  updatedAt: number;
}
```

Frontend intentionally does not receive full backend entities.

---

# Experiment Create Feature

Feature Folder

```text
features/
└── experiment-create
```

Purpose:

Create experiment metadata only.

No training logic.

No model logic.

No dataset logic.

Only database registration.

---

## Create Flow

```text
Click +
      │
      ▼
/experiment/new
      │
      ▼
Fill Metadata
      │
      ▼
POST /api/experiments
      │
      ▼
Transport Layer
      │
      ▼
Experiment Created
      │
      ▼
Return DTO
      │
      ▼
Navigate /experiment/[id]
```

---

# Experiment IDE

Feature Folder

```text
features/
└── experiment-ide
```

Route

```text
/experiment/[id]
```

Purpose:

Complete experiment configuration.

---

## Layout

```text
Experiment IDE

Sidebar
│
├── Home
├── Dataset
├── Model
├── Training
└── Testing
```

---

# Home Pane

Shows:

```text
Experiment Name
Status

Dataset Ready      ✓
Model Ready        ✓
Training Ready     ✗
```

Read-only overview.

---

# Dataset Pane

Purpose:

Configure dataset.

Initially supports:

```python
torchvision
torchaudio
torchtext
```

Examples:

```text
MNIST
FashionMNIST
CIFAR10
```

Configuration stored in backend.

---

# Model Builder Pane

Purpose:

Create model IR.

Supports:

```text
Encoder

Layers

Hyperparameters

Readout
```

Produces model IR.

---

# Training Monitor

Purpose:

Observe running experiment.

Displays:

```text
Loss Curves

Accuracy

Spike Activity

Telemetry

Training Logs
```

Consumes backend event stream.

No polling.

---

# Test Runner

Purpose:

Run inference on trained model.

Displays:

```text
Prediction

Ground Truth

Spike Activity

Output Analysis
```

---

# Transport Architecture

Frontend does not talk to Runtime directly.

---

## Architecture

```text
Frontend
    │
    ▼
Transport Layer
    │
    ├── Database
    ├── Redis
    ├── Event Stream
    └── Runtime Workers
```

---

## Runtime Discovery

When session opens:

```text
Frontend
    │
    ▼
GET Runtime Info
    │
    ▼
Transport Layer
    │
    ▼
Return Experiments
```

---

## Experiment Submission

```text
Frontend
      │
      ▼
Submit IR
      │
      ▼
Transport Layer
      │
      ▼
Redis Queue
      │
      ▼
Runtime Worker
      │
      ▼
Training Starts
```

---

## Monitoring

```text
Runtime
     │
     ▼
Event Stream
     │
     ▼
Transport Layer
     │
     ▼
Frontend
```

Events:

```text
QUEUED
STARTED
RUNNING
COMPLETED
FAILED
```

---

# Backend Data Model

## Runtime

```text
Runtime
 ├── id
 ├── runtimeName
 └── metadata
```

---

## Runtime Users

```text
Runtime
      │
      ▼
RuntimeUser
      │
      ▼
username
```

Many users can share one runtime.

---

## Experiment

```text
Experiment
 ├── id
 ├── runtimeId
 ├── name
 ├── status
 ├── createdAt
 └── updatedAt
```

---

## Experiment Configuration

Stored separately.

```text
Dataset Config

Model IR

Training Config

Metrics

Checkpoints

Artifacts
```

---

# Frontend Folder Structure

```text
src/

├── app
│   ├── page.tsx
│   ├── session
│   ├── experiment
│   │   ├── new
│   │   └── [id]
│
├── components
│   ├── home
│   │   ├── connectionForm
│   │   ├── recentSessions
│   │   └── recentSessionCard
│   │
│   ├── session
│   │   ├── runtimeBar
│   │   ├── experimentList
│   │   └── addExperimentButton
│
├── features
│   ├── session
│   │   ├── model.ts
│   │   ├── controller.ts
│   │   └── store.ts
│   │
│   ├── experiment-list
│   │   ├── model.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   └── store.ts
│   │
│   ├── experiment-create
│   │   ├── model.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   └── store.ts
│   │
│   └── experiment-ide
│       ├── model.ts
│       ├── controller.ts
│       ├── service.ts
│       └── store.ts
│
├── services
│   ├── experiment.service.ts
│   └── runtime.service.ts
│
├── data
│   └── mock
│
└── app/api
    └── experiments
```

# Current Status

✅ Design system completed
✅ Session management completed
✅ Runtime connection flow completed
✅ Persistent session storage completed
✅ Runtime page completed
✅ Experiment list architecture defined
✅ Experiment create architecture defined
✅ Transport architecture defined
✅ Cloud deployment architecture defined

### Next Implementation Steps

1. Mock Experiment Create API
2. Experiment Create Service
3. Experiment Create Store
4. Experiment Create Form UI
5. Experiment IDE Layout
6. Dataset Configuration Pane
7. Model Builder Pane
8. Training Monitor
9. Test Runner
10. Replace mock APIs with Spring Transport Layer APIs
