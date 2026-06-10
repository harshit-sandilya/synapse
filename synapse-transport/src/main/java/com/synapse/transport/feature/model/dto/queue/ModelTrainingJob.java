package com.synapse.transport.feature.model.dto.queue;

import java.util.UUID;

import com.synapse.transport.common.enums.ExperimentTaskType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelTrainingJob {
    private UUID workspaceId;
    private UUID experimentId;
    private ExperimentTaskType taskType;
    private String datasetConfigStorageKey;
    private String datasetStorageKey;
    private String modelIrStorageKey;
    private String modelConfigStorageKey;
}
