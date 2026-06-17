import { proxyTransportPost } from "../../_helpers/transport";

export async function POST(request: Request) {
  return proxyTransportPost(request, "/api/v1/model/train", "/api/model/train");
}
