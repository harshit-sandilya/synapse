package com.synapse.transport.feature.model.dto.request;

import java.util.UUID;

import tools.jackson.databind.JsonNode;
import com.synapse.transport.common.enums.LossFunctionType;
import com.synapse.transport.common.enums.OptimizerType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveModelConfigRequest {
    @NotNull(message = "Experiment Id cannot be null")
    private UUID experimentId;

    @NotNull(message = "Model IR cannot be null")
    private JsonNode modelIr;

    @NotNull(message = "Optimizer is required")
    private OptimizerType optimizer;

    @NotNull(message = "Loss function is required")
    private LossFunctionType lossFunction;

    @NotNull(message = "Learning rate is required")
    @Positive(message = "Learning rate must be positive")
    private Double learningRate;

    @NotNull(message = "Epochs are required")
    @Positive(message = "Epochs must be positive")
    private Integer epochs;
}
