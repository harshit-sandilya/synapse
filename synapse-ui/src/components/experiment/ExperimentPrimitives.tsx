import type { ReactNode } from "react";

interface StatusPillProps {
    value: string | null | undefined;
}

export function StatusPill({ value }: StatusPillProps) {
    const normalized = value ?? "UNKNOWN";
    const colorClass =
        normalized === "READY" || normalized === "DONE" || normalized === "COMPLETED" || normalized === "CONFIGURED"
            ? "border-success/30 bg-success/10 text-success"
            : normalized === "FAILED"
              ? "border-error/30 bg-error/10 text-error"
              : normalized === "RUNNING" ||
                  normalized === "TRAINING" ||
                  normalized === "VALIDATING" ||
                  normalized === "QUEUED" ||
                  normalized === "PENDING"
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-brand-primary/30 bg-brand-primary/10 text-brand-secondary";

    return (
        <span
            className={`inline-flex rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${colorClass}`}
        >
            {normalized}
        </span>
    );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
    return <div className="rounded-md border border-error/20 bg-error/5 p-4 text-sm text-error">{children}</div>;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
    return <div className="text-sm text-white/40">{label}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
    return <div className="rounded-md border border-white/5 p-4 text-center text-sm text-white/40">{children}</div>;
}

export function FieldGrid({ children }: { children: ReactNode }) {
    return <dl className="grid gap-3 md:grid-cols-2">{children}</dl>;
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-md border border-white/5 bg-black/10 p-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</dt>
            <dd className="mt-1 wrap-break-word text-sm text-white/85">{value}</dd>
        </div>
    );
}

export function JsonBlock({ value }: { value: unknown }) {
    return (
        <pre className="max-h-96 overflow-auto rounded-md border border-white/5 bg-black/20 p-3 text-xs text-white/70">
            {JSON.stringify(value, null, 2)}
        </pre>
    );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
    return (
        <header className="flex flex-col gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-primary">{eyebrow}</p>
                <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
            </div>
            {action}
        </header>
    );
}
