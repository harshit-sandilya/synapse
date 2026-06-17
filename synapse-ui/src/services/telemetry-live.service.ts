import type { ModelStatus } from "@/types/enums/transport.enums";
import type { PublishedTelemetry } from "@/types/runtime/telemetry/published-telemetry.type";

export interface TelemetryLiveClient {
    connect: (experimentId: string) => void;
    disconnect: () => void;
    onTelemetry: (handler: (event: PublishedTelemetry) => void) => void;
    onStatus: (handler: (status: ModelStatus) => void) => void;
    onError: (handler: (message: string) => void) => void;
}

export function createTelemetryLiveClient(): TelemetryLiveClient {
    let source: EventSource | null = null;
    let telemetryHandler: ((event: PublishedTelemetry) => void) | null = null;
    let statusHandler: ((status: ModelStatus) => void) | null = null;
    let errorHandler: ((message: string) => void) | null = null;

    return {
        connect: (experimentId: string) => {
            source?.close();
            source = new EventSource(`/api/experiment/${experimentId}/telemetry/stream`);

            source.addEventListener("telemetry", (event) => {
                try {
                    telemetryHandler?.(JSON.parse(event.data) as PublishedTelemetry);
                } catch {
                    errorHandler?.("Invalid telemetry event received.");
                }
            });

            source.addEventListener("status", (event) => {
                statusHandler?.(event.data as ModelStatus);
            });

            source.addEventListener("stream-error", (event) => {
                try {
                    const payload = JSON.parse(event.data) as { message?: string };
                    errorHandler?.(payload.message ?? "Live telemetry stream is unavailable.");
                } catch {
                    errorHandler?.("Live telemetry stream is unavailable.");
                }
            });

            source.onerror = () => {
                errorHandler?.("Live telemetry stream is unavailable.");
            };
        },

        disconnect: () => {
            source?.close();
            source = null;
        },

        onTelemetry: (handler) => {
            telemetryHandler = handler;
        },

        onStatus: (handler) => {
            statusHandler = handler;
        },

        onError: (handler) => {
            errorHandler = handler;
        },
    };
}
