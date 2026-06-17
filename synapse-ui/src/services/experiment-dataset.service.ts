import { getLocalApi, postLocalApi } from "@/services/_helpers/api-client";
import type { SaveDatasetConfigRequest } from "@/types/api/dataset/save-dataset-config.request";
import type { SaveDatasetConfigResponse } from "@/types/api/dataset/save-dataset-config.response";
import type { ValidateDatasetRequest } from "@/types/api/dataset/validate-dataset.request";
import type { ValidateDatasetResponse } from "@/types/api/dataset/validate-dataset.response";
import type { ExperimentDatasetResponse } from "@/types/api/experiment/experiment-dataset.response";
import type { ServiceResult } from "@/types/service.types";

export function getDataset(
  experimentId: string,
): Promise<ServiceResult<ExperimentDatasetResponse>> {
  return getLocalApi<ExperimentDatasetResponse>(
    `/api/experiment/${experimentId}/dataset`,
    "Failed to load dataset.",
  );
}

export function saveDatasetConfig(
  request: SaveDatasetConfigRequest,
): Promise<ServiceResult<SaveDatasetConfigResponse>> {
  return postLocalApi<SaveDatasetConfigRequest, SaveDatasetConfigResponse>(
    "/api/dataset/save",
    request,
    "Failed to save dataset config.",
  );
}

export function validateDataset(
  request: ValidateDatasetRequest,
): Promise<ServiceResult<ValidateDatasetResponse>> {
  return postLocalApi<ValidateDatasetRequest, ValidateDatasetResponse>(
    "/api/dataset/validate",
    request,
    "Failed to validate dataset.",
  );
}
