package com.synapse.transport.feature.experiment.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentInferenceConfig;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.feature.experiment.dto.response.ExperimentInferenceResponse;
import com.synapse.transport.feature.inference.repository.ExperimentInferenceConfigRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.NullNode;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperimentInferenceViewService {

        private final ExperimentRepository experimentRepository;
        private final ExperimentInferenceConfigRepository inferenceConfigRepository;
        private final ExperimentModelConfigRepository modelConfigRepository;

        private final ExperimentArtifactService experimentArtifactService;

        public ExperimentInferenceResponse getInference(
                        UUID experimentId) {

                Experiment experiment = experimentRepository
                                .findById(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Experiment not found"));

                ExperimentInferenceConfig inferenceConfig = inferenceConfigRepository
                                .findByExperimentId(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Inference configuration not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository
                                .findByExperimentId(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Model configuration not found"));

                JsonNode modelIr = experimentArtifactService
                                .readArtifact(
                                                modelConfig.getModelArtifact());

                JsonNode inferenceResult = NullNode.getInstance();

                Artifact inferenceArtifact = inferenceConfig
                                .getInferenceArtifact();

                if (inferenceArtifact != null) {

                        inferenceResult = experimentArtifactService
                                        .readArtifact(
                                                        inferenceArtifact);
                }

                return ExperimentInferenceResponse.builder()
                                .experimentId(experimentId)

                                .status(
                                                experiment.getInferenceReady())

                                .sampleNumber(
                                                inferenceConfig.getSampleNumber())

                                .modelIr(
                                                modelIr)

                                .inferenceResult(
                                                inferenceResult)

                                .lastInferenceError(
                                                inferenceConfig.getLastInferenceError())

                                .build();
        }
}