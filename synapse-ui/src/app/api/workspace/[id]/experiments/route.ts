import { proxyTransportGet } from "../../../_helpers/transport";

interface WorkspaceExperimentsRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: WorkspaceExperimentsRouteContext,
) {
  const { id } = await params;

  return proxyTransportGet(
    `/api/v1/workspace/${id}/experiments`,
    `/api/workspace/${id}/experiments`,
  );
}
