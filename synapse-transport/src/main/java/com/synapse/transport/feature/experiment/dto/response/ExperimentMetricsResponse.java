package com.synapse.transport.feature.experiment.dto.response;

import java.util.List;
import java.util.UUID;

import com.synapse.transport.common.enums.ExperimentTaskType;
import com.synapse.transport.feature.experiment.dto.internal.MetricSeries;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentMetricsResponse {
    private UUID experimentId;

    private ExperimentTaskType taskType;
    private Object finalMetrics;

    private List<MetricSeries> trainMetrics;
    private List<MetricSeries> testMetrics;
}