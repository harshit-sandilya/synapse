import { create } from "zustand";

import {
  ExperimentDatasetData,
  initialExperimentDatasetData,
} from "@/features/experiments/experiment-dataset/experiment-dataset.model";
import {
  createExperimentDatasetController,
  ExperimentDatasetActions,
} from "@/features/experiments/experiment-dataset/experiment-dataset.controller";

export const useExperimentDatasetStore = create<
  ExperimentDatasetData & ExperimentDatasetActions
>()((...a) => ({
  ...initialExperimentDatasetData,
  ...createExperimentDatasetController(...a),
}));
