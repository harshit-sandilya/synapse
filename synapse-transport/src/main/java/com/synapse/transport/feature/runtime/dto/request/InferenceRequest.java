package com.synapse.transport.feature.runtime.dto.request;

import java.util.UUID;

import com.synapse.transport.common.enums.InferenceStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InferenceRequest {
    private UUID workspaceId;
    private UUID experimentId;
    private InferenceStatus status;
    private String inferenceResultStorageKey;
    private String inferenceError;
}
