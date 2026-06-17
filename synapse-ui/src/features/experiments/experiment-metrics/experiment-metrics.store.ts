import { create } from "zustand";

import {
  ExperimentMetricsData,
  initialExperimentMetricsData,
} from "@/features/experiments/experiment-metrics/experiment-metrics.model";
import {
  createExperimentMetricsController,
  ExperimentMetricsActions,
} from "@/features/experiments/experiment-metrics/experiment-metrics.controller";

export const useExperimentMetricsStore = create<
  ExperimentMetricsData & ExperimentMetricsActions
>()((...a) => ({
  ...initialExperimentMetricsData,
  ...createExperimentMetricsController(...a),
}));
