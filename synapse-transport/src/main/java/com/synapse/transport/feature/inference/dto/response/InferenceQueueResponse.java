package com.synapse.transport.feature.inference.dto.response;

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
public class InferenceQueueResponse {
    private UUID experimentId;
    private Integer sampleNumber;
    private InferenceStatus status;
}
