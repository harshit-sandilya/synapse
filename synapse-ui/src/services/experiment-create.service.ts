import { postLocalApi } from "@/services/_helpers/api-client";
import type { CreateExperimentRequest } from "@/types/api/experiment/create-experiment.request";
import type { ExperimentHomeResponse } from "@/types/api/experiment/experiment-home.response";
import type { ServiceResult } from "@/types/service.types";

export function createExperiment(
  request: CreateExperimentRequest,
): Promise<ServiceResult<ExperimentHomeResponse>> {
  return postLocalApi<CreateExperimentRequest, ExperimentHomeResponse>(
    "/api/experiment/create",
    request,
    "Failed to create experiment.",
  );
}
