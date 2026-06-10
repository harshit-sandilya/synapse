package com.synapse.transport.feature.model.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunTrainingRequest {
    @NotNull(message = "Experiment Id cannot be null")
    private UUID experimentId;
}
