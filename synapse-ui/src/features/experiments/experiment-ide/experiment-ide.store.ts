import { create } from "zustand";

import {
  ExperimentIdeData,
  initialExperimentIdeData,
} from "@/features/experiments/experiment-ide/experiment-ide.model";
import {
  createExperimentIdeController,
  ExperimentIdeActions,
} from "@/features/experiments/experiment-ide/experiment-ide.controller";

export const useExperimentIdeStore = create<
  ExperimentIdeData & ExperimentIdeActions
>()((...a) => ({
  ...initialExperimentIdeData,
  ...createExperimentIdeController(...a),
}));
