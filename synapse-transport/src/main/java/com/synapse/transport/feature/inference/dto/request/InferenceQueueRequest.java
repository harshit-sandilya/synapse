package com.synapse.transport.feature.inference.dto.request;

import java.util.UUID;

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
public class InferenceQueueRequest {
    @NotNull(message = "Experiment Id cannot be null")
    private UUID experimentId;

    @NotNull(message = "Sample number cannot be null")
    @Positive(message = "Sample number must be positive")
    private Integer sampleNumber;
}
