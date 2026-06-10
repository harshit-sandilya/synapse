package com.synapse.transport.feature.dataset.dto.response;

import java.util.UUID;

import com.synapse.transport.common.enums.ConfigStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateDatasetResponse {
    private UUID experimentId;
    private ConfigStatus status;
}
