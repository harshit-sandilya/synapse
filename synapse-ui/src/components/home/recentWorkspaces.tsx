"use client";

import { useWorkspaceStore } from "@/features/workspace/workspace.store";
import RecentWorkspaceCard from "./recentWorkspaceCard";

export default function RecentWorkspaces() {
  const savedWorkspaces = useWorkspaceStore((state) => state.savedWorkspaces);

  return (
    <section className="panel flex max-h-64 flex-col overflow-hidden">
      {/* Fixed Header */}

      <header className="flex items-center justify-between border-b border-white/5 pb-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
          Recent Workspaces
        </h2>

        <span className="text-xs text-white/40">
          {savedWorkspaces.length} Stored
        </span>
      </header>

      {/* Scrollable Content */}

      <div className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {savedWorkspaces.length === 0 && (
          <div className="rounded-md border border-white/5 p-4 text-center text-sm text-white/40">
            No saved workspaces found.
          </div>
        )}

        {savedWorkspaces.map((workspace) => (
          <RecentWorkspaceCard workspace={workspace} key={workspace.id} />
        ))}
      </div>
    </section>
  );
}
