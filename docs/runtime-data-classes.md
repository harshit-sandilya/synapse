# Runtime Data Classes

Scope: data classes and DTOs that represent runtime model shape, live telemetry, stored telemetry, validation/inference artifacts, and training internals. These are data flowing through runtime. Frontend should mirror only boundary-safe shapes, not internal tensor/context objects.

Sources inspected only from backend/runtime:

- `synapse-runtime/feature/model/dto/**`
- `synapse-runtime/feature/training/dto/**`
- `synapse-runtime/feature/inference/dto/**`
- `synapse-runtime/feature/dataset/dto/**`
- `synapse-runtime/common/models/events/**`
- `synapse-runtime/common/models/transport/**`
- `synapse-runtime/common/models/queue/**`

## Frontend boundary rule

Frontend data layer should split runtime data into 3 buckets:

1. **Persisted/boundary DTOs**: safe to model in frontend (`ModelIR`, training config, stored telemetry, inference result, validation notification payloads).
2. **Live event DTOs**: safe after tensor reduction (`PublishedTelemetry`).
3. **Internal runtime-only dataclasses**: do not mirror directly (`ModelTelemetry` with tensors, epoch train/eval results, `TrainingContext`).

## Model IR

Source: `synapse-runtime/feature/model/dto/model_ir.py`

```ts
type ModelIR = {
  simulation: SimulationParams;
  encoder: EncoderParams;
  surrogate: SurrogateParams;
  layers: LayerParams[];
};
```

### `SimulationParams`

Source: `simulation_params.py`

```ts
type SimulationParams = {
  timesteps: number;
};
```

### `EncoderParams`

Source: `encoder_params.py`

Discriminated by `type`.

```ts
type EncoderParams =
  | { type: "poisson" }
  | { type: "latency"; T?: number; function_type?: "linear" | "log" };
```

Defaults:

- latency `T`: `20`
- latency `function_type`: `linear`

### `SurrogateParams`

Source: `surrogate_params.py`

Discriminated by `type`.

```ts
type SurrogateParams =
  | { type: "atan"; alpha?: number }
  | { type: "sigmoid"; alpha?: number }
  | { type: "piecewise_quadratic"; alpha?: number }
  | { type: "softsign"; alpha?: number }
  | { type: "leaky_k_relu"; leak?: number; k?: number };
```

Defaults:

- `atan.alpha`: `2.0`
- `sigmoid.alpha`: `4.0`
- `piecewise_quadratic.alpha`: `1.0`
- `softsign.alpha`: `2.0`
- `leaky_k_relu.leak`: `0.01`
- `leaky_k_relu.k`: `1.0`

### `NeuronParams`

Source: `neuron_types.py`

Discriminated by `type`. Used inside trainable layer params.

```ts
type NeuronParams =
  | {
      type: "IF";
      v_threshold?: number;
      v_reset?: number | null;
      detach_reset?: boolean;
    }
  | {
      type: "LIF";
      tau?: number;
      decay_input?: boolean;
      v_threshold?: number;
      v_reset?: number | null;
      detach_reset?: boolean;
    }
  | {
      type: "PLIF";
      init_tau?: number;
      decay_input?: boolean;
      v_threshold?: number;
      v_reset?: number | null;
      detach_reset?: boolean;
    }
  | {
      type: "EIF";
      tau?: number;
      delta_T?: number;
      theta_rh?: number;
      v_threshold?: number;
      v_reset?: number;
      v_rest?: number;
      detach_reset?: boolean;
    }
  | {
      type: "KLIF";
      tau?: number;
      scale_reset?: boolean;
      v_threshold?: number;
      v_reset?: number;
      detach_reset?: boolean;
    }
  | {
      type: "QIF";
      tau?: number;
      v_c?: number;
      a0?: number;
      v_threshold?: number;
      v_reset?: number;
      v_rest?: number;
      detach_reset?: boolean;
    }
  | {
      type: "LIAF";
      tau?: number;
      threshold_related?: boolean;
      v_threshold?: number;
      v_reset?: number;
      detach_reset?: boolean;
    };
```

Validation constraints from runtime:

- `v_threshold > 0` where present.
- `tau > 1` for `LIF`, `EIF`, `KLIF`, `QIF`, `LIAF`.
- `init_tau > 1` for `PLIF`.
- `delta_T > 0` for `EIF`.
- `a0 > 0` for `QIF`.

Defaults:

- common `v_threshold`: `1.0`
- common `v_reset`: `0.0` except nullable IF/LIF/PLIF
- common `detach_reset`: `true`
- `LIF/EIF/KLIF/QIF/LIAF.tau`: `2.0`
- `PLIF.init_tau`: `2.0`
- `LIF/PLIF.decay_input`: `true`
- `EIF.delta_T`: `1.0`
- `EIF.theta_rh`: `1.0`
- `EIF/QIF.v_rest`: `0.0`
- `KLIF.scale_reset`: `true`
- `QIF.v_c`: `1.0`
- `QIF.a0`: `1.0`
- `LIAF.threshold_related`: `true`

### `LayerParams`

Source: `layer_params.py`

Discriminated by `type`.

```ts
type LayerParams =
  | { type: "Flatten" }
  | {
      type: "Linear";
      out_features: number;
      bias?: boolean;
      neuron?: NeuronParams | null;
    }
  | {
      type: "Conv1D";
      out_channels: number;
      kernel_size: number;
      stride?: number;
      padding?: number;
      bias?: boolean;
      neuron?: NeuronParams | null;
    }
  | {
      type: "Conv2D";
      out_channels: number;
      kernel_size: number | [number, number];
      stride?: number | [number, number];
      padding?: number | [number, number];
      bias?: boolean;
      neuron?: NeuronParams | null;
    }
  | {
      type: "Conv3D";
      out_channels: number;
      kernel_size: number | [number, number, number];
      stride?: number | [number, number, number];
      padding?: number | [number, number, number];
      bias?: boolean;
      neuron?: NeuronParams | null;
    }
  | { type: "MaxPool1D"; kernel_size: number; stride?: number | null }
  | { type: "MaxPool2D"; kernel_size: number; stride?: number | null }
  | { type: "MaxPool3D"; kernel_size: number; stride?: number | null }
  | { type: "AvgPool1D"; kernel_size: number; stride?: number | null }
  | { type: "AvgPool2D"; kernel_size: number; stride?: number | null }
  | { type: "AvgPool3D"; kernel_size: number; stride?: number | null }
  | { type: "BatchNorm1D" }
  | { type: "BatchNorm2D" }
  | { type: "BatchNorm3D" }
  | { type: "Dropout"; p?: number };
```

Defaults:

- trainable layer `bias`: `true`
- convolution `stride`: `1`
- convolution `padding`: `0`
- pooling `stride`: `null`
- `Dropout.p`: `0.5`

Runtime oddity to track: `MaxPool3D` and `AvgPool3D` currently accept scalar `kernel_size` and scalar/null `stride` only, unlike convolution 3D tuple support.

## Live telemetry objects

Do not mirror this in frontend directly. It contains tensors and exists before telemetry reduction.

### Published live telemetry: frontend-safe

Sources:

- `synapse-runtime/feature/training/service/telemetry_reducer.py`
- `synapse-runtime/common/models/events/published_telemetry.py`

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

Reducer semantics:

- `firing_rate`: mean spike activity.
- `sparsity`: ratio of zero spikes.
- `mean_membrane`: average membrane potential.
- `membrane_std`: membrane potential standard deviation.
- `dead_neuron_ratio`: neurons with no spikes across batch/time.
- `saturated_neuron_ratio`: neurons firing every timestep across batch/time.

## Stored inference telemetry

Source: `synapse-runtime/feature/inference/dto/stored_model_telemetry.py`

Used in inference result artifact. Tensor values converted to nested float arrays.

```ts
type StoredLayerTelemetry = {
  layer_index: number;
  layer_name: string;
  spikes: number[][];
  membrane_potentials: number[][];
  threshold: number;
  tau: number | null;
};

type StoredModelTelemetry = {
  timestep: number;
  layers: StoredLayerTelemetry[];
};
```

## Inference result artifact

Source: `synapse-runtime/feature/inference/dto/inference_result.py`

```ts
type InferenceResult = {
  sample_number: number;
  prediction: number[] | number;
  target: number[] | number;
  telemetry: StoredModelTelemetry;
};
```

Note: field names are snake_case in runtime artifact (`sample_number`), unlike transport HTTP DTOs that use camelCase.

## Validation telemetry / runtime notifications

Runtime notifies transport about validation/training/inference lifecycle using Pydantic models in `synapse-runtime/common/models/transport/**`.

## Internal runtime-only training dataclasses

Sources: `synapse-runtime/feature/training/dto/**`

Do not expose these as frontend contracts:

- `EpochTrainResult`: `loss`, tensor `predictions`, tensor `targets`.
- `EpochEvalResult`: `loss`, tensor `predictions`, tensor `targets`.
- `EpochMetrics`: epoch-normalized metrics written to artifact/storage.
- `TrainingContext`: live runtime object containing model, optimizer, loss function, dataloaders, IDs, telemetry queue, storage keys.

If frontend needs historical metrics, consume transport `ExperimentMetricsResponse` instead of runtime dataclasses.
