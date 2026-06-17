import type { StateCreator } from "zustand";

import {
  buildReadinessView,
  ExperimentHomeData,
} from "@/features/experiments/experiment-home/experiment-home.model";
import { getExperimentHome } from "@/services/experiment-home.service";

export interface ExperimentHomeActions {
  loadHome: (experimentId: string) => Promise<void>;
}

export const createExperimentHomeController: StateCreator<
  ExperimentHomeData & ExperimentHomeActions,
  [],
  [],
  ExperimentHomeActions
> = (set) => ({
  loadHome: async (experimentId) => {
    set({ loading: true, error: null });

    const result = await getExperimentHome(experimentId);

    if (result.error || result.data == null) {
      set({
        home: null,
        readinessView: null,
        loading: false,
        error: result.error ?? "Failed to load experiment home.",
      });
      return;
    }

    set({
      home: result.data,
      readinessView: buildReadinessView(result.data),
      loading: false,
      error: null,
    });
  },
});
