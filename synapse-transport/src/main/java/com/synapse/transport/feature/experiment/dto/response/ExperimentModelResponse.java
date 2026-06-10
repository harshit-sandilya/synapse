package com.synapse.transport.feature.experiment.dto.response;

import java.util.UUID;

import tools.jackson.databind.JsonNode;

import com.synapse.transport.common.enums.ExperimentTaskType;
import com.synapse.transport.common.enums.LossFunctionType;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.common.enums.OptimizerType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentModelResponse {
    private UUID experimentId;
    private ExperimentTaskType taskType;

    private ModelStatus modelStatus;
    private JsonNode modelIr;

    private String inputShape;
    private String outputShape;

    private OptimizerType optimizer;
    private LossFunctionType lossFunction;
    private Double learningRate;
    private Integer epochs;

    private String lastTrainingError;
}
