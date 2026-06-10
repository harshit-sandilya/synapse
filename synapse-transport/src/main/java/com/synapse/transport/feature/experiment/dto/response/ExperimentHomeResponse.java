package com.synapse.transport.feature.experiment.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.synapse.transport.common.enums.ExperimentStatus;
import com.synapse.transport.common.enums.ExperimentTaskType;
import com.synapse.transport.common.enums.InferenceStatus;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.common.enums.ConfigStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentHomeResponse {
    private UUID workspaceId;
    private UUID experimentId;

    private String name;
    private String description;

    private ExperimentTaskType taskType;
    private ExperimentStatus status;

    private ConfigStatus datasetReady;
    private ModelStatus modelReady;
    private InferenceStatus inferenceReady;

    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
