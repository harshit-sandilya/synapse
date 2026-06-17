import { getLocalApi } from "@/services/_helpers/api-client";
import type { ExperimentHomeResponse } from "@/types/api/experiment/experiment-home.response";
import type { ServiceResult } from "@/types/service.types";

export function getExperimentHome(
  experimentId: string,
): Promise<ServiceResult<ExperimentHomeResponse>> {
  return getLocalApi<ExperimentHomeResponse>(
    `/api/experiment/${experimentId}`,
    "Failed to load experiment home.",
  );
}
