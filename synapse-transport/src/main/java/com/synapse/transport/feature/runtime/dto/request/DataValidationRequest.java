package com.synapse.transport.feature.runtime.dto.request;

import java.util.UUID;

import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.DatasetProvider;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataValidationRequest {
    @NotNull(message = "Workspace Id cannot be null")
    private UUID workspaceId;

    @NotNull(message = "Experiment Id cannot be null")
    private UUID experimentId;

    @NotNull(message = "Dataset provider is required")
    private DatasetProvider provider;

    @NotNull(message = "Dataset name is required")
    private String datasetName;

    @NotNull(message = "Status must not be null")
    private ConfigStatus status;

    @NotNull(message = "Dataset Config storage key must not be null")
    private String datasetConfigStorageKey;

    private String datasetSnapshotStorageKey;
    private String inputShape;
    private String outputShape;
    private Integer trainSampleCount;
    private Integer testSampleCount;

    private String validationError;
}
