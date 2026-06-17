package com.synapse.transport.feature.experiment.service;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentDatasetConfig;
import com.synapse.transport.feature.dataset.repository.ExperimentDatasetConfigRepository;
import com.synapse.transport.feature.experiment.dto.response.ExperimentDatasetResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class ExperimentDatasetViewService {

    private final ExperimentLookupService experimentLookupService;
    private final ExperimentDatasetConfigRepository datasetConfigRepository;
    private final ExperimentArtifactService artifactService;

    @Transactional(readOnly = true)
    public ExperimentDatasetResponse getDataset(java.util.UUID experimentId) {
        Experiment experiment = experimentLookupService.getExperiment(experimentId);

        ExperimentDatasetConfig datasetConfig = datasetConfigRepository.findByExperimentId(experimentId).orElse(null);

        if (datasetConfig == null) {
            return ExperimentDatasetResponse.builder()
                .experimentId(experiment.getId())
                .datasetStatus(experiment.getDatasetReady())
                .build();
        }

        JsonNode configJson = artifactService.readArtifact(datasetConfig.getDatasetConfigArtifact());

        return ExperimentDatasetResponse.builder()
            .experimentId(experiment.getId())

            .datasetStatus(experiment.getDatasetReady())

            .provider(datasetConfig.getDatasetProvider())

            .datasetName(datasetConfig.getDatasetName())

            .trainSampleCount(datasetConfig.getTrainSampleCount())

            .testSampleCount(datasetConfig.getTestSampleCount())

            .inputShape(datasetConfig.getInputShape())

            .outputShape(datasetConfig.getOutputShape())

            .batchSize(readInteger(configJson, "batchSize"))

            .numWorkers(readInteger(configJson, "numWorkers"))

            .shuffle(readBoolean(configJson, "shuffle"))

            .pinMemory(readBoolean(configJson, "pinMemory"))

            .dropLast(readBoolean(configJson, "dropLast"))

            .prefetchFactor(readInteger(configJson, "prefetchFactor"))

            .persistentWorkers(readBoolean(configJson, "persistentWorkers"))

            .lastValidationError(datasetConfig.getLastValidationError())

            .build();
    }

    private Integer readInteger(JsonNode node, String field) {
        JsonNode value = node.get(field);

        return value == null || value.isNull() ? null : value.asInt();
    }

    private Boolean readBoolean(JsonNode node, String field) {
        JsonNode value = node.get(field);

        return value == null || value.isNull() ? null : value.asBoolean();
    }
}
