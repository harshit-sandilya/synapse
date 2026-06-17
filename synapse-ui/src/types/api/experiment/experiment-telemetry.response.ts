import type { ModelStatus } from "../../enums/transport.enums";

export interface ExperimentTelemetryResponse {
  experimentId: string;
  status: ModelStatus;
  publisherServiceUrl: string | null;
  publisherTopic: string | null;
  startedAt: string | null;
  endedAt: string | null;
}
