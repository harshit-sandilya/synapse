"use client";

import { useRouter } from "next/navigation";

import { useExperimentCreateStore } from "@/features/experiments/experiment-create/experiment-create.store";
import { useWorkspaceStore } from "@/features/workspace/workspace.store";
import { ExperimentTaskType } from "@/types/enums/transport.enums";

export default function ExperimentCreatePage() {
    const router = useRouter();
    const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
    const form = useExperimentCreateStore((state) => state.form);
    const submitting = useExperimentCreateStore((state) => state.submitting);
    const error = useExperimentCreateStore((state) => state.error);
    const setField = useExperimentCreateStore((state) => state.setField);
    const submit = useExperimentCreateStore((state) => state.submit);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const created = await submit(currentWorkspace);

        if (created) {
            router.push(`/experiment/${created.experimentId}/home`);
        }
    };

    return (
        <main className="flex min-h-screen w-screen items-center justify-center px-4 py-10">
            <section className="card max-w-2xl">
                <header className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">New Experiment</p>
                        <h1 className="mt-1 text-2xl font-semibold">Create experiment</h1>
                    </div>
                    <button className="button-secondary" onClick={() => router.push("/workspace")}>
                        Back
                    </button>
                </header>

                {!currentWorkspace && (
                    <div className="rounded-md border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
                        Connect a workspace before creating an experiment.
                    </div>
                )}

                {currentWorkspace && (
                    <div className="rounded-md border border-white/5 bg-black/10 p-3 text-sm text-white/60">
                        Creating in <span className="text-white">{currentWorkspace.workspaceName}</span>
                        <span className="ml-2 font-mono text-xs text-white/30">{currentWorkspace.id}</span>
                    </div>
                )}

                {error && <div className="rounded-md border border-error/20 bg-error/5 p-4 text-sm text-error">{error}</div>}

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label className="label">Name</label>
                        <input
                            className="input"
                            required
                            value={form.name}
                            onChange={(event) => setField("name", event.target.value)}
                            placeholder="mnist_lif_baseline"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label">Description</label>
                        <textarea
                            className="input min-h-28"
                            value={form.description}
                            onChange={(event) => setField("description", event.target.value)}
                            placeholder="Short experiment goal"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="label">Task type</label>
                        <select
                            className="input"
                            value={form.taskType}
                            onChange={(event) => setField("taskType", event.target.value as ExperimentTaskType)}
                        >
                            {Object.values(ExperimentTaskType).map((taskType) => (
                                <option key={taskType} value={taskType}>
                                    {taskType}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="button-primary mt-2 w-full" disabled={submitting || !currentWorkspace}>
                        {submitting ? "Creating..." : "Create experiment"}
                    </button>
                </form>
            </section>
        </main>
    );
}
