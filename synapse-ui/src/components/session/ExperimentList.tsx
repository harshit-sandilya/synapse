"use client";

import { useEffect } from "react";
import { useExperimentStore } from "@/features/experiments/experiment-list/experiment-list.store";

export default function ExperimentList() {
  const experiments = useExperimentStore((state) => state.experiments);
  const loading = useExperimentStore((state) => state.loading);
  const error = useExperimentStore((state) => state.error);
  const loadExperiments = useExperimentStore((state) => state.loadExperiments);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  return (
    <section className="card flex grow flex-col overflow-hidden">
      {/* Header */}

      <header className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
          Experiments
        </span>

        <span className="text-xs text-white/40">
          {experiments.length} Loaded
        </span>
      </header>

      {/* Content */}

      <div className="mt-3 flex grow flex-col gap-2 overflow-y-auto pr-1">
        {loading && (
          <div className="flex grow items-center justify-center text-sm text-white/40">
            Loading experiments...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-error/20 bg-error/5 p-4 text-sm text-error">
            {error}
          </div>
        )}

        {!loading && !error && experiments.length === 0 && (
          <div className="rounded-md border border-white/5 p-4 text-center text-sm text-white/40">
            No experiments found.
          </div>
        )}

        {!loading &&
          !error &&
          experiments.map((experiment) => (
            <button
              key={experiment.id}
              className="flex cursor-pointer flex-col items-start gap-2 rounded-md border border-white/5 bg-black/10 p-3 text-left transition-all duration-200 hover:border-white/10 hover:bg-white/3"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-mono text-sm">{experiment.name}</span>

                <div
                  className={`
                    h-2 w-2 rounded-full
                    ${
                      experiment.status === "running"
                        ? "bg-success"
                        : experiment.status === "queued"
                          ? "bg-warning"
                          : experiment.status === "failed"
                            ? "bg-error"
                            : "bg-brand-secondary"
                    }
                  `}
                />
              </div>

              <div className="flex w-full items-center justify-between text-xs text-white/40">
                <span className="uppercase">{experiment.status}</span>

                <span>
                  {new Date(experiment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
      </div>
    </section>
  );
}
