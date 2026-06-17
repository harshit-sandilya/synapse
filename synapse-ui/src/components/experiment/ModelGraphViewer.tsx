"use client";

import { useState } from "react";

import {
    getTelemetryLayerIndexForModelLayer,
    layerSupportsNeuron,
} from "@/features/experiments/experiment-model/experiment-model.model";
import type { LayerParams } from "@/types/runtime/model/layer-params.type";
import type { ModelIR } from "@/types/runtime/model/model-ir.type";
import type { NeuronParams } from "@/types/runtime/model/neuron-params.type";
import type { PublishedLayerTelemetry, PublishedTelemetry } from "@/types/runtime/telemetry/published-telemetry.type";

interface ModelGraphViewerProps {
    modelIr: ModelIR | null;
    inputShape?: string | null;
    outputShape?: string | null;
    selectedLayerIndex?: number | null;
    onSelectLayer?: (index: number) => void;
    draggable?: boolean;
    onMoveLayer?: (fromIndex: number, toIndex: number) => void;
    telemetrySamples?: PublishedTelemetry[];
    emptyLabel?: string;
}

export default function ModelGraphViewer({
    modelIr,
    inputShape,
    outputShape,
    selectedLayerIndex,
    onSelectLayer,
    draggable = false,
    onMoveLayer,
    telemetrySamples = [],
    emptyLabel = "No layers configured.",
}: ModelGraphViewerProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const latestTelemetry = telemetrySamples.at(-1) ?? null;

    return (
        <div className="flex min-h-155 items-center justify-center rounded-xl border border-white/5 bg-black/10 p-4 md:p-6">
            <div className="flex w-full max-w-3xl flex-col items-center gap-3">
                <GraphEndpoint label="Input" value={inputShape ?? "unvalidated"} />

                {!modelIr || modelIr.layers.length === 0 ? (
                    <div className="rounded-md border border-white/5 p-6 text-center text-sm text-white/40">{emptyLabel}</div>
                ) : (
                    modelIr.layers.map((layer, index) => {
                        const isSelected = selectedLayerIndex === index;
                        const telemetryLayerIndex = getTelemetryLayerIndexForModelLayer(modelIr.layers, index);
                        const layerTelemetry = findLayerTelemetry(latestTelemetry, layer, telemetryLayerIndex);
                        const layerRecord = layer as unknown as Record<string, unknown>;
                        const neuron = layerSupportsNeuron(layer.type)
                            ? ((layerRecord.neuron as NeuronParams | undefined) ?? null)
                            : null;

                        return (
                            <div key={`${layer.type}-${index}`} className="flex w-full flex-col items-center gap-3">
                                <button
                                    draggable={draggable}
                                    onDragStart={() => draggable && setDragIndex(index)}
                                    onDragOver={(event) => draggable && event.preventDefault()}
                                    onDrop={() => {
                                        if (draggable && dragIndex != null && onMoveLayer) {
                                            onMoveLayer(dragIndex, index);
                                        }
                                        setDragIndex(null);
                                    }}
                                    onClick={() => onSelectLayer?.(index)}
                                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                                        isSelected
                                            ? "border-brand-primary/60 bg-brand-primary/10 shadow-[0_0_40px_rgba(0,133,255,0.12)]"
                                            : "border-white/10 bg-surface-secondary hover:border-white/20"
                                    }`}
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="font-mono text-sm text-white">
                                                {index + 1}. {layer.type}
                                            </p>
                                            <p className="mt-1 text-xs text-white/40">
                                                {neuron
                                                    ? `Neuron: ${neuron.type}`
                                                    : layerSupportsNeuron(layer.type)
                                                      ? "Neuron: none"
                                                      : "Tensor operation"}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {layerTelemetry && (
                                                <>
                                                    <TelemetryChip label="rate" value={layerTelemetry.firing_rate} />
                                                    <TelemetryChip label="sparse" value={layerTelemetry.sparsity} />
                                                    <TelemetryChip label="dead" value={layerTelemetry.dead_neuron_ratio} />
                                                </>
                                            )}
                                            {draggable && <span className="font-mono text-xs text-white/30">drag</span>}
                                        </div>
                                    </div>
                                </button>

                                {index < modelIr.layers.length - 1 && <div className="h-6 w-px bg-brand-primary/30" />}
                            </div>
                        );
                    })
                )}

                <GraphEndpoint label="Output" value={outputShape ?? "pending"} />
            </div>
        </div>
    );
}

function GraphEndpoint({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">{label}</p>
            <p className="mt-1 text-xs text-white/50">{value}</p>
        </div>
    );
}

function TelemetryChip({ label, value }: { label: string; value: number }) {
    return (
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-white/50">
            {label}: {value.toFixed(3)}
        </span>
    );
}

function findLayerTelemetry(
    telemetry: PublishedTelemetry | null,
    layer: LayerParams,
    layerIndex: number | null,
): PublishedLayerTelemetry | null {
    if (!telemetry || layerIndex == null) {
        return null;
    }

    return (
        telemetry.layers.find((item) => item.layer_index === layerIndex) ??
        telemetry.layers.find((item) => item.layer_name === layer.type) ??
        null
    );
}
