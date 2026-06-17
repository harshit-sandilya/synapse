"use client";

import { useEffect } from "react";

import { LineChartCard } from "@/components/experiment/ExperimentCharts";
import {
    EmptyState,
    ErrorBanner,
    Field,
    FieldGrid,
    LoadingState,
    SectionHeader,
    StatusPill,
} from "@/components/experiment/ExperimentPrimitives";
import { useExperimentMetricsStore } from "@/features/experiments/experiment-metrics/experiment-metrics.store";

export default function MetricsScreen({ experimentId }: { experimentId: string }) {
    const metrics = useExperimentMetricsStore((state) => state.metrics);
    const finalCards = useExperimentMetricsStore((state) => state.finalCards);
    const trainCharts = useExperimentMetricsStore((state) => state.trainCharts);
    const testCharts = useExperimentMetricsStore((state) => state.testCharts);
    const loading = useExperimentMetricsStore((state) => state.loading);
    const error = useExperimentMetricsStore((state) => state.error);
    const loadMetrics = useExperimentMetricsStore((state) => state.loadMetrics);

    useEffect(() => {
        loadMetrics(experimentId);
    }, [experimentId, loadMetrics]);

    return (
        <section>
            <div className="card">
                <SectionHeader
                    eyebrow="Metrics"
                    title="Training and final metrics"
                    action={
                        <button className="button-secondary" onClick={() => loadMetrics(experimentId)}>
                            Refresh
                        </button>
                    }
                />

                {loading && <LoadingState label="Loading metrics..." />}
                {error && <ErrorBanner>{error}</ErrorBanner>}

                {metrics && (
                    <div className="flex flex-col gap-6">
                        <FieldGrid>
                            <Field label="Experiment ID" value={metrics.experimentId} />
                            <Field label="Task type" value={<StatusPill value={metrics.taskType} />} />
                        </FieldGrid>

                        <div>
                            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
                                Final metrics
                            </h2>
                            {finalCards.length === 0 ? (
                                <EmptyState>No recognized final metrics yet.</EmptyState>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
                                    {finalCards.map((card) => (
                                        <div key={card.label} className="rounded-md border border-white/5 bg-black/10 p-4">
                                            <p className="label">{card.label}</p>
                                            <p className="mt-2 font-mono text-2xl text-white">{card.value.toFixed(4)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <MetricSeriesList title="Train series" series={trainCharts} />
                            <MetricSeriesList title="Test series" series={testCharts} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function MetricSeriesList({
    title,
    series,
}: {
    title: string;
    series: { name: string; points: { step: number; value: number }[] }[];
}) {
    return (
        <div className="rounded-md border border-white/5 bg-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">{title}</h3>
                <p className="text-xs text-white/40">{series.length} series</p>
            </div>

            {series.length === 0 ? (
                <p className="mt-3 text-sm text-white/40">No series available.</p>
            ) : (
                <div className="mt-3 grid gap-3">
                    {series.map((item) => (
                        <LineChartCard
                            key={item.name}
                            title={item.name}
                            subtitle="Metric value over training steps"
                            points={item.points}
                            emptyLabel="This metric has no plottable values yet."
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
