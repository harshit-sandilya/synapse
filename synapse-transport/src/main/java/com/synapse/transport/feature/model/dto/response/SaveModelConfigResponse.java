package com.synapse.transport.feature.model.dto.response;

import java.util.UUID;

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
public class SaveModelConfigResponse {
    private UUID experimentId;
    private UUID modelIrArtifactId;
    private UUID trainingConfigArtifactId;
    private OptimizerType optimizer;
    private LossFunctionType lossFunction;
    private Double learningRate;
    private Integer epochs;
}
