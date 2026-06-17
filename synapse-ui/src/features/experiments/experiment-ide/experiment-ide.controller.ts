import type { StateCreator } from "zustand";

import type {
  ExperimentIdeData,
  ExperimentIdeTab,
} from "@/features/experiments/experiment-ide/experiment-ide.model";
import { getExperimentHome } from "@/services/experiment-home.service";

export interface ExperimentIdeActions {
  setExperimentId: (experimentId: string) => void;
  setActiveTab: (activeTab: ExperimentIdeTab) => void;
  refreshHome: (experimentId?: string) => Promise<void>;
}

export const createExperimentIdeController: StateCreator<
  ExperimentIdeData & ExperimentIdeActions,
  [],
  [],
  ExperimentIdeActions
> = (set, get) => ({
  setExperimentId: (experimentId) => {
    set({ experimentId });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
  },

  refreshHome: async (experimentId) => {
    const resolvedExperimentId = experimentId ?? get().experimentId;

    if (!resolvedExperimentId) {
      set({ error: "Missing experiment id." });
      return;
    }

    set({ loadingHome: true, error: null, experimentId: resolvedExperimentId });

    const result = await getExperimentHome(resolvedExperimentId);

    if (result.error || result.data == null) {
      set({
        loadingHome: false,
        error: result.error ?? "Failed to load experiment summary.",
      });
      return;
    }

    set({
      homeSnapshot: result.data,
      loadingHome: false,
      error: null,
    });
  },
});
