"use client";

import { useRouter } from "next/navigation";

import { useExperimentStore } from "@/features/experiments/experiment-list/experiment-list.store";
import { useWorkspaceStore } from "@/features/workspace/workspace.store";

export default function RuntimeBar() {
    const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
    const disconnectWorkspace = useWorkspaceStore((state) => state.disconnectWorkspace);
    const clearExperiments = useExperimentStore((state) => state.clear);
    const router = useRouter();

    if (!currentWorkspace) {
        return null;
    }

    const handleDisconnect = async () => {
        await disconnectWorkspace();
        clearExperiments();
        router.push("/");
    };

    return (
        <nav className="flex h-16 w-full flex-row items-center justify-between px-5 py-4">
            <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-success" />
                    <div className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-success opacity-40" />
                </div>

                <div className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-sm text-white">{currentWorkspace.workspaceName}</span>
                    <span className="truncate font-mono text-xs text-white/40">
                        {currentWorkspace.transportURL} · {currentWorkspace.username}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-brand-primary md:block">
                    Connected
                </span>

                <button onClick={handleDisconnect} className="button-secondary">
                    Disconnect
                </button>
            </div>
        </nav>
    );
}
