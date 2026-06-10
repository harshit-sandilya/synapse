package com.synapse.transport.feature.dataset.dto.queue;

import java.util.UUID;

import com.synapse.transport.common.enums.DatasetProvider;
import com.synapse.transport.common.enums.ExperimentTaskType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetValidationJob {
    private UUID workspaceId;
    private UUID experimentId;
    private ExperimentTaskType taskType;
    private DatasetProvider provider;
    private String datasetName;
    private String datasetConfigStorageKey;
}
