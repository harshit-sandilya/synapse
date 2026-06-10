package com.synapse.transport.feature.experiment.dto.internal;

import com.synapse.transport.common.enums.LossFunctionType;
import com.synapse.transport.common.enums.OptimizerType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelConfigArtifact {
    private OptimizerType optimizer;
    private LossFunctionType lossFunction;

    private Double learningRate;

    private Integer epochs;
}
