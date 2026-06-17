import type { StateCreator } from "zustand";

import { useWorkspaceStore } from "@/features/workspace/workspace.store";
import type { ExperimentListData } from "@/features/experiments/experiment-list/experiment-list.model";
import { getWorkspaceExperiments } from "@/services/experiment-list.service";

export interface ExperimentListActions {
    loadExperiments: (workspaceId?: string) => Promise<void>;
    openExperiment: (id: string) => string;
    clear: () => void;
}

export const createExperimentListController: StateCreator<
    ExperimentListData & ExperimentListActions,
    [],
    [],
    ExperimentListActions
> = (set, get) => ({
    loadExperiments: async (workspaceId) => {
        const resolvedWorkspaceId = workspaceId ?? useWorkspaceStore.getState().currentWorkspace?.id;

        if (!resolvedWorkspaceId) {
            set({
                experiments: [],
                loading: false,
                error: "Connect a workspace before loading experiments.",
                lastLoadedWorkspaceId: null,
            });
            return;
        }

        const workspaceChanged = get().lastLoadedWorkspaceId !== resolvedWorkspaceId;

        set({
            experiments: workspaceChanged ? [] : get().experiments,
            loading: true,
            error: null,
            lastLoadedWorkspaceId: resolvedWorkspaceId,
        });

        const result = await getWorkspaceExperiments(resolvedWorkspaceId);

        if (result.error || result.data == null) {
            set({
                experiments: [],
                loading: false,
                error: result.error ?? "Failed to load experiments.",
            });
            return;
        }

        set({
            experiments: result.data,
            loading: false,
            error: null,
        });
    },

    openExperiment: (id) => `/experiment/${id}/home`,

    clear: () => {
        set({
            experiments: [],
            loading: false,
            error: null,
            lastLoadedWorkspaceId: null,
        });
    },
});
