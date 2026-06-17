import type { ExperimentSummaryResponse } from "@/types/api/workspace/experiment-summary.response";

export interface ExperimentListData {
  experiments: ExperimentSummaryResponse[];
  loading: boolean;
  error: string | null;
  lastLoadedWorkspaceId: string | null;
}

export const initialExperimentListData: ExperimentListData = {
  experiments: [],
  loading: false,
  error: null,
  lastLoadedWorkspaceId: null,
};
