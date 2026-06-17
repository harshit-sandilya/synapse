package com.synapse.transport.feature.experiment.service;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentInferenceConfig;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.exception.custom.ResourceNotFoundException;
import com.synapse.transport.feature.experiment.dto.response.ExperimentInferenceResponse;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.feature.inference.repository.ExperimentInferenceConfigRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    public ExperimentInferenceResponse getInference(UUID experimentId) {
        Experiment experiment = experimentRepository
            .findById(experimentId)
            .orElseThrow(() -> new ResourceNotFoundException("Experiment not found"));

        ExperimentInferenceConfig inferenceConfig = inferenceConfigRepository.findByExperimentId(experimentId).orElse(null);

        ExperimentModelConfig modelConfig = modelConfigRepository.findByExperimentId(experimentId).orElse(null);

        JsonNode modelIr = NullNode.getInstance();
        if (modelConfig != null && modelConfig.getModelArtifact() != null) {
            modelIr = experimentArtifactService.readArtifact(modelConfig.getModelArtifact());
        }

        JsonNode inferenceResult = NullNode.getInstance();
        Integer sampleNumber = null;
        String lastInferenceError = null;

        if (inferenceConfig != null) {
            sampleNumber = inferenceConfig.getSampleNumber();
            lastInferenceError = inferenceConfig.getLastInferenceError();

            Artifact inferenceArtifact = inferenceConfig.getInferenceArtifact();
            if (inferenceArtifact != null) {
                inferenceResult = experimentArtifactService.readArtifact(inferenceArtifact);
            }
        }

        return ExperimentInferenceResponse.builder()
            .experimentId(experimentId)
            .status(experiment.getInferenceReady())
            .sampleNumber(sampleNumber)
            .modelIr(modelIr)
            .inferenceResult(inferenceResult)
            .lastInferenceError(lastInferenceError)
            .build();
    }
}
