import type { StateCreator } from "zustand";

import type { ExperimentTelemetryData } from "@/features/experiments/experiment-telemetry/experiment-telemetry.model";
import { getTelemetryInfo } from "@/services/experiment-telemetry.service";
import { createTelemetryLiveClient, TelemetryLiveClient } from "@/services/telemetry-live.service";
import { ModelStatus } from "@/types/enums/transport.enums";
import type { PublishedTelemetry } from "@/types/runtime/telemetry/published-telemetry.type";

let liveClient: TelemetryLiveClient | null = null;

export interface ExperimentTelemetryActions {
    loadDiscovery: (experimentId: string) => Promise<void>;
    connectLive: (experimentId: string) => void;
    disconnectLive: () => void;
    handleTelemetry: (event: PublishedTelemetry) => void;
    clearSamples: () => void;
}

export const createExperimentTelemetryController: StateCreator<
    ExperimentTelemetryData & ExperimentTelemetryActions,
    [],
    [],
    ExperimentTelemetryActions
> = (set, get) => ({
    loadDiscovery: async (experimentId) => {
        set({ loading: true, connectionState: "discovering", error: null });

        const result = await getTelemetryInfo(experimentId);

        if (result.error || result.data == null) {
            set({
                loading: false,
                connectionState: "error",
                error: result.error ?? "Failed to load telemetry discovery.",
            });
            return;
        }

        const waiting =
            result.data.status === ModelStatus.QUEUED || !result.data.publisherServiceUrl || !result.data.publisherTopic;

        set({
            discovery: result.data,
            loading: false,
            connectionState: waiting ? "waiting" : "idle",
            error: null,
        });
    },

    connectLive: (experimentId) => {
        liveClient?.disconnect();
        liveClient = createTelemetryLiveClient();

        liveClient.onTelemetry((event) => get().handleTelemetry(event));
        liveClient.onStatus((status) => {
            set((state) => ({
                discovery: state.discovery
                    ? {
                          ...state.discovery,
                          status,
                      }
                    : state.discovery,
                connectionState:
                    status === ModelStatus.DONE || status === ModelStatus.FAILED ? "closed" : state.connectionState,
            }));
        });
        liveClient.onError((message) => {
            set({ connectionState: "error", error: message });
        });

        set({ connectionState: "connecting", error: null });
        liveClient.connect(experimentId);
    },

    disconnectLive: () => {
        liveClient?.disconnect();
        liveClient = null;
        set({ connectionState: "closed" });
    },

    handleTelemetry: (event) => {
        set((state) => ({
            latest: event,
            samples: [...state.samples, event].slice(-state.maxSamples),
            connectionState: "connected",
            error: null,
        }));
    },

    clearSamples: () => {
        set({ latest: null, samples: [] });
    },
});
