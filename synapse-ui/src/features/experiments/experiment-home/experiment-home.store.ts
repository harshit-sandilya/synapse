import { create } from "zustand";

import {
  ExperimentHomeData,
  initialExperimentHomeData,
} from "@/features/experiments/experiment-home/experiment-home.model";
import {
  createExperimentHomeController,
  ExperimentHomeActions,
} from "@/features/experiments/experiment-home/experiment-home.controller";

export const useExperimentHomeStore = create<
  ExperimentHomeData & ExperimentHomeActions
>()((...a) => ({
  ...initialExperimentHomeData,
  ...createExperimentHomeController(...a),
}));
