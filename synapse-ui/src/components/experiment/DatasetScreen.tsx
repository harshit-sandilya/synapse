"use client";

import { useEffect } from "react";

import { useExperimentDatasetStore } from "@/features/experiments/experiment-dataset/experiment-dataset.store";
import { DatasetProvider } from "@/types/enums/transport.enums";
import {
    ErrorBanner,
    Field,
    FieldGrid,
    LoadingState,
    SectionHeader,
    StatusPill,
} from "@/components/experiment/ExperimentPrimitives";

export default function DatasetScreen({ experimentId }: { experimentId: string }) {
    const dataset = useExperimentDatasetStore((state) => state.dataset);
    const form = useExperimentDatasetStore((state) => state.form);

    const loading = useExperimentDatasetStore((state) => state.loading);
    const saving = useExperimentDatasetStore((state) => state.saving);
    const validating = useExperimentDatasetStore((state) => state.validating);
    const error = useExperimentDatasetStore((state) => state.error);
    const loadDataset = useExperimentDatasetStore((state) => state.loadDataset);
    const setField = useExperimentDatasetStore((state) => state.setField);
    const saveDataset = useExperimentDatasetStore((state) => state.saveDataset);
    const validateDataset = useExperimentDatasetStore((state) => state.validateDataset);

    useEffect(() => {
        loadDataset(experimentId);
    }, [experimentId, loadDataset]);

    return (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="card">
                <SectionHeader
                    eyebrow="Dataset"
                    title="Configure dataset"
                    action={<StatusPill value={dataset?.datasetStatus} />}
                />

                {loading && <LoadingState label="Loading dataset..." />}
                {error && <ErrorBanner>{error}</ErrorBanner>}

                <form className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label className="label">Provider</label>
                        <select
                            className="input"
                            value={form.provider}
                            onChange={(event) => setField("provider", event.target.value as DatasetProvider)}
                        >
                            {Object.values(DatasetProvider).map((provider) => (
                                <option key={provider} value={provider}>
                                    {provider}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label">Dataset name</label>
                        <input
                            className="input"
                            value={form.datasetName}
                            onChange={(event) => setField("datasetName", event.target.value)}
                            placeholder="MNIST"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label">Batch size</label>
                        <input
                            className="input"
                            type="number"
                            min={1}
                            value={form.batchSize}
                            onChange={(event) => setField("batchSize", Number(event.target.value))}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label">Num workers</label>
                        <input
                            className="input"
                            type="number"
                            min={0}
                            value={form.numWorkers}
                            onChange={(event) => setField("numWorkers", Number(event.target.value))}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label">Prefetch factor</label>
                        <input
                            className="input"
                            type="number"
                            min={1}
                            value={form.prefetchFactor}
                            onChange={(event) => setField("prefetchFactor", Number(event.target.value))}
                        />
                    </div>

                    <div className="grid gap-2 rounded-md border border-white/5 bg-black/10 p-3">
                        {(
                            [
                                ["shuffle", "Shuffle"],
                                ["pinMemory", "Pin memory"],
                                ["dropLast", "Drop last"],
                                ["persistentWorkers", "Persistent workers"],
                            ] as const
                        ).map(([field, label]) => (
                            <label key={field} className="flex items-center justify-between text-sm text-white/70">
                                {label}
                                <input
                                    type="checkbox"
                                    checked={form[field]}
                                    onChange={(event) => setField(field, event.target.checked)}
                                />
                            </label>
                        ))}
                    </div>
                </form>

                <div className="flex flex-wrap gap-3">
                    <button className="button-primary" disabled={saving} onClick={() => saveDataset(experimentId)}>
                        {saving ? "Saving..." : "Save config"}
                    </button>
                    <button
                        className="button-secondary"
                        disabled={validating || saving}
                        onClick={() => validateDataset(experimentId)}
                    >
                        {validating ? "Validating..." : "Validate dataset"}
                    </button>
                    <button className="button-secondary" onClick={() => loadDataset(experimentId)}>
                        Refresh
                    </button>
                </div>
            </div>

            <aside className="card">
                <SectionHeader eyebrow="Dataset API" title="Loaded data" />
                {dataset && (
                    <FieldGrid>
                        <Field label="Status" value={<StatusPill value={dataset.datasetStatus} />} />
                        <Field label="Train samples" value={dataset.trainSampleCount ?? "—"} />
                        <Field label="Test samples" value={dataset.testSampleCount ?? "—"} />
                        <Field label="Input shape" value={dataset.inputShape ?? "—"} />
                        <Field label="Output shape" value={dataset.outputShape ?? "—"} />
                        <Field label="Validation error" value={dataset.lastValidationError ?? "—"} />
                    </FieldGrid>
                )}
                <p className="text-xs text-white/40">
                    Validation is queued in the background. Use refresh or reopen this screen to fetch the latest dataset
                    status.
                </p>
            </aside>
        </section>
    );
}
