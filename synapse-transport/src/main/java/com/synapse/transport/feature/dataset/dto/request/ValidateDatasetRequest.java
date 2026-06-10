package com.synapse.transport.feature.dataset.dto.request;

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
public class ValidateDatasetRequest {
    @NotNull(message = "Experiment Id cannot be null")
    private UUID experimentId;
}
