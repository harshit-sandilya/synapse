import type { ExperimentTaskType } from "../../enums/transport.enums";
import type { JsonObject } from "../../json.types";
import type { MetricSeries } from "./metric-series.type";

export interface ExperimentMetricsResponse {
    experimentId: string;
    taskType: ExperimentTaskType;
    finalMetrics: JsonObject | null;
    trainMetrics: MetricSeries[];
    testMetrics: MetricSeries[];
}
