import type { StateCreator } from "zustand";

import type { DatasetForm, ExperimentDatasetData } from "@/features/experiments/experiment-dataset/experiment-dataset.model";
import { datasetFormFromResponse } from "@/features/experiments/experiment-dataset/experiment-dataset.model";
import {
    getDataset,
    saveDatasetConfig,
    validateDataset as validateDatasetService,
} from "@/services/experiment-dataset.service";

function validateDatasetForm(form: DatasetForm): string | null {
    if (!form.datasetName.trim()) {
        return "Dataset name is required.";
    }

    if (form.batchSize <= 0) {
        return "Batch size must be greater than zero.";
    }

    if (form.numWorkers < 0) {
        return "Number of workers cannot be negative.";
    }

    if (form.prefetchFactor <= 0) {
        return "Prefetch factor must be greater than zero.";
    }

    return null;
}

export interface ExperimentDatasetActions {
    loadDataset: (experimentId: string) => Promise<void>;
    setField: <K extends keyof DatasetForm>(field: K, value: DatasetForm[K]) => void;
    saveDataset: (experimentId: string) => Promise<boolean>;
    validateDataset: (experimentId: string) => Promise<boolean>;
}

export const createExperimentDatasetController: StateCreator<
    ExperimentDatasetData & ExperimentDatasetActions,
    [],
    [],
    ExperimentDatasetActions
> = (set, get) => ({
    loadDataset: async (experimentId) => {
        set({ loading: true, error: null });

        const result = await getDataset(experimentId);

        if (result.error || result.data == null) {
            set({
                loading: false,
                error: result.error ?? "Failed to load dataset.",
            });
            return;
        }

        set({
            dataset: result.data,
            form: datasetFormFromResponse(result.data),
            loading: false,
            error: null,
        });
    },

    setField: (field, value) => {
        set((state) => ({
            form: {
                ...state.form,
                [field]: value,
            },
            error: null,
        }));
    },

    saveDataset: async (experimentId) => {
        const form = get().form;
        const validationError = validateDatasetForm(form);

        if (validationError) {
            set({ error: validationError });
            return false;
        }

        set({ saving: true, error: null });

        const result = await saveDatasetConfig({
            experimentId,
            ...form,
            datasetName: form.datasetName.trim(),
        });

        if (result.error || result.data == null) {
            set({
                saving: false,
                error: result.error ?? "Failed to save dataset config.",
            });
            return false;
        }

        set({ saveResponse: result.data, saving: false, error: null });
        await get().loadDataset(experimentId);
        return true;
    },

    validateDataset: async (experimentId) => {
        set({ validating: true, error: null });

        const result = await validateDatasetService({ experimentId });

        if (result.error || result.data == null) {
            set({
                validating: false,
                error: result.error ?? "Failed to validate dataset.",
            });
            return false;
        }

        const validationResponse = result.data;

        set((state) => ({
            validationResponse,
            validating: false,
            error: null,
            dataset: state.dataset
                ? {
                      ...state.dataset,
                      datasetStatus: validationResponse.status,
                  }
                : state.dataset,
        }));

        return true;
    },
});
