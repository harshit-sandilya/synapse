package com.synapse.transport.feature.dataset.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.JacksonException;
import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentDatasetConfig;
import com.synapse.transport.common.enums.ArtifactType;
import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.JobPriority;
import com.synapse.transport.common.enums.JobType;
import com.synapse.transport.exception.custom.ResourceNotFoundException;
import com.synapse.transport.exception.dto.QueueJob;
import com.synapse.transport.feature.dataset.dto.queue.DatasetValidationJob;
import com.synapse.transport.feature.dataset.dto.request.SaveDatasetConfigRequest;
import com.synapse.transport.feature.dataset.dto.request.ValidateDatasetRequest;
import com.synapse.transport.feature.dataset.dto.response.SaveDatasetConfigResponse;
import com.synapse.transport.feature.dataset.dto.response.ValidateDatasetResponse;
import com.synapse.transport.feature.dataset.repository.ExperimentDatasetConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.infrastructure.queue.ActionQueueService;
import com.synapse.transport.util.QueueUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DatasetConfigService {

        private final ExperimentRepository experimentRepository;
        private final ExperimentDatasetConfigRepository datasetConfigRepository;

        private final DatasetArtifactService artifactService;
        private final ActionQueueService actionQueueService;
        private final ObjectMapper objectMapper;

        public SaveDatasetConfigResponse saveDatasetConfig(SaveDatasetConfigRequest request) {

                Experiment experiment = experimentRepository
                                .findById(request.getExperimentId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Experiment not found"));

                Map<String, Object> config = new HashMap<>();

                config.put("batchSize", request.getBatchSize());
                config.put("numWorkers", request.getNumWorkers());
                config.put("shuffle", request.getShuffle());
                config.put("pinMemory", request.getPinMemory());
                config.put("dropLast", request.getDropLast());
                config.put("prefetchFactor", request.getPrefetchFactor());
                config.put("persistentWorkers", request.getPersistentWorkers());

                String json;

                try {
                        json = objectMapper.writeValueAsString(config);
                } catch (JacksonException e) {
                        throw new RuntimeException("Failed to serialize dataset config", e);
                }

                String storageKey = "experiments/" + experiment.getId() + "/dataset/config.json";

                ExperimentDatasetConfig datasetConfig = datasetConfigRepository
                                .findByExperimentId(experiment.getId())
                                .orElse(new ExperimentDatasetConfig());

                Artifact configArtifact;

                if (datasetConfig.getDatasetConfigArtifact() == null) {
                        configArtifact = artifactService.createJsonArtifact(
                                        experiment,
                                        ArtifactType.DATASET_CONFIG,
                                        storageKey,
                                        json);

                } else {
                        configArtifact = artifactService.updateJsonArtifact(
                                        datasetConfig.getDatasetConfigArtifact(),
                                        json);
                }

                datasetConfig.setExperiment(experiment);
                datasetConfig.setDatasetProvider(request.getProvider());
                datasetConfig.setDatasetName(request.getDatasetName());
                datasetConfig.setDatasetConfigArtifact(configArtifact);
                experiment.setDatasetReady(ConfigStatus.CONFIGURED);

                experimentRepository.save(experiment);
                datasetConfigRepository.save(datasetConfig);

                return SaveDatasetConfigResponse.builder()
                                .experimentId(experiment.getId())
                                .provider(request.getProvider())
                                .datasetName(request.getDatasetName())
                                .datasetConfigArtifactId(configArtifact.getId())
                                .batchSize(request.getBatchSize())
                                .numWorkers(request.getNumWorkers())
                                .shuffle(request.getShuffle())
                                .pinMemory(request.getPinMemory())
                                .dropLast(request.getDropLast())
                                .prefetchFactor(request.getPrefetchFactor())
                                .persistentWorkers(request.getPersistentWorkers())
                                .build();
        }

        public ValidateDatasetResponse validateDataset(ValidateDatasetRequest request) {

                ExperimentDatasetConfig datasetConfig = datasetConfigRepository
                                .findByExperimentId(request.getExperimentId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Dataset configuration not found"));

                Experiment experiment = datasetConfig.getExperiment();
                experiment.setDatasetReady(ConfigStatus.VALIDATING);
                experimentRepository.save(experiment);

                DatasetValidationJob jobData = DatasetValidationJob.builder()
                                .workspaceId(datasetConfig.getExperiment().getWorkspace().getId())
                                .experimentId(datasetConfig.getExperiment().getId())
                                .taskType(datasetConfig.getExperiment().getTaskType())
                                .provider(datasetConfig.getDatasetProvider())
                                .datasetName(datasetConfig.getDatasetName())
                                .datasetConfigStorageKey(datasetConfig.getDatasetConfigArtifact().getStorageKey())
                                .build();
                QueueJob<DatasetValidationJob> job = QueueUtil.createJobEntry("dataset vlaidation for exp", jobData,
                                JobType.DATASET_VALIDATION);

                try {
                        actionQueueService.enqueue(JobPriority.HIGH, objectMapper.writeValueAsString(job));
                } catch (JacksonException e) {
                        throw new RuntimeException("Failed to queue validation job", e);
                }

                return ValidateDatasetResponse.builder()
                                .experimentId(request.getExperimentId())
                                .status(ConfigStatus.VALIDATING)
                                .build();
        }
}