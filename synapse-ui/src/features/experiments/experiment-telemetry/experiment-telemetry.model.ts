import type { ExperimentTelemetryResponse } from "@/types/api/experiment/experiment-telemetry.response";
import type { PublishedTelemetry } from "@/types/runtime/telemetry/published-telemetry.type";

export type TelemetryConnectionState = "idle" | "discovering" | "waiting" | "connecting" | "connected" | "closed" | "error";

export interface ExperimentTelemetryData {
    discovery: ExperimentTelemetryResponse | null;
    connectionState: TelemetryConnectionState;
    latest: PublishedTelemetry | null;
    samples: PublishedTelemetry[];
    maxSamples: number;
    loading: boolean;
    error: string | null;
}

export const initialExperimentTelemetryData: ExperimentTelemetryData = {
    discovery: null,
    connectionState: "idle",
    latest: null,
    samples: [],
    maxSamples: 5,
    loading: false,
    error: null,
};
