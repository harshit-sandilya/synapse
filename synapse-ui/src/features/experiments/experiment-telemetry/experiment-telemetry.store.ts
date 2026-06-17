import { create } from "zustand";

import {
  ExperimentTelemetryData,
  initialExperimentTelemetryData,
} from "@/features/experiments/experiment-telemetry/experiment-telemetry.model";
import {
  createExperimentTelemetryController,
  ExperimentTelemetryActions,
} from "@/features/experiments/experiment-telemetry/experiment-telemetry.controller";

export const useExperimentTelemetryStore = create<
  ExperimentTelemetryData & ExperimentTelemetryActions
>()((...a) => ({
  ...initialExperimentTelemetryData,
  ...createExperimentTelemetryController(...a),
}));
