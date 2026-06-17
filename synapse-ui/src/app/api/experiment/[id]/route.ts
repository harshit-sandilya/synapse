import { proxyTransportGet } from "../../_helpers/transport";

interface ExperimentRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: ExperimentRouteContext) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/experiment/${id}`,
    `/api/experiment/${id}`,
  );
}
