import { create } from "zustand";

import {
  ExperimentModelData,
  initialExperimentModelData,
} from "@/features/experiments/experiment-model/experiment-model.model";
import {
  createExperimentModelController,
  ExperimentModelActions,
} from "@/features/experiments/experiment-model/experiment-model.controller";

export const useExperimentModelStore = create<
  ExperimentModelData & ExperimentModelActions
>()((...a) => ({
  ...initialExperimentModelData,
  ...createExperimentModelController(...a),
}));
