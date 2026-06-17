"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useExperimentHomeStore } from "@/features/experiments/experiment-home/experiment-home.store";
import {
    ErrorBanner,
    Field,
    FieldGrid,
    LoadingState,
    SectionHeader,
    StatusPill,
} from "@/components/experiment/ExperimentPrimitives";

export default function ExperimentHomeScreen({ experimentId }: { experimentId: string }) {
    const home = useExperimentHomeStore((state) => state.home);
    const readinessView = useExperimentHomeStore((state) => state.readinessView);
    const loading = useExperimentHomeStore((state) => state.loading);
    const error = useExperimentHomeStore((state) => state.error);
    const loadHome = useExperimentHomeStore((state) => state.loadHome);

    useEffect(() => {
        loadHome(experimentId);
    }, [experimentId, loadHome]);

    return (
        <section className="card">
            <SectionHeader eyebrow="Overview" title="Experiment home" />

            {loading && <LoadingState label="Loading experiment home..." />}
            {error && <ErrorBanner>{error}</ErrorBanner>}

            {home && (
                <div className="flex flex-col gap-6">
                    <FieldGrid>
                        <Field label="Experiment ID" value={home.experimentId} />
                        <Field label="Workspace ID" value={home.workspaceId} />
                        <Field label="Created by" value={home.createdBy} />
                        <Field label="Task type" value={<StatusPill value={home.taskType} />} />
                        <Field label="Status" value={<StatusPill value={home.status} />} />
                        <Field label="Updated" value={new Date(home.updatedAt).toLocaleString()} />
                        <Field label="Created" value={new Date(home.createdAt).toLocaleString()} />
                        <Field label="Description" value={home.description || "—"} />
                    </FieldGrid>

                    {readinessView && (
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-md border border-white/5 bg-black/10 p-4">
                                <p className="label">Dataset</p>
                                <div className="mt-3">
                                    <StatusPill value={readinessView.dataset} />
                                </div>
                                <Link className="link mt-4" href={`/experiment/${experimentId}/dataset`}>
                                    Configure dataset
                                </Link>
                            </div>
                            <div className="rounded-md border border-white/5 bg-black/10 p-4">
                                <p className="label">Model</p>
                                <div className="mt-3">
                                    <StatusPill value={readinessView.model} />
                                </div>
                                <p className="mt-3 text-xs text-white/40">
                                    {readinessView.canConfigureModel
                                        ? "Dataset is ready. Model config is unlocked."
                                        : "Validate dataset before training-ready model config."}
                                </p>
                                <Link className="link mt-4" href={`/experiment/${experimentId}/model`}>
                                    Open model
                                </Link>
                            </div>
                            <div className="rounded-md border border-white/5 bg-black/10 p-4">
                                <p className="label">Inference</p>
                                <div className="mt-3">
                                    <StatusPill value={readinessView.inference} />
                                </div>
                                <p className="mt-3 text-xs text-white/40">
                                    {readinessView.canRunInference
                                        ? "Trained model is available for inference."
                                        : "Run training before inference."}
                                </p>
                                <Link className="link mt-4" href={`/experiment/${experimentId}/inference`}>
                                    Open inference
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
