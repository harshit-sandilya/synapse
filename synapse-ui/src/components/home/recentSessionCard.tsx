"use client";

import { SessionEntry } from "@/features/session/session.model";
import { useSessionStore } from "@/features/session/session.store";
import { useRouter } from "next/navigation";

export interface RecentSessionCardProps {
  session: SessionEntry;
}

export default function RecentSessionCard({ session }: RecentSessionCardProps) {
  const router = useRouter();

  const connectToSavedSession = useSessionStore(
    (state) => state.connectToSavedSession,
  );

  const handleConnect = () => {
    connectToSavedSession(session.id);
    router.push("/session");
  };

  return (
    <button
      onClick={handleConnect}
      className="cursor-pointer flex flex-col items-start gap-1 rounded-md border border-white/5 bg-black/10 p-3 text-left transition-all duration-200 hover:border-white/10 hover:bg-white/3"
    >
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-sm">{session.runtimeName}</span>
        <div className="h-2 w-2 rounded-full bg-success" />
      </div>

      <span className="font-mono text-xs text-white/50">
        {session.runtimeURL}
      </span>

      <span className="text-xs text-white/40">{session.username}</span>
    </button>
  );
}
