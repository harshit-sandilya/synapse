import type { ExperimentMetricsResponse } from "@/types/api/experiment/experiment-metrics.response";
import type { MetricSeries } from "@/types/api/experiment/metric-series.type";
import { ExperimentTaskType } from "@/types/enums/transport.enums";
import type { JsonObject } from "@/types/json.types";

export interface FinalMetricCard {
    label: string;
    value: number;
}

export interface ChartPoint {
    step: number;
    value: number;
}

export interface ChartSeriesView {
    name: string;
    points: ChartPoint[];
}

export interface ExperimentMetricsData {
    metrics: ExperimentMetricsResponse | null;
    finalCards: FinalMetricCard[];
    trainCharts: ChartSeriesView[];
    testCharts: ChartSeriesView[];
    loading: boolean;
    error: string | null;
}

export const initialExperimentMetricsData: ExperimentMetricsData = {
    metrics: null,
    finalCards: [],
    trainCharts: [],
    testCharts: [],
    loading: false,
    error: null,
};

function getNumber(metrics: JsonObject | null, key: string): number | null {
    if (!metrics) {
        return null;
    }

    const value = metrics[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function maybeCard(metrics: JsonObject | null, key: string, label: string): FinalMetricCard | null {
    const value = getNumber(metrics, key);
    return value == null ? null : { label, value };
}

export function buildFinalMetricCards(response: ExperimentMetricsResponse): FinalMetricCard[] {
    if (response.taskType === ExperimentTaskType.CLASSIFICATION) {
        return [
            maybeCard(response.finalMetrics, "accuracy", "Accuracy"),
            maybeCard(response.finalMetrics, "precisionScore", "Precision"),
            maybeCard(response.finalMetrics, "recallScore", "Recall"),
            maybeCard(response.finalMetrics, "f1Score", "F1 Score"),
        ].filter((card): card is FinalMetricCard => card != null);
    }

    if (response.taskType === ExperimentTaskType.REGRESSION) {
        return [
            maybeCard(response.finalMetrics, "mse", "MSE"),
            maybeCard(response.finalMetrics, "rmse", "RMSE"),
            maybeCard(response.finalMetrics, "mae", "MAE"),
            maybeCard(response.finalMetrics, "r2Score", "R² Score"),
        ].filter((card): card is FinalMetricCard => card != null);
    }

    return [];
}

export function buildCharts(series: MetricSeries[]): ChartSeriesView[] {
    return series.map((item) => ({
        name: item.name,
        points: item.values.map((value, index) => ({
            step: index + 1,
            value,
        })),
    }));
}
