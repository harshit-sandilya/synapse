package com.synapse.transport.feature.model.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentDatasetConfig;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.common.enums.ArtifactType;
import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.JobPriority;
import com.synapse.transport.common.enums.JobType;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.exception.dto.QueueJob;
import com.synapse.transport.feature.model.dto.queue.ModelTrainingJob;
import com.synapse.transport.feature.model.dto.request.RunTrainingRequest;
import com.synapse.transport.feature.model.dto.request.SaveModelConfigRequest;
import com.synapse.transport.feature.model.dto.response.RunTrainingResponse;
import com.synapse.transport.feature.model.dto.response.SaveModelConfigResponse;
import com.synapse.transport.feature.dataset.repository.ExperimentDatasetConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.infrastructure.queue.ActionQueueService;
import com.synapse.transport.util.QueueUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ExperimentModelService {

        private final ExperimentRepository experimentRepository;
        private final ExperimentModelConfigRepository modelConfigRepository;
        private final ExperimentDatasetConfigRepository experimentDatasetConfigRepository;

        private final ModelArtifactService modelArtifactService;
        private final ActionQueueService actionQueueService;
        private final ObjectMapper objectMapper;

        public SaveModelConfigResponse saveModelConfig(
                        SaveModelConfigRequest request) {

                Experiment experiment = experimentRepository.findById(
                                request.getExperimentId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Experiment not found"));

                String modelIrJson;

                try {
                        modelIrJson = objectMapper.writeValueAsString(
                                        request.getModelIr());
                } catch (JacksonException e) {
                        throw new RuntimeException(
                                        "Failed to serialize model IR",
                                        e);
                }

                Map<String, Object> config = new HashMap<>();

                config.put("optimizer", request.getOptimizer());
                config.put("lossFunction", request.getLossFunction());
                config.put("learningRate", request.getLearningRate());
                config.put("epochs", request.getEpochs());

                String configJson;

                try {
                        configJson = objectMapper.writeValueAsString(config);
                } catch (JacksonException e) {
                        throw new RuntimeException(
                                        "Failed to serialize model config",
                                        e);
                }

                String modelIrStorageKey = "experiments/" +
                                experiment.getId() +
                                "/model/model-ir.json";

                String modelConfigStorageKey = "experiments/" +
                                experiment.getId() +
                                "/model/training-config.json";

                ExperimentModelConfig modelConfig = modelConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElse(null);

                Artifact modelIrArtifact;
                Artifact trainingConfigArtifact;

                if (modelConfig == null) {

                        modelIrArtifact = modelArtifactService.createArtifact(
                                        experiment,
                                        ArtifactType.MODEL_IR,
                                        modelIrStorageKey,
                                        modelIrJson);

                        trainingConfigArtifact = modelArtifactService.createArtifact(
                                        experiment,
                                        ArtifactType.MODEL_CONFIG,
                                        modelConfigStorageKey,
                                        configJson);

                        modelConfig = ExperimentModelConfig.builder()
                                        .experiment(experiment)
                                        .modelArtifact(modelIrArtifact)
                                        .modelConfigArtifact(trainingConfigArtifact)
                                        .build();

                } else {

                        modelIrArtifact = modelArtifactService.updateArtifact(
                                        modelConfig.getModelArtifact(),
                                        modelIrJson);

                        trainingConfigArtifact = modelArtifactService.updateArtifact(
                                        modelConfig.getModelConfigArtifact(),
                                        configJson);

                        modelConfig.setModelArtifact(modelIrArtifact);
                        modelConfig.setModelConfigArtifact(
                                        trainingConfigArtifact);
                }

                modelConfigRepository.save(modelConfig);

                experiment.setModelReady(ModelStatus.CONFIGURED);

                experimentRepository.save(experiment);

                return SaveModelConfigResponse.builder()
                                .experimentId(experiment.getId())
                                .modelIrArtifactId(modelIrArtifact.getId())
                                .trainingConfigArtifactId(
                                                trainingConfigArtifact.getId())
                                .optimizer(request.getOptimizer())
                                .lossFunction(request.getLossFunction())
                                .learningRate(request.getLearningRate())
                                .epochs(request.getEpochs())
                                .build();
        }

        @Transactional
        public RunTrainingResponse runTraining(RunTrainingRequest request) {
                Experiment experiment = experimentRepository
                                .findById(request.getExperimentId())
                                .orElseThrow(() -> new RuntimeException("Experiment not found"));

                if (experiment.getDatasetReady() != ConfigStatus.READY) {
                        throw new RuntimeException(
                                        "Dataset must be validated before training");
                }

                if (experiment.getModelReady() != ModelStatus.CONFIGURED) {
                        throw new RuntimeException(
                                        "Model must be configured before training");
                }

                ExperimentDatasetConfig datasetConfig = experimentDatasetConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Dataset configuration not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Model configuration not found"));

                if (datasetConfig.getDatasetArtifact() == null) {
                        throw new RuntimeException(
                                        "Dataset snapshot not found");
                }

                if (datasetConfig.getDatasetConfigArtifact() == null) {
                        throw new RuntimeException(
                                        "Dataset config artifact not found");
                }

                if (modelConfig.getModelArtifact() == null) {
                        throw new RuntimeException(
                                        "Model IR artifact not found");
                }

                if (modelConfig.getModelConfigArtifact() == null) {
                        throw new RuntimeException(
                                        "Model config artifact not found");
                }

                ModelTrainingJob jobData = ModelTrainingJob.builder()
                                .workspaceId(experiment.getWorkspace().getId())
                                .experimentId(experiment.getId())
                                .taskType(experiment.getTaskType())
                                .datasetConfigStorageKey(datasetConfig.getDatasetConfigArtifact().getStorageKey())
                                .datasetStorageKey(datasetConfig.getDatasetArtifact().getStorageKey())
                                .modelIrStorageKey(modelConfig.getModelArtifact().getStorageKey())
                                .modelConfigStorageKey(modelConfig.getModelConfigArtifact().getStorageKey())
                                .build();

                QueueJob<ModelTrainingJob> job = QueueUtil.createJobEntry("model training", jobData,
                                JobType.TRAINING);

                try {
                        String payload = objectMapper.writeValueAsString(job);
                        actionQueueService.enqueue(JobPriority.LOW, payload);
                } catch (JacksonException e) {
                        throw new RuntimeException("Failed to serialize training job", e);
                }
                experiment.setModelReady(ModelStatus.QUEUED);
                experimentRepository.save(experiment);
                return RunTrainingResponse.builder()
                                .experimentId(experiment.getId())
                                .status(ModelStatus.QUEUED)
                                .build();
        }
}