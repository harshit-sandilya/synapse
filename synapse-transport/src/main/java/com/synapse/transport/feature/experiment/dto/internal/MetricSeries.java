package com.synapse.transport.feature.experiment.dto.internal;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricSeries {
    private String name;
    private List<Double> values;
}
