package com.synapse.transport.feature.dataset.dto.request;

import java.util.UUID;

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
public class SaveDatasetConfigRequest {
    @NotNull(message = "Experiment Id cannot be null")
    private UUID experimentId;

    @NotNull(message = "Dataset provider is required")
    private DatasetProvider provider;

    @NotNull(message = "Dataset name is required")
    private String datasetName;

    private Integer batchSize;
    private Integer numWorkers;
    private Boolean shuffle;
    private Boolean pinMemory;
    private Boolean dropLast;
    private Integer prefetchFactor;
    private Boolean persistentWorkers;
}
