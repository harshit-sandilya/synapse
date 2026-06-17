import { getLocalApi } from "@/services/_helpers/api-client";
import type { ExperimentMetricsResponse } from "@/types/api/experiment/experiment-metrics.response";
import type { ServiceResult } from "@/types/service.types";

export function getMetrics(
  experimentId: string,
): Promise<ServiceResult<ExperimentMetricsResponse>> {
  return getLocalApi<ExperimentMetricsResponse>(
    `/api/experiment/${experimentId}/metrics`,
    "Failed to load metrics.",
  );
}
