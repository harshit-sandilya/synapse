"use client";

import { useSessionStore } from "@/features/session/session.store";
import RecentSessionCard from "./recentSessionCard";

export default function RecentSessions() {
  const savedSessions = useSessionStore((state) => state.savedSessions);

  return (
    <section className="panel flex max-h-64 flex-col overflow-hidden">
      {/* Fixed Header */}

      <header className="flex items-center justify-between border-b border-white/5 pb-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
          Recent Sessions
        </h2>

        <span className="text-xs text-white/40">
          {savedSessions.length} Stored
        </span>
      </header>

      {/* Scrollable Content */}

      <div className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {savedSessions.length === 0 && (
          <div className="rounded-md border border-white/5 p-4 text-center text-sm text-white/40">
            No saved sessions found.
          </div>
        )}

        {savedSessions.map((session) => (
          <RecentSessionCard session={session} key={session.id} />
        ))}
      </div>
    </section>
  );
}
