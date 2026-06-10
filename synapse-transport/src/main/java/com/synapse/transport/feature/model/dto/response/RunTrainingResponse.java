package com.synapse.transport.feature.model.dto.response;

import java.util.UUID;

import com.synapse.transport.common.enums.ModelStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunTrainingResponse {
    private UUID experimentId;
    private ModelStatus status;
}
