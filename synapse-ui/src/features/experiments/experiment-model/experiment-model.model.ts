import type { ExperimentModelResponse } from "@/types/api/experiment/experiment-model.response";
import type { RunTrainingResponse } from "@/types/api/model/run-training.response";
import type { SaveModelConfigResponse } from "@/types/api/model/save-model-config.response";
import { LossFunctionType, ModelStatus, OptimizerType } from "@/types/enums/transport.enums";
import { EncoderType, LayerType, NeuronType, SurrogateType } from "@/types/enums/runtime.enums";
import type { LayerParams } from "@/types/runtime/model/layer-params.type";
import type { ModelIR } from "@/types/runtime/model/model-ir.type";
import type { NeuronParams } from "@/types/runtime/model/neuron-params.type";
import type { SurrogateParams } from "@/types/runtime/model/surrogate-params.type";

export interface TrainingForm {
    optimizer: OptimizerType;
    lossFunction: LossFunctionType;
    learningRate: number;
    epochs: number;
}

export type LayerParamValue = string | number | boolean | null;
export type NeuronParamValue = string | number | boolean | null;

export interface ExperimentModelData {
    model: ExperimentModelResponse | null;
    builderGraph: ModelIR;
    modelIrText: string;
    selectedLayerIndex: number | null;
    trainingForm: TrainingForm;
    saveResponse: SaveModelConfigResponse | null;
    trainingResponse: RunTrainingResponse | null;
    loading: boolean;
    saving: boolean;
    training: boolean;
    error: string | null;
}

export const modelBuilderLayerPalette: LayerType[] = [
    LayerType.FLATTEN,
    LayerType.LINEAR,
    LayerType.CONV_2D,
    LayerType.MAX_POOL_2D,
    LayerType.AVG_POOL_2D,
    LayerType.BATCH_NORM_2D,
    LayerType.DROPOUT,
];

export const modelBuilderNeuronTypes: NeuronType[] = [
    NeuronType.IF,
    NeuronType.LIF,
    NeuronType.PLIF,
    NeuronType.EIF,
    NeuronType.KLIF,
    NeuronType.QIF,
    NeuronType.LIAF,
];

export function createDefaultNeuron(type: NeuronType = NeuronType.LIF): NeuronParams {
    if (type === NeuronType.IF) {
        return {
            type,
            v_threshold: 1,
            v_reset: 0,
            detach_reset: true,
        };
    }

    if (type === NeuronType.PLIF) {
        return {
            type,
            init_tau: 2,
            decay_input: true,
            v_threshold: 1,
            v_reset: 0,
            detach_reset: true,
        };
    }

    if (type === NeuronType.EIF) {
        return {
            type,
            tau: 2,
            delta_T: 1,
            theta_rh: 1,
            v_threshold: 1,
            v_reset: 0,
            v_rest: 0,
            detach_reset: true,
        };
    }

    if (type === NeuronType.KLIF) {
        return {
            type,
            tau: 2,
            scale_reset: true,
            v_threshold: 1,
            v_reset: 0,
            detach_reset: true,
        };
    }

    if (type === NeuronType.QIF) {
        return {
            type,
            tau: 2,
            v_c: 0,
            a0: 1,
            v_threshold: 1,
            v_reset: 0,
            v_rest: 0,
            detach_reset: true,
        };
    }

    if (type === NeuronType.LIAF) {
        return {
            type,
            tau: 2,
            threshold_related: true,
            v_threshold: 1,
            v_reset: 0,
            detach_reset: true,
        };
    }

    return {
        type,
        tau: 2,
        decay_input: true,
        v_threshold: 1,
        v_reset: 0,
        detach_reset: true,
    };
}

export function layerSupportsNeuron(type: LayerType): boolean {
    return type === LayerType.LINEAR || type === LayerType.CONV_1D || type === LayerType.CONV_2D || type === LayerType.CONV_3D;
}

export function createDefaultLayer(type: LayerType): LayerParams {
    if (type === LayerType.LINEAR) {
        return {
            type,
            out_features: 10,
            bias: true,
            neuron: createDefaultNeuron(),
        };
    }

    if (type === LayerType.CONV_1D) {
        return {
            type,
            out_channels: 16,
            kernel_size: 3,
            stride: 1,
            padding: 1,
            bias: true,
            neuron: createDefaultNeuron(),
        };
    }

    if (type === LayerType.CONV_2D) {
        return {
            type,
            out_channels: 16,
            kernel_size: 3,
            stride: 1,
            padding: 1,
            bias: true,
            neuron: createDefaultNeuron(),
        };
    }

    if (type === LayerType.CONV_3D) {
        return {
            type,
            out_channels: 16,
            kernel_size: 3,
            stride: 1,
            padding: 1,
            bias: true,
            neuron: createDefaultNeuron(),
        };
    }

    if (
        type === LayerType.MAX_POOL_1D ||
        type === LayerType.MAX_POOL_2D ||
        type === LayerType.MAX_POOL_3D ||
        type === LayerType.AVG_POOL_1D ||
        type === LayerType.AVG_POOL_2D ||
        type === LayerType.AVG_POOL_3D
    ) {
        return {
            type,
            kernel_size: 2,
            stride: 2,
        } as LayerParams;
    }

    if (type === LayerType.DROPOUT) {
        return {
            type,
            p: 0.2,
        };
    }

    return { type } as LayerParams;
}

function createDefaultSurrogate(type: SurrogateType = SurrogateType.ATAN): SurrogateParams {
    if (type === SurrogateType.LEAKY_K_RELU) {
        return {
            type,
            leak: 0.01,
            k: 1,
        };
    }

    return {
        type,
        alpha: 2,
    } as SurrogateParams;
}

export const initialModelIr: ModelIR = {
    simulation: {
        timesteps: 100,
    },
    encoder: {
        type: EncoderType.POISSON,
    },
    surrogate: createDefaultSurrogate(),
    layers: [createDefaultLayer(LayerType.FLATTEN), createDefaultLayer(LayerType.LINEAR)],
};

export const initialTrainingForm: TrainingForm = {
    optimizer: OptimizerType.ADAM,
    lossFunction: LossFunctionType.CROSS_ENTROPY,
    learningRate: 0.001,
    epochs: 10,
};

export const initialExperimentModelData: ExperimentModelData = {
    model: null,
    builderGraph: initialModelIr,
    modelIrText: JSON.stringify(initialModelIr, null, 2),
    selectedLayerIndex: 0,
    trainingForm: initialTrainingForm,
    saveResponse: null,
    trainingResponse: null,
    loading: false,
    saving: false,
    training: false,
    error: null,
};

export function trainingFormFromResponse(model: ExperimentModelResponse | null): TrainingForm {
    return {
        optimizer: model?.optimizer ?? initialTrainingForm.optimizer,
        lossFunction: model?.lossFunction ?? initialTrainingForm.lossFunction,
        learningRate: model?.learningRate ?? initialTrainingForm.learningRate,
        epochs: model?.epochs ?? initialTrainingForm.epochs,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function isModelIr(value: unknown): value is ModelIR {
    if (!isRecord(value)) {
        return false;
    }

    const simulation = value.simulation;
    const encoder = value.encoder;
    const surrogate = value.surrogate;
    const layers = value.layers;

    return (
        isRecord(simulation) &&
        typeof simulation.timesteps === "number" &&
        isRecord(encoder) &&
        typeof encoder.type === "string" &&
        isRecord(surrogate) &&
        typeof surrogate.type === "string" &&
        Array.isArray(layers)
    );
}

export function isModelTerminal(status: ModelStatus): boolean {
    return status === ModelStatus.DONE || status === ModelStatus.FAILED;
}

export function graphToText(graph: ModelIR): string {
    return JSON.stringify(graph, null, 2);
}

export function getTelemetryLayerIndexForModelLayer(layers: LayerParams[], modelLayerIndex: number): number | null {
    const targetLayer = layers[modelLayerIndex];

    if (!targetLayer || !layerSupportsNeuron(targetLayer.type)) {
        return null;
    }

    const targetRecord = targetLayer as LayerParams & { neuron?: NeuronParams | null };

    if (!targetRecord.neuron) {
        return null;
    }

    let runtimeIndex = 0;

    for (let index = 0; index < modelLayerIndex; index += 1) {
        const layer = layers[index];
        runtimeIndex += 1;

        if (layer && layerSupportsNeuron(layer.type)) {
            const record = layer as LayerParams & { neuron?: NeuronParams | null };

            if (record.neuron) {
                runtimeIndex += 1;
            }
        }
    }

    return runtimeIndex + 1;
}

export function createSurrogateForType(type: SurrogateType): SurrogateParams {
    return createDefaultSurrogate(type);
}
