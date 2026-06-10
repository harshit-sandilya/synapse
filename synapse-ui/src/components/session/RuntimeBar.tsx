"use client";

import { useSessionStore } from "@/features/session/session.store";
import { useRouter } from "next/navigation";

export default function RuntimeBar() {
  const currentSession = useSessionStore((state) => state.currentSession);
  const disconnectSession = useSessionStore((state) => state.disconnectSession);

  const router = useRouter();

  if (!currentSession) {
    return null;
  }

  const handleDisconnect = () => {
    disconnectSession();
    router.push("/");
  };

  return (
    <nav className="flex h-16 w-full flex-row items-center justify-between px-5 py-4">
      {/* Runtime Info */}

      <div className="flex min-w-0 items-center gap-4">
        {/* Status Indicator */}

        <div className="relative flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-success" />
          <div className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-success opacity-40" />
        </div>

        {/* Runtime Metadata */}

        <div className="flex min-w-0 flex-col">
          <span className="truncate font-mono text-sm text-white">
            {currentSession.runtimeName}
          </span>
          <span className="truncate font-mono text-xs text-white/40">
            {currentSession.runtimeURL}
          </span>
        </div>
      </div>

      {/* Actions */}

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
