import type { StateCreator } from "zustand";

import {
    ExperimentInferenceData,
    isInferenceTerminal,
} from "@/features/experiments/experiment-inference/experiment-inference.model";
import { getInference, queueInference as queueInferenceService } from "@/services/experiment-inference.service";

const INFERENCE_REFRESH_DELAY_MS = 1500;
const INFERENCE_REFRESH_ATTEMPTS = 20;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseSampleNumber(value: string): number | null {
    const sampleNumber = Number(value);
    return Number.isInteger(sampleNumber) && sampleNumber >= 0 ? sampleNumber : null;
}

export interface ExperimentInferenceActions {
    loadInference: (experimentId: string) => Promise<void>;
    setSampleNumber: (value: string) => void;
    queueInference: (experimentId: string) => Promise<boolean>;
    refreshUntilInferenceTerminal: (experimentId: string) => Promise<void>;
}

export const createExperimentInferenceController: StateCreator<
    ExperimentInferenceData & ExperimentInferenceActions,
    [],
    [],
    ExperimentInferenceActions
> = (set, get) => ({
    loadInference: async (experimentId) => {
        set({ loading: true, error: null });

        const result = await getInference(experimentId);

        if (result.error || result.data == null) {
            set({
                loading: false,
                error: result.error ?? "Failed to load inference.",
            });
            return;
        }

        const inference = result.data;

        set((state) => ({
            inference,
            sampleNumber: inference.sampleNumber == null ? state.sampleNumber : String(inference.sampleNumber),
            loading: false,
            error: null,
        }));
    },

    setSampleNumber: (value) => {
        set({ sampleNumber: value, error: null });
    },

    queueInference: async (experimentId) => {
        const sampleNumber = parseSampleNumber(get().sampleNumber);

        if (sampleNumber == null) {
            set({ error: "Sample number must be an integer greater than or equal to zero." });
            return false;
        }

        set({ running: true, error: null });

        const result = await queueInferenceService({ experimentId, sampleNumber });

        if (result.error || result.data == null) {
            set({
                running: false,
                error: result.error ?? "Failed to queue inference.",
            });
            return false;
        }

        const queueResponse = result.data;

        set((state) => ({
            queueResponse,
            running: false,
            error: null,
            inference: state.inference
                ? {
                      ...state.inference,
                      status: queueResponse.status,
                      sampleNumber: queueResponse.sampleNumber,
                  }
                : state.inference,
        }));

        if (!isInferenceTerminal(queueResponse.status)) {
            await get().refreshUntilInferenceTerminal(experimentId);
        }

        return true;
    },

    refreshUntilInferenceTerminal: async (experimentId) => {
        set({ running: true, error: null });

        for (let attempt = 0; attempt < INFERENCE_REFRESH_ATTEMPTS; attempt += 1) {
            await sleep(INFERENCE_REFRESH_DELAY_MS);
            const result = await getInference(experimentId);

            if (result.error || result.data == null) {
                set({
                    running: false,
                    error: result.error ?? "Failed to refresh inference status.",
                });
                return;
            }

            set({ inference: result.data, error: null });

            if (isInferenceTerminal(result.data.status)) {
                set({ running: false });
                return;
            }
        }

        set({ running: false });
    },
});
