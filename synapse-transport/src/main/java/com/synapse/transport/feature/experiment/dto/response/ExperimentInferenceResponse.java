package com.synapse.transport.feature.experiment.dto.response;

import java.util.UUID;

import com.synapse.transport.common.enums.InferenceStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tools.jackson.databind.JsonNode;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentInferenceResponse {
    private UUID experimentId;
    private InferenceStatus status;

    private Integer sampleNumber;
    private JsonNode modelIr;
    private JsonNode inferenceResult;

    private String lastInferenceError;
}
