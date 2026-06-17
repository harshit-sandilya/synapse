import { proxyTransportGet } from "../../../_helpers/transport";

interface ExperimentMetricsRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: ExperimentMetricsRouteContext,
) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/experiment/${id}/metrics`,
    `/api/experiment/${id}/metrics`,
  );
}
