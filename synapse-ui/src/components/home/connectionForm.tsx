"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useWorkspaceStore } from "@/features/workspace/workspace.store";

export default function ConnectionForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    const workspaceForm = useWorkspaceStore((state) => state.workspaceForm);
    const handleWorkspaceFormChange = useWorkspaceStore((state) => state.handleWorkspaceFormChange);
    const connectToNewWorkspace = useWorkspaceStore((state) => state.connectToNewWorkspace);

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setConnecting(true);

        const connectError = await connectToNewWorkspace();
        setConnecting(false);

        if (connectError) {
            setError(connectError);
            return;
        }

        router.push("/workspace");
    };

    return (
        <section className="card">
            <header className="flex flex-col gap-1 font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
                Workspace Connection
            </header>

            {error && <div className="rounded-md border border-error/20 bg-error/5 p-3 text-sm text-error">{error}</div>}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                    <label className="label">Username</label>
                    <input
                        required
                        autoComplete="off"
                        name="username"
                        type="text"
                        value={workspaceForm.username}
                        onChange={handleWorkspaceFormChange}
                        placeholder="harshit"
                        className="input"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="label">Transport URL</label>
                    <input
                        required
                        autoComplete="off"
                        name="transportURL"
                        type="url"
                        value={workspaceForm.transportURL}
                        onChange={handleWorkspaceFormChange}
                        placeholder="http://localhost:8080"
                        className="input"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="label">Workspace Name</label>
                    <input
                        required
                        autoComplete="off"
                        name="workspaceName"
                        type="text"
                        value={workspaceForm.workspaceName}
                        onChange={handleWorkspaceFormChange}
                        placeholder="mnist_lif_v1"
                        className="input"
                    />
                </div>

                <button type="submit" className="button-primary mt-2 w-full" disabled={connecting}>
                    {connecting ? "Connecting..." : "Connect"}
                </button>
            </form>
        </section>
    );
}
