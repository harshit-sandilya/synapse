package com.synapse.transport.feature.experiment.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetConfigArtifact {
    private Integer batchSize;
    private Integer numWorkers;
    private Boolean shuffle;
    private Boolean pinMemory;
    private Boolean dropLast;
    private Integer prefetchFactor;
    private Boolean persistentWorkers;
}