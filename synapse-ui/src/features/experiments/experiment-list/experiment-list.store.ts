import { create } from "zustand";

import {
  ExperimentListData,
  initialExperimentListData,
} from "@/features/experiments/experiment-list/experiment-list.model";
import {
  createExperimentListController,
  ExperimentListActions,
} from "@/features/experiments/experiment-list/experiment-list.controller";

export const useExperimentStore = create<
  ExperimentListData & ExperimentListActions
>()((...a) => ({
  ...initialExperimentListData,
  ...createExperimentListController(...a),
}));
