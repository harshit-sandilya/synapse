import { proxyTransportGet } from "../../../_helpers/transport";

interface ExperimentDatasetRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: ExperimentDatasetRouteContext,
) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/experiment/${id}/dataset`,
    `/api/experiment/${id}/dataset`,
  );
}
