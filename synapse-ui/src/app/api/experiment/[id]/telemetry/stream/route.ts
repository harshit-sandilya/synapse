import { cookies } from "next/headers";
import { createClient } from "redis";

import type { ApiSuccessResponse } from "@/types/api/common/api-success-response.type";
import type { ExperimentTelemetryResponse } from "@/types/api/experiment/experiment-telemetry.response";
import { TRANSPORT_COOKIE } from "@/types/constants";
import type { PublishedTelemetry } from "@/types/runtime/telemetry/published-telemetry.type";

interface TelemetryStreamRouteContext {
    params: Promise<{ id: string }>;
}

const POLL_INTERVAL_MS = 500;
const HEARTBEAT_INTERVAL_MS = 15000;

function sse(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function heartbeat(): string {
    return `: heartbeat ${Date.now()}\n\n`;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTelemetryDiscovery(experimentId: string): Promise<ExperimentTelemetryResponse | null> {
    const cookieStore = await cookies();
    const transportUrl = cookieStore.get(TRANSPORT_COOKIE)?.value?.replace(/\/+$/, "");

    if (!transportUrl) {
        return null;
    }

    const response = await fetch(`${transportUrl}/api/v1/experiment/${experimentId}/telemetry`, {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as ApiSuccessResponse<ExperimentTelemetryResponse>;
    return payload.data;
}

function parseTelemetry(payload: string): PublishedTelemetry | null {
    try {
        const parsed = JSON.parse(payload) as PublishedTelemetry;

        if (typeof parsed.timestep !== "number" || !Array.isArray(parsed.layers)) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

export async function GET(request: Request, { params }: TelemetryStreamRouteContext) {
    const { id } = await params;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            let client: ReturnType<typeof createClient> | null = null;

            try {
                const discovery = await getTelemetryDiscovery(id);

                if (!discovery?.publisherServiceUrl || !discovery.publisherTopic) {
                    controller.enqueue(
                        encoder.encode(
                            sse("stream-error", {
                                experimentId: id,
                                message: "Telemetry publisher is not available yet.",
                            }),
                        ),
                    );
                    controller.close();
                    return;
                }

                client = createClient({ url: discovery.publisherServiceUrl });
                client.on("error", () => {
                    controller.enqueue(
                        encoder.encode(
                            sse("stream-error", {
                                experimentId: id,
                                message: "Telemetry Redis publisher is unavailable.",
                            }),
                        ),
                    );
                });

                await client.connect();
                controller.enqueue(encoder.encode(sse("status", discovery.status)));

                let lastPayload: string | null = null;
                let lastHeartbeat = Date.now();

                while (!request.signal.aborted) {
                    const rawTelemetry = await client.get(discovery.publisherTopic);

                    if (rawTelemetry && rawTelemetry !== lastPayload) {
                        const telemetry = parseTelemetry(rawTelemetry);

                        if (telemetry) {
                            lastPayload = rawTelemetry;
                            controller.enqueue(encoder.encode(sse("telemetry", telemetry)));
                        }
                    }

                    if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
                        lastHeartbeat = Date.now();
                        controller.enqueue(encoder.encode(heartbeat()));
                    }

                    await sleep(POLL_INTERVAL_MS);
                }
            } catch {
                controller.enqueue(
                    encoder.encode(
                        sse("stream-error", {
                            experimentId: id,
                            message: "Live telemetry stream failed.",
                        }),
                    ),
                );
            } finally {
                if (client?.isOpen) {
                    await client.disconnect();
                }

                try {
                    controller.close();
                } catch {
                    // stream already closed by the client
                }
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
