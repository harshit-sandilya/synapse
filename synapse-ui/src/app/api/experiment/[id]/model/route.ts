import { proxyTransportGet } from "../../../_helpers/transport";

interface ExperimentModelRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: ExperimentModelRouteContext) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/experiment/${id}/model`,
    `/api/experiment/${id}/model`,
  );
}
