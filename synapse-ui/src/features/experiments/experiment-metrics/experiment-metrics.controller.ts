import type { StateCreator } from "zustand";

import {
  buildCharts,
  buildFinalMetricCards,
  ExperimentMetricsData,
} from "@/features/experiments/experiment-metrics/experiment-metrics.model";
import { getMetrics } from "@/services/experiment-metrics.service";

export interface ExperimentMetricsActions {
  loadMetrics: (experimentId: string) => Promise<void>;
}

export const createExperimentMetricsController: StateCreator<
  ExperimentMetricsData & ExperimentMetricsActions,
  [],
  [],
  ExperimentMetricsActions
> = (set) => ({
  loadMetrics: async (experimentId) => {
    set({ loading: true, error: null });

    const result = await getMetrics(experimentId);

    if (result.error || result.data == null) {
      set({
        loading: false,
        error: result.error ?? "Failed to load metrics.",
      });
      return;
    }

    set({
      metrics: result.data,
      finalCards: buildFinalMetricCards(result.data),
      trainCharts: buildCharts(result.data.trainMetrics),
      testCharts: buildCharts(result.data.testMetrics),
      loading: false,
      error: null,
    });
  },
});
