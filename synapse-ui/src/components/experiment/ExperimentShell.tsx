"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { experimentSidebarItems, type ExperimentIdeTab } from "@/features/experiments/experiment-ide/experiment-ide.model";
import { useExperimentIdeStore } from "@/features/experiments/experiment-ide/experiment-ide.store";
import { StatusPill } from "@/components/experiment/ExperimentPrimitives";

interface ExperimentShellProps {
    experimentId: string;
    activeTab: ExperimentIdeTab;
    children: ReactNode;
}

export default function ExperimentShell({ experimentId, activeTab, children }: ExperimentShellProps) {
    const homeSnapshot = useExperimentIdeStore((state) => state.homeSnapshot);
    const loadingHome = useExperimentIdeStore((state) => state.loadingHome);
    const error = useExperimentIdeStore((state) => state.error);
    const setExperimentId = useExperimentIdeStore((state) => state.setExperimentId);
    const setActiveTab = useExperimentIdeStore((state) => state.setActiveTab);
    const refreshHome = useExperimentIdeStore((state) => state.refreshHome);

    useEffect(() => {
        setExperimentId(experimentId);
        setActiveTab(activeTab);
        refreshHome(experimentId);
    }, [activeTab, experimentId, refreshHome, setActiveTab, setExperimentId]);

    return (
        <main className="flex min-h-screen w-screen bg-surface-primary text-foreground">
            <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-surface-secondary p-4 md:flex">
                <Link href="/workspace" className="link mb-6 w-fit">
                    ← Workspace
                </Link>

                <div className="mb-6 rounded-md border border-white/5 bg-black/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-primary">Experiment IDE</p>
                    <p className="mt-2 break-all font-mono text-xs text-white/60">{experimentId}</p>
                </div>

                <nav className="flex flex-col gap-2">
                    {experimentSidebarItems.map((item) => {
                        const isActive = item.tab === activeTab;
                        return (
                            <Link
                                key={item.tab}
                                href={`/experiment/${experimentId}/${item.tab}`}
                                className={`rounded-md border px-3 py-2 text-sm transition-all ${
                                    isActive
                                        ? "border-brand-primary/40 bg-brand-primary/10 text-white"
                                        : "border-transparent text-white/50 hover:border-white/10 hover:bg-white/3 hover:text-white"
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col">
                <header className="flex flex-col gap-4 border-b border-white/5 bg-surface-secondary px-4 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
                                {loadingHome ? "Loading experiment" : "Experiment"}
                            </p>
                            <h1 className="mt-1 text-xl font-semibold">{homeSnapshot?.name ?? experimentId}</h1>
                            {homeSnapshot?.description && (
                                <p className="mt-1 max-w-3xl text-sm text-white/50">{homeSnapshot.description}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <StatusPill value={homeSnapshot?.status} />
                            <StatusPill value={homeSnapshot?.taskType} />
                            <button
                                className="button-secondary px-3 py-1 text-xs"
                                disabled={loadingHome}
                                onClick={() => refreshHome(experimentId)}
                            >
                                {loadingHome ? "Refreshing" : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-sm text-error">{error}</p>}

                    <nav className="flex gap-2 overflow-x-auto md:hidden">
                        {experimentSidebarItems.map((item) => (
                            <Link
                                key={item.tab}
                                href={`/experiment/${experimentId}/${item.tab}`}
                                className={`rounded-full border px-3 py-1 text-xs ${
                                    item.tab === activeTab
                                        ? "border-brand-primary/40 bg-brand-primary/10 text-white"
                                        : "border-white/10 text-white/50"
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
            </section>
        </main>
    );
}
