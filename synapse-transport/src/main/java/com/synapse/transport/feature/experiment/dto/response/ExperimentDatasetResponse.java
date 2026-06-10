package com.synapse.transport.feature.experiment.dto.response;

import java.util.UUID;

import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.DatasetProvider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentDatasetResponse {
    private UUID experimentId;

    private ConfigStatus datasetStatus;
    private DatasetProvider provider;
    private String datasetName;

    private Integer trainSampleCount;
    private Integer testSampleCount;

    private String inputShape;
    private String outputShape;

    private Integer batchSize;
    private Integer numWorkers;
    private Boolean shuffle;
    private Boolean pinMemory;
    private Boolean dropLast;
    private Integer prefetchFactor;
    private Boolean persistentWorkers;

    private String lastValidationError;
}
