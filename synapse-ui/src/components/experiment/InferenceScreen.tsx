"use client";

import { useEffect, useMemo, useState } from "react";

import { LineChartCard, type NumericChartPoint } from "@/components/experiment/ExperimentCharts";
import ModelGraphViewer from "@/components/experiment/ModelGraphViewer";
import {
    EmptyState,
    ErrorBanner,
    Field,
    FieldGrid,
    LoadingState,
    SectionHeader,
    StatusPill,
} from "@/components/experiment/ExperimentPrimitives";
import { formatInferenceValue } from "@/features/experiments/experiment-inference/experiment-inference.model";
import { useExperimentInferenceStore } from "@/features/experiments/experiment-inference/experiment-inference.store";
import { getTelemetryLayerIndexForModelLayer } from "@/features/experiments/experiment-model/experiment-model.model";
import { useExperimentModelStore } from "@/features/experiments/experiment-model/experiment-model.store";
import type { LayerParams } from "@/types/runtime/model/layer-params.type";
import type { StoredLayerTelemetry } from "@/types/runtime/telemetry/stored-model-telemetry.type";

export default function InferenceScreen({ experimentId }: { experimentId: string }) {
    const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);
    const [selectedNeuronIndex, setSelectedNeuronIndex] = useState(0);

    const model = useExperimentModelStore((state) => state.model);
    const loadModel = useExperimentModelStore((state) => state.loadModel);

    const inference = useExperimentInferenceStore((state) => state.inference);
    const sampleNumber = useExperimentInferenceStore((state) => state.sampleNumber);
    const queueResponse = useExperimentInferenceStore((state) => state.queueResponse);
    const loading = useExperimentInferenceStore((state) => state.loading);
    const running = useExperimentInferenceStore((state) => state.running);
    const error = useExperimentInferenceStore((state) => state.error);
    const loadInference = useExperimentInferenceStore((state) => state.loadInference);
    const setSampleNumber = useExperimentInferenceStore((state) => state.setSampleNumber);
    const queueInference = useExperimentInferenceStore((state) => state.queueInference);

    useEffect(() => {
        loadModel(experimentId);
        loadInference(experimentId);
    }, [experimentId, loadInference, loadModel]);

    const modelIr = inference?.modelIr ?? model?.modelIr ?? null;
    const result = inference?.inferenceResult ?? null;

    const firstInspectableLayerIndex = useMemo(() => {
        if (!modelIr) {
            return null;
        }

        const index = modelIr.layers.findIndex(
            (_, layerIndex) => getTelemetryLayerIndexForModelLayer(modelIr.layers, layerIndex) != null,
        );
        return index >= 0 ? index : null;
    }, [modelIr]);

    const activeLayerIndex = selectedLayerIndex ?? firstInspectableLayerIndex;

    const selectedTelemetryLayerIndex = useMemo(() => {
        if (activeLayerIndex == null || !modelIr) {
            return null;
        }

        return getTelemetryLayerIndexForModelLayer(modelIr.layers, activeLayerIndex);
    }, [activeLayerIndex, modelIr]);

    const selectedLayerTelemetryOrdinal = useMemo(() => {
        if (!modelIr || activeLayerIndex == null) {
            return null;
        }

        return getInferenceTelemetryOrdinalForModelLayer(modelIr.layers, activeLayerIndex);
    }, [activeLayerIndex, modelIr]);

    const selectedLayerTelemetry = useMemo(() => {
        if (!result) {
            return null;
        }

        if (selectedLayerTelemetryOrdinal != null) {
            return result.telemetry.layers[selectedLayerTelemetryOrdinal] ?? null;
        }

        if (selectedTelemetryLayerIndex != null) {
            return result.telemetry.layers.find((layer) => layer.layer_index === selectedTelemetryLayerIndex) ?? null;
        }

        return null;
    }, [result, selectedLayerTelemetryOrdinal, selectedTelemetryLayerIndex]);

    const neuronCount = selectedLayerTelemetry ? getNeuronCount(selectedLayerTelemetry) : 0;
    const maxNeuronIndex = Math.max(0, neuronCount - 1);
    const activeNeuronIndex = Math.min(selectedNeuronIndex, maxNeuronIndex);

    const layerSpikeRateSeries = useMemo(
        () => buildAverageSeries(selectedLayerTelemetry?.spikes ?? []),
        [selectedLayerTelemetry],
    );

    const layerMembraneSeries = useMemo(
        () => buildAverageSeries(selectedLayerTelemetry?.membrane_potentials ?? []),
        [selectedLayerTelemetry],
    );

    const neuronSpikeSeries = useMemo(
        () => buildNeuronSeries(selectedLayerTelemetry?.spikes ?? [], activeNeuronIndex),
        [activeNeuronIndex, selectedLayerTelemetry],
    );

    const neuronMembraneSeries = useMemo(
        () => buildNeuronSeries(selectedLayerTelemetry?.membrane_potentials ?? [], activeNeuronIndex),
        [activeNeuronIndex, selectedLayerTelemetry],
    );

    return (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="card">
                <SectionHeader
                    eyebrow="Inference"
                    title="Single-sample neuron inspection"
                    action={<StatusPill value={inference?.status} />}
                />

                {loading && <LoadingState label="Loading inference state..." />}
                {error && <ErrorBanner>{error}</ErrorBanner>}

                <div className="flex flex-wrap items-end gap-3 rounded-md border border-white/5 bg-black/10 p-4">
                    <div className="flex min-w-52 flex-1 flex-col gap-2">
                        <label className="label">Sample number</label>
                        <input
                            className="input"
                            type="number"
                            min={0}
                            value={sampleNumber}
                            onChange={(event) => setSampleNumber(event.target.value)}
                        />
                    </div>

                    <button className="button-primary" disabled={running} onClick={() => queueInference(experimentId)}>
                        {running ? "Running..." : "Run inference"}
                    </button>
                    <button className="button-secondary" onClick={() => loadInference(experimentId)}>
                        Refresh
                    </button>
                </div>

                {inference && (
                    <FieldGrid>
                        <Field label="Status" value={<StatusPill value={inference.status} />} />
                        <Field label="Sample" value={inference.sampleNumber ?? queueResponse?.sampleNumber ?? "—"} />
                        <Field label="Timesteps" value={result?.telemetry.timestep ?? "—"} />
                        <Field label="Inspected layers" value={result?.telemetry.layers.length ?? 0} />
                        <Field label="Prediction" value={result ? formatInferenceValue(result.prediction) : "—"} />
                        <Field label="Target" value={result ? formatInferenceValue(result.target) : "—"} />
                        <Field label="Last error" value={inference.lastInferenceError ?? "—"} />
                        <Field label="Model IR" value={modelIr ? "Available" : "Pending"} />
                    </FieldGrid>
                )}

                <ModelGraphViewer
                    modelIr={modelIr}
                    inputShape={model?.inputShape}
                    outputShape={model?.outputShape}
                    selectedLayerIndex={activeLayerIndex}
                    onSelectLayer={setSelectedLayerIndex}
                    emptyLabel="No saved model graph found. Save a model before running inference."
                />

                {!result && (
                    <div className="mt-4">
                        <EmptyState>
                            No inference result has been saved yet. Queue an inference run to inspect layer activity and
                            individual neurons.
                        </EmptyState>
                    </div>
                )}
            </div>

            <aside className="card xl:sticky xl:top-4 xl:self-start">
                <SectionHeader eyebrow="Inference" title="Layer + neuron inspector" />

                {activeLayerIndex == null ? (
                    <p className="text-sm text-white/40">Click a graph layer to inspect its saved inference telemetry.</p>
                ) : selectedTelemetryLayerIndex == null ? (
                    <p className="rounded-md border border-white/5 bg-black/10 p-4 text-sm text-white/45">
                        This layer does not emit neuron telemetry. Select a layer with a configured neuron to inspect spikes and
                        membrane potentials.
                    </p>
                ) : !selectedLayerTelemetry ? (
                    <p className="rounded-md border border-white/5 bg-black/10 p-4 text-sm text-white/45">
                        No inference telemetry has been saved for this layer yet. Run inference and refresh once the job
                        completes.
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-md border border-white/5 bg-black/10 p-3">
                            <p className="label">Selected layer</p>
                            <p className="mt-1 font-mono text-sm text-white">
                                #{selectedLayerTelemetry.layer_index} {selectedLayerTelemetry.layer_name}
                            </p>
                        </div>

                        <FieldGrid>
                            <Field label="Threshold" value={selectedLayerTelemetry.threshold.toFixed(4)} />
                            <Field label="Tau" value={selectedLayerTelemetry.tau?.toFixed(4) ?? "—"} />
                            <Field label="Timesteps" value={selectedLayerTelemetry.spikes.length} />
                            <Field label="Neurons" value={neuronCount} />
                        </FieldGrid>

                        <div className="rounded-md border border-white/5 bg-black/10 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
                                        Neuron selection
                                    </p>
                                    <p className="mt-2 text-sm text-white/45">Inspect one neuron across all saved timesteps.</p>
                                </div>
                                <p className="text-xs text-white/40">0 to {maxNeuronIndex}</p>
                            </div>

                            <input
                                className="input mt-3"
                                type="number"
                                min={0}
                                max={maxNeuronIndex}
                                value={activeNeuronIndex}
                                onChange={(event) => setSelectedNeuronIndex(clampIndex(event.target.value, maxNeuronIndex))}
                            />
                        </div>

                        <div className="grid gap-4">
                            <LineChartCard
                                title="Layer spike rate"
                                subtitle="Average spike activity across all neurons per timestep"
                                points={layerSpikeRateSeries}
                                lineClassName="text-brand-primary"
                            />
                            <LineChartCard
                                title="Layer membrane potential"
                                subtitle="Average membrane potential across the layer per timestep"
                                points={layerMembraneSeries}
                                lineClassName="text-warning"
                            />
                            <LineChartCard
                                title={`Neuron ${activeNeuronIndex} spikes`}
                                subtitle="Single neuron spike trace across timesteps"
                                points={neuronSpikeSeries}
                                lineClassName="text-success"
                                valueFormatter={(value) => value.toFixed(0)}
                            />
                            <LineChartCard
                                title={`Neuron ${activeNeuronIndex} membrane`}
                                subtitle="Single neuron membrane potential across timesteps"
                                points={neuronMembraneSeries}
                                lineClassName="text-error"
                            />
                        </div>
                    </div>
                )}
            </aside>
        </section>
    );
}

function getNeuronCount(layer: StoredLayerTelemetry): number {
    const spikeCount = Math.max(...layer.spikes.map((row) => row.length), 0);
    const membraneCount = Math.max(...layer.membrane_potentials.map((row) => row.length), 0);

    return Math.max(spikeCount, membraneCount);
}

function buildAverageSeries(rows: number[][]): NumericChartPoint[] {
    return rows.map((row, index) => ({
        step: index + 1,
        value: average(row),
    }));
}

function buildNeuronSeries(rows: number[][], neuronIndex: number): NumericChartPoint[] {
    return rows.map((row, index) => ({
        step: index + 1,
        value: typeof row[neuronIndex] === "number" ? row[neuronIndex] : 0,
    }));
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampIndex(value: string, max: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.max(0, Math.min(max, Math.floor(parsed)));
}

function getInferenceTelemetryOrdinalForModelLayer(layers: LayerParams[], modelLayerIndex: number): number | null {
    let ordinal = 0;

    for (let index = 0; index < layers.length; index += 1) {
        const telemetryLayerIndex = getTelemetryLayerIndexForModelLayer(layers, index);

        if (telemetryLayerIndex == null) {
            continue;
        }

        if (index === modelLayerIndex) {
            return ordinal;
        }

        ordinal += 1;
    }

    return null;
}
