import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TRANSPORT_COOKIE } from "@/types/constants";

interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

function errorResponse(
  status: number,
  error: string,
  message: string,
  path: string,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      status,
      error,
      message,
      path,
    },
    { status },
  );
}

async function getTransportUrl(path: string): Promise<string | NextResponse<ApiErrorBody>> {
  const cookieStore = await cookies();
  const transportUrl = cookieStore.get(TRANSPORT_COOKIE)?.value;

  if (!transportUrl) {
    return errorResponse(
      401,
      "TRANSPORT_NOT_CONNECTED",
      "Workspace transport is not connected.",
      path,
    );
  }

  return transportUrl.replace(/\/+$/, "");
}

async function readTransportPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      timestamp: new Date().toISOString(),
      status: response.status,
      error: response.statusText || "TRANSPORT_ERROR",
      message: await response.text(),
      path: response.url,
    } satisfies ApiErrorBody;
  }

  return response.json();
}

export async function proxyTransportGet(
  transportPath: string,
  requestPath: string,
): Promise<NextResponse> {
  try {
    const transportUrl = await getTransportUrl(requestPath);

    if (transportUrl instanceof NextResponse) {
      return transportUrl;
    }

    const transportResponse = await fetch(`${transportUrl}${transportPath}`, {
      headers: {
        Accept: "application/json",
      },
    });

    const payload = await readTransportPayload(transportResponse);

    return NextResponse.json(payload, {
      status: transportResponse.status,
    });
  } catch {
    return errorResponse(
      502,
      "TRANSPORT_UNREACHABLE",
      "Failed to reach workspace transport.",
      requestPath,
    );
  }
}

export async function proxyTransportPost(
  request: Request,
  transportPath: string,
  requestPath: string,
): Promise<NextResponse> {
  try {
    const transportUrl = await getTransportUrl(requestPath);

    if (transportUrl instanceof NextResponse) {
      return transportUrl;
    }

    const body = await request.json();
    const transportResponse = await fetch(`${transportUrl}${transportPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await readTransportPayload(transportResponse);

    return NextResponse.json(payload, {
      status: transportResponse.status,
    });
  } catch {
    return errorResponse(
      502,
      "TRANSPORT_UNREACHABLE",
      "Failed to reach workspace transport.",
      requestPath,
    );
  }
}
