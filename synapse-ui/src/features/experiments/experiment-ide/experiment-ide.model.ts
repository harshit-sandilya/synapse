import type { ExperimentHomeResponse } from "@/types/api/experiment/experiment-home.response";

export type ExperimentIdeTab =
  | "home"
  | "dataset"
  | "model"
  | "telemetry"
  | "metrics"
  | "inference";

export interface SidebarItem {
  tab: ExperimentIdeTab;
  label: string;
}

export interface ExperimentIdeData {
  experimentId: string | null;
  activeTab: ExperimentIdeTab;
  homeSnapshot: ExperimentHomeResponse | null;
  loadingHome: boolean;
  error: string | null;
}

export const experimentSidebarItems: SidebarItem[] = [
  { tab: "home", label: "Home" },
  { tab: "dataset", label: "Dataset" },
  { tab: "model", label: "Model" },
  { tab: "telemetry", label: "Telemetry" },
  { tab: "metrics", label: "Metrics" },
  { tab: "inference", label: "Inference" },
];

export const initialExperimentIdeData: ExperimentIdeData = {
  experimentId: null,
  activeTab: "home",
  homeSnapshot: null,
  loadingHome: false,
  error: null,
};
