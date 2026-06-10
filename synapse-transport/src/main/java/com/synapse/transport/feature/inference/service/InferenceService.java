package com.synapse.transport.feature.inference.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentDatasetConfig;
import com.synapse.transport.common.entity.ExperimentInferenceConfig;
import com.synapse.transport.common.entity.ExperimentModelConfig;

import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.InferenceStatus;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.common.enums.JobPriority;

import com.synapse.transport.feature.inference.dto.queue.ModelInferenceJob;
import com.synapse.transport.feature.inference.dto.request.InferenceQueueRequest;
import com.synapse.transport.feature.inference.dto.response.InferenceQueueResponse;

import com.synapse.transport.feature.inference.repository.ExperimentInferenceConfigRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.feature.dataset.repository.ExperimentDatasetConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import com.synapse.transport.infrastructure.queue.ActionQueueService;
import com.synapse.transport.util.QueueUtil;
import com.synapse.transport.exception.dto.QueueJob;
import com.synapse.transport.common.enums.JobType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InferenceService {

        private final ExperimentRepository experimentRepository;
        private final ExperimentDatasetConfigRepository datasetConfigRepository;
        private final ExperimentModelConfigRepository modelConfigRepository;
        private final ExperimentInferenceConfigRepository inferenceConfigRepository;

        private final ActionQueueService actionQueueService;
        private final ObjectMapper objectMapper;

        @Transactional
        public InferenceQueueResponse queueInference(
                        InferenceQueueRequest request) {

                Experiment experiment = experimentRepository
                                .findById(request.getExperimentId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Experiment not found"));

                if (experiment.getDatasetReady() != ConfigStatus.READY) {
                        throw new IllegalStateException(
                                        "Dataset has not been validated");
                }

                if (experiment.getModelReady() != ModelStatus.DONE) {
                        throw new IllegalStateException(
                                        "Model training has not completed");
                }

                ExperimentDatasetConfig datasetConfig = datasetConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElseThrow(() -> new IllegalStateException(
                                                "Dataset configuration not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElseThrow(() -> new IllegalStateException(
                                                "Model configuration not found"));

                Integer testSampleCount = datasetConfig.getTestSampleCount();

                if (testSampleCount == null) {
                        throw new IllegalStateException(
                                        "Dataset validation has not produced sample counts");
                }

                if (request.getSampleNumber() < 0 ||
                                request.getSampleNumber() >= testSampleCount) {

                        throw new IllegalArgumentException(
                                        "Sample number must be between 0 and "
                                                        + (testSampleCount - 1));
                }

                ModelInferenceJob jobData = ModelInferenceJob.builder()
                                .workspaceId(experiment.getWorkspace().getId())
                                .experimentId(experiment.getId())
                                .taskType(experiment.getTaskType())
                                .datasetConfigStorageKey(
                                                datasetConfig.getDatasetConfigArtifact()
                                                                .getStorageKey())
                                .datasetStorageKey(
                                                datasetConfig.getDatasetArtifact()
                                                                .getStorageKey())
                                .modelIrStorageKey(
                                                modelConfig.getModelArtifact()
                                                                .getStorageKey())
                                .modelConfigStorageKey(
                                                modelConfig.getModelConfigArtifact()
                                                                .getStorageKey())
                                .modelCheckpointStorageKey(modelConfig.getCheckpointStorageArtifact().getStorageKey())
                                .sampleNumber(request.getSampleNumber())
                                .build();

                QueueJob<ModelInferenceJob> job = QueueUtil.createJobEntry("inference for exp", jobData,
                                JobType.INFERENCE);

                try {

                        actionQueueService.enqueue(
                                        JobPriority.MEDIUM,
                                        objectMapper.writeValueAsString(job));

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to enqueue inference job",
                                        e);
                }

                ExperimentInferenceConfig inferenceConfig = inferenceConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElseGet(() -> ExperimentInferenceConfig.builder()
                                                .experiment(experiment)
                                                .build());

                inferenceConfig.setSampleNumber(
                                request.getSampleNumber());

                inferenceConfig.setLastInferenceError(null);

                inferenceConfigRepository.save(
                                inferenceConfig);

                experiment.setInferenceReady(
                                InferenceStatus.QUEUED);

                experimentRepository.save(experiment);

                return InferenceQueueResponse.builder()
                                .experimentId(experiment.getId())
                                .sampleNumber(request.getSampleNumber())
                                .status(InferenceStatus.QUEUED)
                                .build();
        }
}