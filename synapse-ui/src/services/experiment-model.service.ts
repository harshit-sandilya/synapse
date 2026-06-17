import { getLocalApi, postLocalApi } from "@/services/_helpers/api-client";
import type { ExperimentModelResponse } from "@/types/api/experiment/experiment-model.response";
import type { RunTrainingRequest } from "@/types/api/model/run-training.request";
import type { RunTrainingResponse } from "@/types/api/model/run-training.response";
import type { SaveModelConfigRequest } from "@/types/api/model/save-model-config.request";
import type { SaveModelConfigResponse } from "@/types/api/model/save-model-config.response";
import type { ServiceResult } from "@/types/service.types";

export function getModel(
  experimentId: string,
): Promise<ServiceResult<ExperimentModelResponse>> {
  return getLocalApi<ExperimentModelResponse>(
    `/api/experiment/${experimentId}/model`,
    "Failed to load model.",
  );
}

export function saveModelConfig(
  request: SaveModelConfigRequest,
): Promise<ServiceResult<SaveModelConfigResponse>> {
  return postLocalApi<SaveModelConfigRequest, SaveModelConfigResponse>(
    "/api/model/save",
    request,
    "Failed to save model config.",
  );
}

export function runTraining(
  request: RunTrainingRequest,
): Promise<ServiceResult<RunTrainingResponse>> {
  return postLocalApi<RunTrainingRequest, RunTrainingResponse>(
    "/api/model/train",
    request,
    "Failed to run training.",
  );
}
