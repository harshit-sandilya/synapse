import type { StateCreator } from "zustand";

import type {
    ExperimentModelData,
    LayerParamValue,
    NeuronParamValue,
    TrainingForm,
} from "@/features/experiments/experiment-model/experiment-model.model";
import {
    createDefaultLayer,
    createDefaultNeuron,
    createSurrogateForType,
    graphToText,
    initialModelIr,
    isModelIr,
    isModelTerminal,
    layerSupportsNeuron,
    trainingFormFromResponse,
} from "@/features/experiments/experiment-model/experiment-model.model";
import { getModel, runTraining, saveModelConfig } from "@/services/experiment-model.service";
import { EncoderType, LayerType, NeuronType, SurrogateType } from "@/types/enums/runtime.enums";
import type { LayerParams } from "@/types/runtime/model/layer-params.type";
import type { ModelIR } from "@/types/runtime/model/model-ir.type";
import type { NeuronParams } from "@/types/runtime/model/neuron-params.type";

const MODEL_REFRESH_DELAY_MS = 2000;
const MODEL_REFRESH_ATTEMPTS = 20;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function validateTrainingForm(form: TrainingForm): string | null {
    if (form.learningRate <= 0) {
        return "Learning rate must be greater than zero.";
    }

    if (!Number.isInteger(form.epochs) || form.epochs <= 0) {
        return "Epochs must be a positive integer.";
    }

    return null;
}

function normalizeSelectedIndex(selectedLayerIndex: number | null, layerCount: number): number | null {
    if (layerCount === 0) {
        return null;
    }

    if (selectedLayerIndex == null) {
        return 0;
    }

    return Math.min(selectedLayerIndex, layerCount - 1);
}

function updateLayer(graph: ModelIR, index: number, layer: LayerParams): ModelIR {
    return {
        ...graph,
        layers: graph.layers.map((item, itemIndex) => (itemIndex === index ? layer : item)),
    };
}

export interface ExperimentModelActions {
    loadModel: (experimentId: string) => Promise<void>;
    setTrainingField: <K extends keyof TrainingForm>(field: K, value: TrainingForm[K]) => void;
    setBuilderGraph: (graph: ModelIR) => void;
    setModelIrText: (value: string) => void;
    setSelectedLayerIndex: (index: number | null) => void;
    setSimulationTimesteps: (value: number) => void;
    setEncoderType: (value: EncoderType) => void;
    setSurrogateType: (value: SurrogateType) => void;
    addLayer: (type: LayerType) => void;
    removeLayer: (index: number) => void;
    moveLayer: (fromIndex: number, toIndex: number) => void;
    updateLayerParam: (index: number, field: string, value: LayerParamValue) => void;
    setLayerNeuronType: (index: number, type: NeuronType) => void;
    updateLayerNeuronParam: (index: number, field: string, value: NeuronParamValue) => void;
    serializeBuilderGraphToModelIr: () => ModelIR | null;
    saveModel: (experimentId: string) => Promise<boolean>;
    runTraining: (experimentId: string) => Promise<boolean>;
    refreshUntilModelTerminal: (experimentId: string) => Promise<void>;
}

export const createExperimentModelController: StateCreator<
    ExperimentModelData & ExperimentModelActions,
    [],
    [],
    ExperimentModelActions
> = (set, get) => ({
    loadModel: async (experimentId) => {
        set({ loading: true, error: null });

        const result = await getModel(experimentId);

        if (result.error || result.data == null) {
            set({
                loading: false,
                error: result.error ?? "Failed to load model.",
            });
            return;
        }

        const builderGraph = result.data.modelIr ?? initialModelIr;

        set({
            model: result.data,
            builderGraph,
            modelIrText: graphToText(builderGraph),
            selectedLayerIndex: normalizeSelectedIndex(get().selectedLayerIndex, builderGraph.layers.length),
            trainingForm: trainingFormFromResponse(result.data),
            loading: false,
            error: null,
        });
    },

    setTrainingField: (field, value) => {
        set((state) => ({
            trainingForm: {
                ...state.trainingForm,
                [field]: value,
            },
            error: null,
        }));
    },

    setBuilderGraph: (graph) => {
        set({
            builderGraph: graph,
            modelIrText: graphToText(graph),
            selectedLayerIndex: normalizeSelectedIndex(get().selectedLayerIndex, graph.layers.length),
            error: null,
        });
    },

    setModelIrText: (value) => {
        set({ modelIrText: value, error: null });
    },

    setSelectedLayerIndex: (index) => {
        set({ selectedLayerIndex: index });
    },

    setSimulationTimesteps: (value) => {
        const timesteps = Math.max(1, Math.floor(value || 1));

        set((state) => {
            const builderGraph = {
                ...state.builderGraph,
                simulation: {
                    ...state.builderGraph.simulation,
                    timesteps,
                },
            };

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                error: null,
            };
        });
    },

    setEncoderType: (value) => {
        set((state) => {
            const builderGraph: ModelIR = {
                ...state.builderGraph,
                encoder: {
                    type: value,
                },
            };

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                error: null,
            };
        });
    },

    setSurrogateType: (value) => {
        set((state) => {
            const builderGraph: ModelIR = {
                ...state.builderGraph,
                surrogate: createSurrogateForType(value),
            };

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                error: null,
            };
        });
    },

    addLayer: (type) => {
        set((state) => {
            const layers = [...state.builderGraph.layers, createDefaultLayer(type)];
            const builderGraph = {
                ...state.builderGraph,
                layers,
            };

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                selectedLayerIndex: layers.length - 1,
                error: null,
            };
        });
    },

    removeLayer: (index) => {
        set((state) => {
            const layers = state.builderGraph.layers.filter((_layer, layerIndex) => layerIndex !== index);
            const builderGraph = {
                ...state.builderGraph,
                layers,
            };

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                selectedLayerIndex: normalizeSelectedIndex(index, layers.length),
                error: null,
            };
        });
    },

    moveLayer: (fromIndex, toIndex) => {
        if (fromIndex === toIndex) {
            return;
        }

        set((state) => {
            const layers = [...state.builderGraph.layers];
            const [movedLayer] = layers.splice(fromIndex, 1);

            if (!movedLayer) {
                return state;
            }

            layers.splice(toIndex, 0, movedLayer);

            const builderGraph = {
                ...state.builderGraph,
                layers,
            };

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                selectedLayerIndex: toIndex,
                error: null,
            };
        });
    },

    updateLayerParam: (index, field, value) => {
        set((state) => {
            const layer = state.builderGraph.layers[index];

            if (!layer) {
                return state;
            }

            const nextLayer = {
                ...layer,
                [field]: value,
            } as LayerParams;

            const builderGraph = updateLayer(state.builderGraph, index, nextLayer);

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                error: null,
            };
        });
    },

    setLayerNeuronType: (index, type) => {
        set((state) => {
            const layer = state.builderGraph.layers[index];

            if (!layer || !layerSupportsNeuron(layer.type)) {
                return state;
            }

            const nextLayer = {
                ...layer,
                neuron: createDefaultNeuron(type),
            } as LayerParams;

            const builderGraph = updateLayer(state.builderGraph, index, nextLayer);

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                error: null,
            };
        });
    },

    updateLayerNeuronParam: (index, field, value) => {
        set((state) => {
            const layer = state.builderGraph.layers[index];

            if (!layer || !layerSupportsNeuron(layer.type)) {
                return state;
            }

            const record = layer as LayerParams & { neuron?: NeuronParams | null };
            const neuron = record.neuron ?? createDefaultNeuron();
            const nextLayer = {
                ...layer,
                neuron: {
                    ...neuron,
                    [field]: value,
                },
            } as LayerParams;

            const builderGraph = updateLayer(state.builderGraph, index, nextLayer);

            return {
                builderGraph,
                modelIrText: graphToText(builderGraph),
                error: null,
            };
        });
    },

    serializeBuilderGraphToModelIr: () => {
        const builderGraph = get().builderGraph;

        if (!isModelIr(builderGraph)) {
            set({ error: "ModelIR must include simulation, encoder, surrogate, and layers." });
            return null;
        }

        set({ modelIrText: graphToText(builderGraph), error: null });
        return builderGraph;
    },

    saveModel: async (experimentId) => {
        const modelIr = get().serializeBuilderGraphToModelIr();
        const trainingForm = get().trainingForm;
        const validationError = validateTrainingForm(trainingForm);

        if (!modelIr) {
            return false;
        }

        if (validationError) {
            set({ error: validationError });
            return false;
        }

        set({ saving: true, error: null });

        const result = await saveModelConfig({
            experimentId,
            modelIr,
            ...trainingForm,
        });

        if (result.error || result.data == null) {
            set({
                saving: false,
                error: result.error ?? "Failed to save model config.",
            });
            return false;
        }

        set({ saveResponse: result.data, saving: false, error: null });
        await get().loadModel(experimentId);
        return true;
    },

    runTraining: async (experimentId) => {
        set({ training: true, error: null });

        const result = await runTraining({ experimentId });

        if (result.error || result.data == null) {
            set({
                training: false,
                error: result.error ?? "Failed to run training.",
            });
            return false;
        }

        const trainingResponse = result.data;

        set((state) => ({
            trainingResponse,
            training: false,
            error: null,
            model: state.model
                ? {
                      ...state.model,
                      modelStatus: trainingResponse.status,
                  }
                : state.model,
        }));

        return true;
    },

    refreshUntilModelTerminal: async (experimentId) => {
        for (let attempt = 0; attempt < MODEL_REFRESH_ATTEMPTS; attempt += 1) {
            await sleep(MODEL_REFRESH_DELAY_MS);
            const result = await getModel(experimentId);

            if (result.error || result.data == null) {
                set({ error: result.error ?? "Failed to refresh model status." });
                return;
            }

            set({
                model: result.data,
                trainingForm: trainingFormFromResponse(result.data),
                error: null,
            });

            if (isModelTerminal(result.data.modelStatus)) {
                return;
            }
        }
    },
});
