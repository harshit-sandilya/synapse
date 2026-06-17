import type { StateCreator } from "zustand";

import type { WorkspaceEntry } from "@/features/workspace/workspace.model";
import type {
    ExperimentCreateData,
    ExperimentCreateForm,
} from "@/features/experiments/experiment-create/experiment-create.model";
import { initialExperimentCreateForm } from "@/features/experiments/experiment-create/experiment-create.model";
import { createExperiment } from "@/services/experiment-create.service";
import type { ExperimentHomeResponse } from "@/types/api/experiment/experiment-home.response";

export interface ExperimentCreateActions {
    setField: <K extends keyof ExperimentCreateForm>(field: K, value: ExperimentCreateForm[K]) => void;
    submit: (currentWorkspace: WorkspaceEntry | undefined) => Promise<ExperimentHomeResponse | null>;
    reset: () => void;
}

export const createExperimentCreateController: StateCreator<
    ExperimentCreateData & ExperimentCreateActions,
    [],
    [],
    ExperimentCreateActions
> = (set, get) => ({
    setField: (field, value) => {
        set((state) => ({
            form: {
                ...state.form,
                [field]: value,
            },
            error: null,
        }));
    },

    submit: async (currentWorkspace) => {
        const form = get().form;
        const name = form.name.trim();

        if (!currentWorkspace) {
            set({ error: "Connect a workspace before creating an experiment." });
            return null;
        }

        if (!currentWorkspace.memberId) {
            set({ error: "Reconnect this workspace so the member id can be loaded." });
            return null;
        }

        if (!name) {
            set({ error: "Experiment name is required." });
            return null;
        }

        set({ submitting: true, error: null });

        const result = await createExperiment({
            workspaceId: currentWorkspace.id,
            memberId: currentWorkspace.memberId,
            name,
            description: form.description.trim(),
            taskType: form.taskType,
        });

        if (result.error || result.data == null) {
            set({
                submitting: false,
                error: result.error ?? "Failed to create experiment.",
            });
            return null;
        }

        set({
            form: initialExperimentCreateForm,
            submitting: false,
            error: null,
        });

        return result.data;
    },

    reset: () => {
        set({
            form: initialExperimentCreateForm,
            submitting: false,
            error: null,
        });
    },
});
