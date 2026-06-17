import { getLocalApi } from "@/services/_helpers/api-client";
import type { ExperimentSummaryResponse } from "@/types/api/workspace/experiment-summary.response";
import type { ServiceResult } from "@/types/service.types";

export function getWorkspaceExperiments(
  workspaceId: string,
): Promise<ServiceResult<ExperimentSummaryResponse[]>> {
  return getLocalApi<ExperimentSummaryResponse[]>(
    `/api/workspace/${workspaceId}/experiments`,
    "Failed to load experiments.",
  );
}
