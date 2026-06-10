package com.synapse.transport.feature.experiment.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentDatasetConfig;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.feature.experiment.dto.response.ExperimentModelResponse;
import com.synapse.transport.feature.dataset.repository.ExperimentDatasetConfigRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class ExperimentModelViewService {

        private final ExperimentRepository experimentRepository;
        private final ExperimentDatasetConfigRepository datasetConfigRepository;
        private final ExperimentModelConfigRepository modelConfigRepository;

        private final ExperimentArtifactService experimentArtifactService;

        @Transactional(readOnly = true)
        public ExperimentModelResponse getModel(
                        UUID experimentId) {

                Experiment experiment = experimentRepository
                                .findById(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Experiment not found"));

                ExperimentDatasetConfig datasetConfig = datasetConfigRepository
                                .findByExperimentId(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Dataset configuration not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository
                                .findByExperimentId(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Model configuration not found"));

                JsonNode modelIr = experimentArtifactService
                                .readArtifact(modelConfig.getModelArtifact());

                JsonNode trainingConfig = experimentArtifactService
                                .readArtifact(modelConfig.getModelConfigArtifact());

                return ExperimentModelResponse.builder()
                                .experimentId(experiment.getId())
                                .taskType(experiment.getTaskType())

                                .modelStatus(experiment.getModelReady())

                                .modelIr(modelIr)

                                .inputShape(datasetConfig.getInputShape())
                                .outputShape(datasetConfig.getOutputShape())

                                .optimizer(
                                                trainingConfig.hasNonNull("optimizer")
                                                                ? com.synapse.transport.common.enums.OptimizerType
                                                                                .valueOf(
                                                                                                trainingConfig.get(
                                                                                                                "optimizer")
                                                                                                                .asString())
                                                                : null)

                                .lossFunction(
                                                trainingConfig.hasNonNull("lossFunction")
                                                                ? com.synapse.transport.common.enums.LossFunctionType
                                                                                .valueOf(
                                                                                                trainingConfig.get(
                                                                                                                "lossFunction")
                                                                                                                .asString())
                                                                : null)

                                .learningRate(
                                                trainingConfig.hasNonNull("learningRate")
                                                                ? trainingConfig.get("learningRate")
                                                                                .asDouble()
                                                                : null)

                                .epochs(
                                                trainingConfig.hasNonNull("epochs")
                                                                ? trainingConfig.get("epochs")
                                                                                .asInt()
                                                                : null)

                                .lastTrainingError(
                                                modelConfig.getLastTrainingError())

                                .build();
        }
}