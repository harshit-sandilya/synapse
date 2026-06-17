import { NextResponse } from "next/server";

import { WorkspaceConnectionRequest } from "@/types/api/workspace.api.types";
import { TRANSPORT_COOKIE } from "@/types/constants";

interface WorkspaceConnectBody extends WorkspaceConnectionRequest {
    transportURL?: unknown;
}

interface ApiErrorBody {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
}

const REQUEST_PATH = "/api/workspace/connect";
const TRANSPORT_CONNECT_PATH = "/api/v1/workspace/connect";

function errorResponse(status: number, error: string, message: string): NextResponse<ApiErrorBody> {
    return NextResponse.json(
        {
            timestamp: new Date().toISOString(),
            status,
            error,
            message,
            path: REQUEST_PATH,
        },
        { status },
    );
}

function normalizeTransportUrl(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim().replace(/\/+$/, "");

    if (!trimmed) {
        return null;
    }

    try {
        const parsed = new URL(trimmed);

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
        }

        return parsed.toString().replace(/\/+$/, "");
    } catch {
        return null;
    }
}

async function readPayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText || "TRANSPORT_ERROR",
        message: await response.text(),
        path: response.url,
    } satisfies ApiErrorBody;
}

export async function POST(request: Request) {
    let body: WorkspaceConnectBody;

    try {
        body = (await request.json()) as WorkspaceConnectBody;
    } catch {
        return errorResponse(400, "INVALID_REQUEST", "Request body must be valid JSON.");
    }

    const transportURL = normalizeTransportUrl(body.transportURL);

    if (!transportURL) {
        return errorResponse(400, "INVALID_TRANSPORT_URL", "Transport URL must be a valid http(s) URL.");
    }

    const runtimeRequest: WorkspaceConnectionRequest = {
        workspaceName: body.workspaceName,
        username: body.username,
    };

    try {
        const transportResponse = await fetch(`${transportURL}${TRANSPORT_CONNECT_PATH}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(runtimeRequest),
        });

        const payload = await readPayload(transportResponse);

        const response = NextResponse.json(payload, {
            status: transportResponse.status,
        });

        if (transportResponse.ok) {
            response.cookies.set(TRANSPORT_COOKIE, transportURL, {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
            });
        }

        return response;
    } catch {
        return errorResponse(502, "TRANSPORT_UNREACHABLE", "Failed to reach workspace transport.");
    }
}
