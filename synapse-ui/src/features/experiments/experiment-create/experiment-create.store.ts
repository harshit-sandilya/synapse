import { create } from "zustand";

import {
  ExperimentCreateData,
  initialExperimentCreateData,
} from "@/features/experiments/experiment-create/experiment-create.model";
import {
  createExperimentCreateController,
  ExperimentCreateActions,
} from "@/features/experiments/experiment-create/experiment-create.controller";

export const useExperimentCreateStore = create<
  ExperimentCreateData & ExperimentCreateActions
>()((...a) => ({
  ...initialExperimentCreateData,
  ...createExperimentCreateController(...a),
}));
