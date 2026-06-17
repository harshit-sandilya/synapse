import type { ConfigStatus } from "../../enums/transport.enums";

export interface ValidateDatasetResponse {
  experimentId: string;
  status: ConfigStatus;
}
