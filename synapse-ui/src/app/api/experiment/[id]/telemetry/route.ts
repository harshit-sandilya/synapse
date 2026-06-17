import { proxyTransportGet } from "../../../_helpers/transport";

interface ExperimentTelemetryRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: ExperimentTelemetryRouteContext,
) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/experiment/${id}/telemetry`,
    `/api/experiment/${id}/telemetry`,
  );
}
