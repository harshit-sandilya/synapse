"use client";

import { useEffect, useMemo, useState } from "react";

import ModelGraphViewer from "@/components/experiment/ModelGraphViewer";
import { getTelemetryLayerIndexForModelLayer } from "@/features/experiments/experiment-model/experiment-model.model";
import { useExperimentModelStore } from "@/features/experiments/experiment-model/experiment-model.store";
import { useExperimentTelemetryStore } from "@/features/experiments/experiment-telemetry/experiment-telemetry.store";
import type { PublishedLayerTelemetry, PublishedTelemetry } from "@/types/runtime/telemetry/published-telemetry.type";
import {
    ErrorBanner,
    Field,
    FieldGrid,
    LoadingState,
    SectionHeader,
    StatusPill,
} from "@/components/experiment/ExperimentPrimitives";

export default function TelemetryScreen({ experimentId }: { experimentId: string }) {
    const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);

    const model = useExperimentModelStore((state) => state.model);
    const modelIr = useExperimentModelStore((state) => state.builderGraph);
    const loadModel = useExperimentModelStore((state) => state.loadModel);

    const discovery = useExperimentTelemetryStore((state) => state.discovery);
    const connectionState = useExperimentTelemetryStore((state) => state.connectionState);
    const latest = useExperimentTelemetryStore((state) => state.latest);
    const samples = useExperimentTelemetryStore((state) => state.samples);
    const loading = useExperimentTelemetryStore((state) => state.loading);
    const error = useExperimentTelemetryStore((state) => state.error);
    const loadDiscovery = useExperimentTelemetryStore((state) => state.loadDiscovery);
    const connectLive = useExperimentTelemetryStore((state) => state.connectLive);
    const disconnectLive = useExperimentTelemetryStore((state) => state.disconnectLive);
    const clearSamples = useExperimentTelemetryStore((state) => state.clearSamples);

    useEffect(() => {
        loadModel(experimentId);
        loadDiscovery(experimentId);

        return () => disconnectLive();
    }, [disconnectLive, experimentId, loadDiscovery, loadModel]);

    const canConnect = Boolean(discovery?.publisherServiceUrl && discovery.publisherTopic);

    useEffect(() => {
        if (canConnect && (connectionState === "idle" || connectionState === "waiting")) {
            connectLive(experimentId);
        }
    }, [canConnect, connectLive, connectionState, experimentId]);

    useEffect(() => {
        if (canConnect || connectionState === "connected" || connectionState === "connecting") {
            return;
        }

        const intervalId = window.setInterval(() => {
            loadDiscovery(experimentId);
        }, 2000);

        return () => window.clearInterval(intervalId);
    }, [canConnect, connectionState, experimentId, loadDiscovery]);

    const selectedLayerTelemetry = useMemo(() => {
        if (selectedLayerIndex == null) {
            return [];
        }

        const telemetryLayerIndex = getTelemetryLayerIndexForModelLayer(modelIr.layers, selectedLayerIndex);

        if (telemetryLayerIndex == null) {
            return [];
        }

        return getLayerTelemetryHistory(samples, telemetryLayerIndex);
    }, [modelIr.layers, samples, selectedLayerIndex]);

    const latestSelectedLayer = selectedLayerTelemetry.at(-1) ?? null;

    return (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="card">
                <SectionHeader
                    eyebrow="Telemetry"
                    title="Live model telemetry"
                    action={<StatusPill value={discovery?.status} />}
                />

                {loading && <LoadingState label="Discovering telemetry publisher..." />}
                {error && <ErrorBanner>{error}</ErrorBanner>}

                <FieldGrid>
                    <Field label="Connection" value={<StatusPill value={connectionState} />} />
                    <Field label="Cached steps" value={`${samples.length}/5`} />
                    <Field label="Latest timestep" value={latest?.timestep ?? "—"} />
                    <Field label="Publisher topic" value={discovery?.publisherTopic ?? "—"} />
                </FieldGrid>

                <ModelGraphViewer
                    modelIr={modelIr}
                    inputShape={model?.inputShape}
                    outputShape={model?.outputShape}
                    selectedLayerIndex={selectedLayerIndex}
                    onSelectLayer={setSelectedLayerIndex}
                    telemetrySamples={samples}
                    emptyLabel="No saved model graph found. Save a model before training."
                />
            </div>

            <aside className="card xl:sticky xl:top-4 xl:self-start">
                <SectionHeader eyebrow="Telemetry" title="Layer inspector" />

                <div className="flex flex-wrap gap-3">
                    <button className="button-secondary" onClick={() => loadDiscovery(experimentId)}>
                        Refresh discovery
                    </button>
                    <button
                        className="button-primary"
                        disabled={!canConnect || connectionState === "connected" || connectionState === "connecting"}
                        onClick={() => connectLive(experimentId)}
                    >
                        Connect live
                    </button>
                    <button className="button-secondary" onClick={disconnectLive}>
                        Disconnect
                    </button>
                    <button className="button-secondary" onClick={clearSamples}>
                        Clear
                    </button>
                </div>

                {!canConnect && (
                    <p className="rounded-md border border-white/5 bg-black/10 p-4 text-sm text-white/45">
                        Waiting for the training runtime to publish Redis telemetry. Refresh discovery if training just started.
                    </p>
                )}

                {selectedLayerIndex == null ? (
                    <p className="text-sm text-white/40">Click a graph layer to inspect its last 5 telemetry snapshots.</p>
                ) : latestSelectedLayer ? (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-md border border-white/5 bg-black/10 p-3">
                            <p className="label">Selected layer</p>
                            <p className="mt-1 font-mono text-sm text-white">
                                #{latestSelectedLayer.layer_index} {latestSelectedLayer.layer_name}
                            </p>
                        </div>

                        <FieldGrid>
                            <Field label="Firing rate" value={latestSelectedLayer.firing_rate.toFixed(4)} />
                            <Field label="Sparsity" value={latestSelectedLayer.sparsity.toFixed(4)} />
                            <Field label="Mean membrane" value={latestSelectedLayer.mean_membrane.toFixed(4)} />
                            <Field label="Membrane std" value={latestSelectedLayer.membrane_std.toFixed(4)} />
                            <Field label="Dead neurons" value={latestSelectedLayer.dead_neuron_ratio.toFixed(4)} />
                            <Field label="Saturated" value={latestSelectedLayer.saturated_neuron_ratio.toFixed(4)} />
                            <Field label="Threshold" value={latestSelectedLayer.threshold.toFixed(4)} />
                            <Field label="Tau" value={latestSelectedLayer.tau?.toFixed(4) ?? "—"} />
                        </FieldGrid>

                        <div className="rounded-md border border-white/5 bg-black/10 p-3">
                            <p className="label mb-3">Last {selectedLayerTelemetry.length} steps</p>
                            <div className="flex flex-col gap-2">
                                {selectedLayerTelemetry.map((layer) => (
                                    <div
                                        key={`${layer.layer_index}-${layer.layer_name}-${layer.firing_rate}-${layer.sparsity}`}
                                        className="flex items-center justify-between gap-3 rounded border border-white/5 px-3 py-2 font-mono text-xs text-white/50"
                                    >
                                        <span>rate {layer.firing_rate.toFixed(3)}</span>
                                        <span>sparse {layer.sparsity.toFixed(3)}</span>
                                        <span>dead {layer.dead_neuron_ratio.toFixed(3)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-white/40">
                        No telemetry has arrived for this layer yet. Only layers with configured neurons emit runtime telemetry.
                    </p>
                )}
            </aside>
        </section>
    );
}

function getLayerTelemetryHistory(samples: PublishedTelemetry[], layerIndex: number): PublishedLayerTelemetry[] {
    return samples
        .map((sample) => sample.layers.find((layer) => layer.layer_index === layerIndex) ?? null)
        .filter((layer): layer is PublishedLayerTelemetry => layer != null);
}
