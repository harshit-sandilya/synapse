package com.synapse.transport.feature.workspace.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.synapse.transport.common.enums.ExperimentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentSummaryResponse {
    private UUID id;
    private String name;
    private ExperimentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
