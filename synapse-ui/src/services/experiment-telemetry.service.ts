import { getLocalApi } from "@/services/_helpers/api-client";
import type { ExperimentTelemetryResponse } from "@/types/api/experiment/experiment-telemetry.response";
import type { ServiceResult } from "@/types/service.types";

export function getTelemetryInfo(
  experimentId: string,
): Promise<ServiceResult<ExperimentTelemetryResponse>> {
  return getLocalApi<ExperimentTelemetryResponse>(
    `/api/experiment/${experimentId}/telemetry`,
    "Failed to load telemetry discovery.",
  );
}
