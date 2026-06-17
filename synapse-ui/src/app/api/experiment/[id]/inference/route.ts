import { proxyTransportGet } from "../../../_helpers/transport";

interface ExperimentInferenceRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: ExperimentInferenceRouteContext,
) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/experiment/${id}/inference`,
    `/api/experiment/${id}/inference`,
  );
}
