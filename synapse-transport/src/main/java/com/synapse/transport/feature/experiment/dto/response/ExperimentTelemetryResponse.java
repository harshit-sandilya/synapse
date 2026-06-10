package com.synapse.transport.feature.experiment.dto.response;

import java.time.LocalDateTime;
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
public class ExperimentTelemetryResponse {
    private UUID experimentId;
    private ModelStatus status;

    private String publisherServiceUrl;
    private String publisherTopic;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
