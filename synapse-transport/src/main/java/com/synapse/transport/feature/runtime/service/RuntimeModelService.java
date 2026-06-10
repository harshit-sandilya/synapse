package com.synapse.transport.feature.runtime.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.common.enums.ArtifactType;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.feature.artifact.repository.ArtifactRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.feature.runtime.dto.request.TrainingEndRequest;
import com.synapse.transport.feature.runtime.dto.request.TrainingStartRequest;
import com.synapse.transport.feature.runtime.dto.response.TrainingEndResponse;
import com.synapse.transport.feature.runtime.dto.response.TrainingStartResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RuntimeModelService {
        private final ExperimentRepository experimentRepository;
        private final ExperimentModelConfigRepository modelConfigRepository;
        private final ArtifactRepository artifactRepository;
        private final MetricsExtractionService metricsExtractionService;

        @Transactional
        public TrainingStartResponse trainingStarted(TrainingStartRequest request) {

                Experiment experiment = experimentRepository.findById(
                                request.getExperimentId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Experiment not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository.findByExperimentId(
                                request.getExperimentId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Model configuration not found"));

                Artifact metricsArtifact = Artifact.builder()
                                .experiment(experiment)
                                .artifactType(
                                                ArtifactType.TRAINING_METRICS)
                                .storageKey(
                                                request.getMetricsStorageKey())
                                .mimeType("application/jsonl")
                                .build();

                metricsArtifact = artifactRepository.save(metricsArtifact);

                experiment.setModelReady(ModelStatus.TRAINING);

                modelConfig.setPublisherTopic(
                                request.getTelemetryTopic());

                modelConfig.setPublisherServiceUrl(
                                request.getPublisherServiceUrl());

                modelConfig.setMetricsStorageArtifact(
                                metricsArtifact);

                modelConfig.setStartedAt(
                                LocalDateTime.now());

                experimentRepository.save(experiment);
                modelConfigRepository.save(modelConfig);

                return TrainingStartResponse.builder()
                                .experimentId(experiment.getId())
                                .build();
        }

        @Transactional
        public TrainingEndResponse trainingEnded(
                        TrainingEndRequest request) {

                Experiment experiment = experimentRepository.findById(
                                request.getExperimentId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Experiment not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository.findByExperimentId(
                                request.getExperimentId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Model configuration not found"));

                Artifact checkpointArtifact = Artifact.builder()
                                .experiment(experiment)
                                .artifactType(
                                                ArtifactType.CHECKPOINT)
                                .storageKey(
                                                request.getCheckpointStorageKey())
                                .mimeType(
                                                "application/octet-stream")
                                .build();

                checkpointArtifact = artifactRepository.save(
                                checkpointArtifact);

                modelConfig.setCheckpointStorageArtifact(
                                checkpointArtifact);

                modelConfig.setEndedAt(
                                LocalDateTime.now());

                experiment.setModelReady(
                                request.getStatus());

                if (request.getStatus() == ModelStatus.FAILED) {
                        modelConfig.setLastTrainingError(request.getTrainingError());
                }

                metricsExtractionService.extractAndPersistMetrics(experiment, request.getMetricsStorageKey());
                experimentRepository.save(experiment);
                modelConfigRepository.save(modelConfig);

                return TrainingEndResponse.builder()
                                .experimentId(experiment.getId())
                                .build();
        }
}
