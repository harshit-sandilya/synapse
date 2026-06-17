import { create } from "zustand";

import {
  ExperimentInferenceData,
  initialExperimentInferenceData,
} from "@/features/experiments/experiment-inference/experiment-inference.model";
import {
  createExperimentInferenceController,
  ExperimentInferenceActions,
} from "@/features/experiments/experiment-inference/experiment-inference.controller";

export const useExperimentInferenceStore = create<
  ExperimentInferenceData & ExperimentInferenceActions
>()((...a) => ({
  ...initialExperimentInferenceData,
  ...createExperimentInferenceController(...a),
}));
