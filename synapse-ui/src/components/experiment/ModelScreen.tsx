"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ModelGraphViewer from "@/components/experiment/ModelGraphViewer";
import {
    layerSupportsNeuron,
    modelBuilderLayerPalette,
    modelBuilderNeuronTypes,
} from "@/features/experiments/experiment-model/experiment-model.model";
import { useExperimentModelStore } from "@/features/experiments/experiment-model/experiment-model.store";
import { EncoderType, LayerType, NeuronType, SurrogateType } from "@/types/enums/runtime.enums";
import { LossFunctionType, OptimizerType } from "@/types/enums/transport.enums";
import type { LayerParams } from "@/types/runtime/model/layer-params.type";
import type { NeuronParams } from "@/types/runtime/model/neuron-params.type";
import {
    ErrorBanner,
    Field,
    FieldGrid,
    LoadingState,
    SectionHeader,
    StatusPill,
} from "@/components/experiment/ExperimentPrimitives";

interface LayerFieldSchema {
    field: string;
    label: string;
    kind: "number" | "boolean";
}

const neuronFieldSchema: LayerFieldSchema[] = [
    { field: "tau", label: "Tau", kind: "number" },
    { field: "v_threshold", label: "Threshold", kind: "number" },
    { field: "v_reset", label: "Reset voltage", kind: "number" },
    { field: "detach_reset", label: "Detach reset", kind: "boolean" },
];

function getLayerFieldSchema(layer: LayerParams | null): LayerFieldSchema[] {
    if (!layer) {
        return [];
    }

    if (layer.type === LayerType.LINEAR) {
        return [
            { field: "out_features", label: "Out features", kind: "number" },
            { field: "bias", label: "Bias", kind: "boolean" },
        ];
    }

    if (layer.type === LayerType.CONV_1D || layer.type === LayerType.CONV_2D || layer.type === LayerType.CONV_3D) {
        return [
            { field: "out_channels", label: "Out channels", kind: "number" },
            { field: "kernel_size", label: "Kernel size", kind: "number" },
            { field: "stride", label: "Stride", kind: "number" },
            { field: "padding", label: "Padding", kind: "number" },
            { field: "bias", label: "Bias", kind: "boolean" },
        ];
    }

    if (
        layer.type === LayerType.MAX_POOL_1D ||
        layer.type === LayerType.MAX_POOL_2D ||
        layer.type === LayerType.MAX_POOL_3D ||
        layer.type === LayerType.AVG_POOL_1D ||
        layer.type === LayerType.AVG_POOL_2D ||
        layer.type === LayerType.AVG_POOL_3D
    ) {
        return [
            { field: "kernel_size", label: "Kernel size", kind: "number" },
            { field: "stride", label: "Stride", kind: "number" },
        ];
    }

    if (layer.type === LayerType.DROPOUT) {
        return [{ field: "p", label: "Dropout p", kind: "number" }];
    }

    return [];
}

function readRecordValue(record: Record<string, unknown>, field: string) {
    return record[field];
}

export default function ModelScreen({ experimentId }: { experimentId: string }) {
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [layerPanelOpen, setLayerPanelOpen] = useState(false);

    const model = useExperimentModelStore((state) => state.model);
    const builderGraph = useExperimentModelStore((state) => state.builderGraph);
    const selectedLayerIndex = useExperimentModelStore((state) => state.selectedLayerIndex);
    const trainingForm = useExperimentModelStore((state) => state.trainingForm);
    const loading = useExperimentModelStore((state) => state.loading);
    const saving = useExperimentModelStore((state) => state.saving);
    const training = useExperimentModelStore((state) => state.training);
    const error = useExperimentModelStore((state) => state.error);
    const loadModel = useExperimentModelStore((state) => state.loadModel);
    const setTrainingField = useExperimentModelStore((state) => state.setTrainingField);
    const setSelectedLayerIndex = useExperimentModelStore((state) => state.setSelectedLayerIndex);
    const setSimulationTimesteps = useExperimentModelStore((state) => state.setSimulationTimesteps);
    const setEncoderType = useExperimentModelStore((state) => state.setEncoderType);
    const setSurrogateType = useExperimentModelStore((state) => state.setSurrogateType);
    const addLayer = useExperimentModelStore((state) => state.addLayer);
    const removeLayer = useExperimentModelStore((state) => state.removeLayer);
    const moveLayer = useExperimentModelStore((state) => state.moveLayer);
    const updateLayerParam = useExperimentModelStore((state) => state.updateLayerParam);
    const setLayerNeuronType = useExperimentModelStore((state) => state.setLayerNeuronType);
    const updateLayerNeuronParam = useExperimentModelStore((state) => state.updateLayerNeuronParam);
    const saveModel = useExperimentModelStore((state) => state.saveModel);
    const runTraining = useExperimentModelStore((state) => state.runTraining);

    useEffect(() => {
        loadModel(experimentId);
    }, [experimentId, loadModel]);

    const selectedLayer = selectedLayerIndex == null ? null : (builderGraph.layers[selectedLayerIndex] ?? null);
    const selectedLayerRecord = (selectedLayer ?? {}) as unknown as Record<string, unknown>;
    const selectedNeuron =
        selectedLayer && layerSupportsNeuron(selectedLayer.type)
            ? ((selectedLayer as unknown as LayerParams & { neuron?: NeuronParams | null }).neuron ?? null)
            : null;
    const selectedNeuronRecord = (selectedNeuron ?? {}) as unknown as Record<string, unknown>;

    const handleRunTraining = async () => {
        const started = await runTraining(experimentId);

        if (started) {
            router.push(`/experiment/${experimentId}/telemetry`);
        }
    };

    return (
        <section className="relative min-h-[calc(100vh-160px)]">
            <div className="card mx-auto max-w-6xl">
                <SectionHeader
                    eyebrow="Model"
                    title="Visual SNN builder"
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusPill value={model?.modelStatus} />
                            <button className="button-secondary" onClick={() => loadModel(experimentId)}>
                                Refresh
                            </button>
                            <button className="button-primary" disabled={saving} onClick={() => saveModel(experimentId)}>
                                {saving ? "Saving..." : "Save model"}
                            </button>
                            <button className="button-secondary" disabled={training || saving} onClick={handleRunTraining}>
                                {training ? "Queueing..." : "Train model"}
                            </button>
                        </div>
                    }
                />

                {loading && <LoadingState label="Loading model..." />}
                {error && <ErrorBanner>{error}</ErrorBanner>}

                <FieldGrid>
                    <Field label="Input shape" value={model?.inputShape ?? "—"} />
                    <Field label="Output shape" value={model?.outputShape ?? "—"} />
                    <Field label="Task" value={<StatusPill value={model?.taskType} />} />
                    <Field label="Layers" value={builderGraph.layers.length} />
                </FieldGrid>

                <div className="rounded-md border border-white/5 bg-black/10 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="label">Layer palette</p>
                        <p className="text-xs text-white/35">Click to add, drag graph nodes to reorder.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {modelBuilderLayerPalette.map((layerType) => (
                            <button key={layerType} className="button-secondary" onClick={() => addLayer(layerType)}>
                                + {layerType}
                            </button>
                        ))}
                    </div>
                </div>

                <ModelGraphViewer
                    modelIr={builderGraph}
                    inputShape={model?.inputShape}
                    outputShape={model?.outputShape}
                    selectedLayerIndex={selectedLayerIndex}
                    onSelectLayer={(index) => {
                        setSelectedLayerIndex(index);
                        setLayerPanelOpen(true);
                    }}
                    draggable
                    onMoveLayer={moveLayer}
                    emptyLabel="Add layers from the palette to build the SNN."
                />
            </div>

            <button className="button-primary fixed right-6 bottom-6 z-30 shadow-lg" onClick={() => setSettingsOpen(true)}>
                ⚙ Model config
            </button>

            {settingsOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/50 p-4 backdrop-blur-sm md:p-6">
                    <div className="flex max-h-[80vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-surface-secondary p-4 shadow-2xl">
                        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                            <div>
                                <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">Model config</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Simulation and training</h2>
                            </div>
                            <button className="button-secondary" onClick={() => setSettingsOpen(false)}>
                                Close
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <ConfigInput
                                label="Timesteps"
                                kind="number"
                                value={builderGraph.simulation.timesteps}
                                onChange={(value) => setSimulationTimesteps(Number(value))}
                            />
                            <SelectInput
                                label="Encoder"
                                value={builderGraph.encoder.type}
                                options={Object.values(EncoderType)}
                                onChange={(value) => setEncoderType(value as EncoderType)}
                            />
                            <SelectInput
                                label="Surrogate"
                                value={builderGraph.surrogate.type}
                                options={Object.values(SurrogateType)}
                                onChange={(value) => setSurrogateType(value as SurrogateType)}
                            />
                        </div>

                        <div className="rounded-md border border-white/5 bg-black/10 p-3">
                            <p className="label mb-3">Training config</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <SelectInput
                                    label="Optimizer"
                                    value={trainingForm.optimizer}
                                    options={Object.values(OptimizerType)}
                                    onChange={(value) => setTrainingField("optimizer", value as OptimizerType)}
                                />
                                <SelectInput
                                    label="Loss"
                                    value={trainingForm.lossFunction}
                                    options={Object.values(LossFunctionType)}
                                    onChange={(value) => setTrainingField("lossFunction", value as LossFunctionType)}
                                />
                                <ConfigInput
                                    label="Learning rate"
                                    kind="number"
                                    value={trainingForm.learningRate}
                                    onChange={(value) => setTrainingField("learningRate", Number(value))}
                                />
                                <ConfigInput
                                    label="Epochs"
                                    kind="number"
                                    value={trainingForm.epochs}
                                    onChange={(value) => setTrainingField("epochs", Number(value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {layerPanelOpen && selectedLayerIndex != null && selectedLayer && (
                <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-[1px]">
                    <aside className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-surface-secondary p-4 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                            <div>
                                <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">Layer config</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">{selectedLayer.type}</h2>
                            </div>
                            <button className="button-secondary" onClick={() => setLayerPanelOpen(false)}>
                                Close
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/10 p-3">
                                <div>
                                    <p className="label">Graph node</p>
                                    <p className="mt-1 font-mono text-sm text-white">Layer #{selectedLayerIndex + 1}</p>
                                </div>
                                <button
                                    className="button-secondary"
                                    onClick={() => {
                                        removeLayer(selectedLayerIndex);
                                        setLayerPanelOpen(false);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>

                            {getLayerFieldSchema(selectedLayer).map((field) => (
                                <ConfigInput
                                    key={field.field}
                                    label={field.label}
                                    kind={field.kind}
                                    value={readRecordValue(selectedLayerRecord, field.field)}
                                    onChange={(value) => updateLayerParam(selectedLayerIndex, field.field, value)}
                                />
                            ))}

                            {layerSupportsNeuron(selectedLayer.type) && (
                                <div className="flex flex-col gap-3 rounded-md border border-white/5 bg-black/10 p-3">
                                    <SelectInput
                                        label="Neuron type"
                                        value={selectedNeuron?.type ?? NeuronType.LIF}
                                        options={modelBuilderNeuronTypes}
                                        onChange={(value) => setLayerNeuronType(selectedLayerIndex, value as NeuronType)}
                                    />

                                    {neuronFieldSchema.map((field) => (
                                        <ConfigInput
                                            key={field.field}
                                            label={field.label}
                                            kind={field.kind}
                                            value={readRecordValue(selectedNeuronRecord, field.field)}
                                            onChange={(value) => updateLayerNeuronParam(selectedLayerIndex, field.field, value)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </section>
    );
}

function ConfigInput({
    label,
    kind,
    value,
    onChange,
}: {
    label: string;
    kind: "number" | "boolean";
    value: unknown;
    onChange: (value: number | boolean) => void;
}) {
    if (kind === "boolean") {
        return (
            <label className="flex items-center justify-between gap-3 text-sm text-white/70">
                {label}
                <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
            </label>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="label">{label}</label>
            <input
                className="input"
                type="number"
                value={typeof value === "number" ? value : 0}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    );
}

function SelectInput({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="label">{label}</label>
            <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}
