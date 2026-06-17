# Synapse

Synapse is a full-stack neuromorphic ML system built as a production-style control plane plus execution plane: a `Next.js` IDE for experiment design, a `Spring Boot` transport service for orchestration and metadata, and a `Python` runtime that validates datasets, builds spiking neural networks from an IR graph, trains models, emits live telemetry, and stores artifacts in object storage. The point of the project is not just to train SNNs—it is to show the engineering discipline behind them: queue-backed execution, live observability, artifact versioning, explicit service boundaries, and a benchmark suite that measures performance, storage efficiency, latency, and runtime correctness.

## Benchmark Highlights

> Benchmarks are intentionally kept in-repo to show measured systems behavior, not just architecture claims.

| Metric                               | Headline result                                                                                                           | Measurement notes                                                                                                                                                                                                                                                                                                                       | Source                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Async telemetry throughput retention | **97.65%** retained throughput                                                                                            | Mean over **3 trials**. Baseline is **no telemetry at all**; reduced async Redis logging is compared against that baseline. For context, naive synchronous full-tensor logging retains only **16.72%** of baseline throughput, which is the stronger validation of the async design choice.                                             | [`benchmark/results/async_pipeline_overhead/20260617T073705Z/summary.json`](benchmark/results/async_pipeline_overhead/20260617T073705Z/summary.json) |
| Event pipeline latency               | **Queue p95: 27.53 ms** and **transport-ready p50: 528.19 ms** at concurrency `1`                                         | Queue latency is measured independently from orchestration latency. The **528.19 ms** baseline transport-ready median is real and currently attributed to orchestration/startup overhead between training submission and the runtime callback becoming visible in transport; the exact internal breakdown is still under investigation. | [`benchmark/results/event_pipeline_latency/20260617T090029Z/summary.json`](benchmark/results/event_pipeline_latency/20260617T090029Z/summary.json)   |
| Failure detection lead time          | Telemetry detects collapse **21 steps earlier on average**                                                                | Measured over **120-step runs** with collapse injected at **step 40**. Detection thresholds are fixed constants in the benchmark script, so this is best interpreted as a benchmarked heuristic rather than a universally calibrated production threshold.                                                                              | [`benchmark/results/failure_detection_speed/20260617T074103Z/summary.json`](benchmark/results/failure_detection_speed/20260617T074103Z/summary.json) |
| Exhaustive graph correctness         | **147** runtime compatibility cases across every declared encoder, neuron, and layer family; current pass rate **85.71%** | After fixing latency-encoder dry-run initialization in the runtime builder, all encoder variants now build successfully; the only remaining systematic failure family in the saved run is explicitly unsupported `LIAF`.                                                                                                                | [`benchmark/results/graph_correctness/20260617T093232Z/summary.json`](benchmark/results/graph_correctness/20260617T093232Z/summary.json)             |
| Telemetry storage reduction          | Hierarchical logging cuts telemetry size by **99.9639%** (**2770×** smaller than raw full-tensor logging)                 | Measured on the **same run**, with the **same model**, **same step count**, **same batch size**, and **same training pass** using a composite logger, so the comparison is apples-to-apples.                                                                                                                                            | [`benchmark/results/storage_reduction/20260617T073738Z/summary.json`](benchmark/results/storage_reduction/20260617T073738Z/summary.json)             |

## Architecture

```mermaid
flowchart TD
    U[ML Engineer] --> UI[Next.js IDE<br/>synapse-ui]
    UI --> T[Transport Service<br/>Spring Boot]

    T --> PG[(PostgreSQL<br/>metadata + experiment state)]
    T --> R[(Redis<br/>job queue + live telemetry)]
    T --> M[(MinIO<br/>artifacts + checkpoints + metrics)]

    R --> W[Runtime Worker<br/>Python]
    W --> DV[Dataset Validation]
    W --> TR[Training Engine]
    W --> IN[Inference Engine]

    DV --> M
    TR --> M
    IN --> M

    W --> T
    TR --> R
```

## Why this project is interesting

Synapse is designed like a real distributed ML product rather than a single training script:

- **Control plane / data plane split**: `synapse-transport` owns orchestration and metadata; `synapse-runtime` owns execution.
- **Queue-backed execution**: training, dataset validation, and inference are runtime jobs rather than direct synchronous API calls.
- **Live telemetry**: the runtime publishes reduced model telemetry during training so failures can be detected before loss curves fully degrade.
- **Artifact-oriented storage**: datasets, checkpoints, metrics, and inference outputs are stored in `MinIO`, while `PostgreSQL` only tracks durable metadata.
- **Benchmark-first engineering**: the repository includes dedicated benchmarks for latency, throughput overhead, failure detection, graph correctness, and telemetry compression.

## System design principles

The implementation follows a few strong architectural rules pulled directly from the codebase and docs in `docs/`:

- The **frontend talks to transport**, not directly to runtime workers.
- The **transport service** stores experiment state, artifact references, and runtime callback results.
- The **runtime is stateless** between jobs; persistent outputs live in `MinIO` and operational coordination lives in `Redis`.
- **Telemetry is treated as a systems concern**, not a side-effect: it is measured for throughput cost, latency, and storage footprint.
- **Model graphs are runtime-tested**, not assumed correct based on schema alone.

## Benchmark suite

The benchmark harness under `benchmark/` is part of the project story, not an afterthought.

| Script                                                                         | Purpose                                                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`benchmark/async_pipeline_overhead.py`](benchmark/async_pipeline_overhead.py) | Measures training throughput impact of telemetry collection/logging modes                   |
| [`benchmark/event_pipeline_latency.py`](benchmark/event_pipeline_latency.py)   | Measures transport-ready latency and Redis queue latency for live telemetry                 |
| [`benchmark/failure_detection_speed.py`](benchmark/failure_detection_speed.py) | Compares telemetry-based collapse detection versus conventional loss/accuracy signals       |
| [`benchmark/graph_correctness.py`](benchmark/graph_correctness.py)             | Exhaustively exercises declared encoder, neuron, and layer combinations against the runtime |
| [`benchmark/storage_reduction.py`](benchmark/storage_reduction.py)             | Quantifies the storage savings of hierarchical reduced telemetry versus raw tensor logging  |

### How to interpret the benchmark numbers

#### 1) Async telemetry throughput retention

The async telemetry benchmark runs **3 trials** and reports the **mean steps/second** for each condition. The headline **97.65% throughput retained** means:

- baseline = **no telemetry at all**
- measured condition = **reduced async Redis logging**
- comparison metric = mean training throughput over 3 trials

That already shows the observability path is cheap. But the more interview-interesting comparison is against the naive alternative: **synchronous full-tensor logging** retains only **16.72%** of baseline throughput. That contrast is what validates the design decision to reduce telemetry and ship it asynchronously.

#### 2) Event pipeline latency

This benchmark intentionally separates two different things:

- **transport-ready latency**: time from training submission until transport exposes telemetry publisher metadata
- **queue latency**: time from runtime emission to observation in Redis

That split matters because it avoids blaming Redis for orchestration costs. In the saved result:

- queue latency is low (`p95 = 27.53 ms` at concurrency 1)
- transport-ready latency is much larger (`p50 = 528.19 ms` at concurrency 1)

The half-second median is real. The benchmark shows it is **not** primarily a Redis live-telemetry problem. It is better explained as orchestration/startup overhead between job submission and runtime/transport synchronization becoming visible. The exact internal source—queue pickup delay, runtime context build, synchronous callback path, Spring/JPA overhead, or a combination—is **still under investigation**, and that is the honest current status.

At concurrency `3`, transport-ready latency grows sharply because the current runtime architecture is still effectively **single-worker / sequential**. That makes the benchmark useful not just as a measurement artifact but as a roadmap signal.

#### 3) Failure detection lead time

The failure detection benchmark runs for **120 total steps** and injects collapse at **step 40** by forcing a pathological neuron-threshold setting. The tracked result is that telemetry-based heuristics detect failure **21 steps earlier on average** than conventional loss/accuracy degradation.

Important caveat: the telemetry thresholds are currently fixed benchmark constants in the script:

- `dead_neuron_ratio >= 0.80`
- `firing_rate <= 0.01`
- `3` consecutive telemetry steps

and the conventional baseline uses its own fixed degradation thresholds. So the result is interview-defensible as a **benchmark demonstrating earlier observability**, but not yet positioned as a universally tuned production detector.

#### 4) Exhaustive graph correctness

The graph-correctness benchmark is intentionally harsh: it enumerates every declared encoder, neuron, and layer family in the runtime surface and tries to parse, validate, build, sanity-check, and backpropagate through them.

The graph-correctness benchmark originally exposed two dominant issues:

- **all latency encoder cases were failing during runtime builder dry-run**, because the builder used `torch.randn(...)` dummy inputs, which violate latency encoder expectations for non-negative normalized inputs
- **all `LIAF` cases were failing at runtime**, because the neuron is declared in the IR surface but does not actually survive the current execution path cleanly

Those findings now have direct runtime fixes and clearer behavior:

- the runtime builder uses non-negative dry-run input for `latency` encoders
- `LIAF` is rejected explicitly by validation with a clear message instead of crashing deep inside runtime execution

The updated saved run shows the effect of that change: **126 / 147 cases pass (85.71%)**, with the remaining **21 failures entirely attributable to `LIAF`**. That is a much better interview story than silently claiming broader support than the runtime truly provides.

#### 5) Telemetry storage reduction

The storage reduction benchmark is an apples-to-apples comparison. It uses the **same training pass** with a composite logger that writes:

- full raw tensor telemetry
- hierarchical reduced telemetry

for the **same model**, **same batch size**, **same step count**, and **same run**. That is why the `2770×` size reduction figure is credible rather than marketing math.

### Current engineering signal from the benchmarks

The benchmarks do more than produce pretty numbers—they identify where the system is strong and where it still needs work:

- **Strong**: async reduced telemetry keeps nearly all baseline throughput.
- **Strong**: Redis queue latency is low and stable in the measured single-run path.
- **Strong**: hierarchical telemetry logging makes storage overhead almost negligible.
- **Improved runtime behavior**: latency encoder builds now avoid false-negative initialization failures in the runtime dry-run path.
- **Measured correctness improvement**: the exhaustive graph benchmark now passes **126 / 147** cases, and every remaining failure belongs to the explicitly unsupported `LIAF` family.
- **More honest runtime surface**: `LIAF` is now rejected explicitly during validation rather than failing opaquely inside execution.
- **Useful pressure test**: transport-ready latency degrades sharply under concurrent runs, which points to an orchestration/startup bottleneck rather than a Redis telemetry bottleneck.

## Repository layout

```text
synapse/
├── compose.yml               # Local multi-service stack
├── docs/                     # Architecture, flows, DTO/context notes
├── benchmark/                # Benchmark harness + recorded summary artifacts
├── synapse-ui/               # Next.js experiment IDE
├── synapse-transport/        # Spring Boot orchestration + metadata service
├── synapse-runtime/          # Python execution engine for validation/training/inference
├── sj_exp/                   # SpikingJelly experiments / scratch area
└── test/                     # Local test artifacts
```

## Quickstart

### 1) Start the full stack

```sh
docker compose -f compose.yml up --build
```

Services exposed by the compose stack:

- UI: `http://localhost:3000`
- Transport: `http://localhost:8080`
- Runtime: `http://localhost:8000`
- Redis: `localhost:6379`
- MinIO: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- PostgreSQL: `localhost:5432`

### 2) Open the IDE

Visit:

```text
http://localhost:3000
```

From there, the typical flow is:

```text
connect workspace
-> create experiment
-> validate dataset
-> define model IR
-> start training
-> inspect telemetry
-> inspect metrics
-> run inference
```

### 3) Install benchmark dependencies

The benchmark harness imports shared runtime code, so the most reliable local environment is a Python virtualenv with both benchmark and runtime dependencies installed.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r synapse-runtime/requirements.txt
pip install -r benchmark/requirements.txt
```

### 4) Run the benchmark suite

```sh
python3 -m benchmark.async_pipeline_overhead
python3 -m benchmark.event_pipeline_latency
python3 -m benchmark.failure_detection_speed
python3 -m benchmark.graph_correctness
python3 -m benchmark.storage_reduction
```

Recorded benchmark summaries are kept under `benchmark/results/**/summary.json`.

## Docs

The docs folder is intentionally detailed and useful for onboarding or interview walkthroughs:

- [`docs/flow.md`](docs/flow.md) — end-to-end frontend and product flow
- [`docs/transport-context.md`](docs/transport-context.md) — transport service responsibilities and lifecycle
- [`docs/runtime-context.md`](docs/runtime-context.md) — runtime execution model and job architecture
- [`docs/design-decisions.md`](docs/design-decisions.md) — frontend and system architecture decisions

## Tech stack

- **Frontend**: Next.js, TypeScript, Zustand
- **Transport**: Spring Boot, PostgreSQL, Redis, MinIO
- **Runtime**: Python, PyTorch, SpikingJelly
- **Infra / Local Dev**: Docker Compose
- **Benchmarking**: custom Python harness with persisted JSON result artifacts

## What this README is optimizing for

This README is intentionally written like a systems project README rather than a demo-page README:

- measurable results near the top
- architecture that can be explained quickly in an interview
- honest discussion of current bottlenecks
- enough quickstart detail for someone else to run the system

If you want to dive deeper, start with the benchmark summaries and the docs folder—the code is built to match them.
