package com.synapse.transport.feature.runtime.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentDatasetConfig;
import com.synapse.transport.common.enums.ArtifactType;
import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.feature.runtime.dto.request.DataValidationRequest;
import com.synapse.transport.feature.runtime.dto.response.DataValidationResponse;
import com.synapse.transport.feature.artifact.repository.ArtifactRepository;
import com.synapse.transport.feature.dataset.repository.ExperimentDatasetConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RuntimeDatasetService {

    private final ExperimentRepository experimentRepository;
    private final ExperimentDatasetConfigRepository datasetConfigRepository;
    private final ArtifactRepository artifactRepository;

    @Transactional
    public DataValidationResponse processValidationResult(
            DataValidationRequest request) {

        Experiment experiment = experimentRepository
                .findById(request.getExperimentId())
                .orElseThrow(() -> new RuntimeException("Experiment not found"));

        ExperimentDatasetConfig datasetConfig = datasetConfigRepository
                .findByExperimentId(request.getExperimentId())
                .orElseThrow(() -> new RuntimeException("Dataset config not found"));

        experiment.setDatasetReady(request.getStatus());

        if (request.getStatus() != ConfigStatus.READY) {

            datasetConfig.setLastValidationError(
                    request.getValidationError());

            experimentRepository.save(experiment);
            datasetConfigRepository.save(datasetConfig);

            return DataValidationResponse.builder()
                    .experimentId(experiment.getId())
                    .build();
        }

        Artifact datasetArtifact = createOrUpdateDatasetArtifact(
                experiment,
                request.getDatasetSnapshotStorageKey());

        datasetConfig.setDatasetArtifact(datasetArtifact);

        datasetConfig.setTrainSampleCount(
                request.getTrainSampleCount());

        datasetConfig.setTestSampleCount(
                request.getTestSampleCount());

        datasetConfig.setInputShape(
                request.getInputShape());

        datasetConfig.setOutputShape(
                request.getOutputShape());

        datasetConfig.setLastValidationError(null);

        experimentRepository.save(experiment);
        datasetConfigRepository.save(datasetConfig);

        return DataValidationResponse.builder()
                .experimentId(experiment.getId())
                .build();
    }

    private Artifact createOrUpdateDatasetArtifact(
            Experiment experiment,
            String snapshotStorageKey) {

        List<Artifact> artifacts = artifactRepository
                .findByExperimentIdAndArtifactType(
                        experiment.getId(),
                        ArtifactType.DATASET_CACHE);

        Artifact artifact;

        if (!artifacts.isEmpty()) {

            artifact = artifacts.get(0);

            artifact.setStorageKey(
                    snapshotStorageKey);

        } else {

            artifact = Artifact.builder()
                    .experiment(experiment)
                    .artifactType(
                            ArtifactType.DATASET_CACHE)
                    .storageKey(snapshotStorageKey)
                    .mimeType("application/octet-stream")
                    .build();
        }

        return artifactRepository.save(artifact);
    }
}