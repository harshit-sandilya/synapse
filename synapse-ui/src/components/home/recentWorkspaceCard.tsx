"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { WorkspaceEntry } from "@/features/workspace/workspace.model";
import { useWorkspaceStore } from "@/features/workspace/workspace.store";

export interface RecentWorkspaceCardProps {
    workspace: WorkspaceEntry;
}

export default function RecentWorkspaceCard({ workspace }: RecentWorkspaceCardProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    const connectToSavedWorkspace = useWorkspaceStore((state) => state.connectToSavedWorkspace);

    const handleConnect = async () => {
        setError(null);
        setConnecting(true);
        const connectError = await connectToSavedWorkspace(workspace.id);
        setConnecting(false);

        if (connectError) {
            setError(connectError);
            return;
        }

        router.push("/workspace");
    };

    return (
        <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex cursor-pointer flex-col items-start gap-1 rounded-md border border-white/5 bg-black/10 p-3 text-left transition-all duration-200 hover:border-white/10 hover:bg-white/3 disabled:cursor-not-allowed disabled:opacity-60"
        >
            <div className="flex w-full items-center justify-between">
                <span className="font-mono text-sm">{workspace.workspaceName}</span>
                <div className="h-2 w-2 rounded-full bg-success" />
            </div>

            <span className="font-mono text-xs text-white/50">{workspace.transportURL}</span>

            <span className="text-xs text-white/40">
                {workspace.username} · {connecting ? "connecting" : "saved"}
            </span>

            {error && <span className="text-xs text-error">{error}</span>}
        </button>
    );
}
