import type { ExperimentHomeResponse } from "@/types/api/experiment/experiment-home.response";
import { ConfigStatus, ModelStatus } from "@/types/enums/transport.enums";

export interface ExperimentReadinessView {
  dataset: ExperimentHomeResponse["datasetReady"];
  model: ExperimentHomeResponse["modelReady"];
  inference: ExperimentHomeResponse["inferenceReady"];
  canConfigureModel: boolean;
  canTrain: boolean;
  canRunInference: boolean;
}

export interface ExperimentHomeData {
  home: ExperimentHomeResponse | null;
  readinessView: ExperimentReadinessView | null;
  loading: boolean;
  error: string | null;
}

export const initialExperimentHomeData: ExperimentHomeData = {
  home: null,
  readinessView: null,
  loading: false,
  error: null,
};

export function buildReadinessView(
  home: ExperimentHomeResponse,
): ExperimentReadinessView {
  return {
    dataset: home.datasetReady,
    model: home.modelReady,
    inference: home.inferenceReady,
    canConfigureModel: home.datasetReady === ConfigStatus.READY,
    canTrain:
      home.datasetReady === ConfigStatus.READY &&
      home.modelReady === ModelStatus.CONFIGURED,
    canRunInference: home.modelReady === ModelStatus.DONE,
  };
}
