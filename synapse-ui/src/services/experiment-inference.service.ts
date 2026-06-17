import { getLocalApi, postLocalApi } from "@/services/_helpers/api-client";
import type { ExperimentInferenceResponse } from "@/types/api/experiment/experiment-inference.response";
import type { InferenceQueueRequest } from "@/types/api/inference/inference-queue.request";
import type { InferenceQueueResponse } from "@/types/api/inference/inference-queue.response";
import type { ServiceResult } from "@/types/service.types";

export function getInference(
  experimentId: string,
): Promise<ServiceResult<ExperimentInferenceResponse>> {
  return getLocalApi<ExperimentInferenceResponse>(
    `/api/experiment/${experimentId}/inference`,
    "Failed to load inference.",
  );
}

export function queueInference(
  request: InferenceQueueRequest,
): Promise<ServiceResult<InferenceQueueResponse>> {
  return postLocalApi<InferenceQueueRequest, InferenceQueueResponse>(
    "/api/inference/queue",
    request,
    "Failed to queue inference.",
  );
}
