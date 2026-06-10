"use client";
import { useSessionStore } from "@/features/session/session.store";
import { useRouter } from "next/navigation";

export default function ConnectionForm() {
  const router = useRouter();

  const sessionForm = useSessionStore((state) => state.sessionForm);
  const handleSessionFormChange = useSessionStore(
    (state) => state.handleSessionFormChange,
  );
  const connectToNewSession = useSessionStore(
    (state) => state.connectToNewSession,
  );

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    connectToNewSession(e);
    router.push("/session");
  };

  return (
    <section className="card">
      <header className="flex flex-col gap-1 font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">
        Runtime Initialization
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="label">Username</label>
          <input
            required
            autoComplete="off"
            name="username"
            type="text"
            value={sessionForm.username}
            onChange={handleSessionFormChange}
            placeholder="harshit"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">Runtime URL</label>
          <input
            required
            autoComplete="off"
            name="runtimeURL"
            type="url"
            value={sessionForm.runtimeURL}
            onChange={handleSessionFormChange}
            placeholder="ws://localhost:8080"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">Runtime Name</label>
          <input
            required
            autoComplete="off"
            name="runtimeName"
            type="text"
            value={sessionForm.runtimeName}
            onChange={handleSessionFormChange}
            placeholder="mnist_lif_v1"
            className="input"
          />
        </div>

        <button type="submit" className="button-primary mt-2 w-full">
          Connect
        </button>
      </form>
    </section>
  );
}
