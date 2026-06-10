package com.synapse.transport.feature.runtime.dto.request;

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
public class TrainingStartRequest {
    private UUID workspaceId;
    private UUID experimentId;
    private ModelStatus status;
    private String telemetryTopic;
    private String publisherServiceUrl;
    private String metricsStorageKey;
}
