package com.synapse.transport.feature.runtime.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentInferenceConfig;
import com.synapse.transport.common.enums.ArtifactType;
import com.synapse.transport.common.enums.InferenceStatus;

import com.synapse.transport.feature.artifact.repository.ArtifactRepository;
import com.synapse.transport.feature.inference.repository.ExperimentInferenceConfigRepository;
import com.synapse.transport.feature.runtime.dto.request.InferenceRequest;
import com.synapse.transport.feature.runtime.dto.response.InferenceResponse;

import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RuntimeInferenceService {

    private final ExperimentRepository experimentRepository;
    private final ExperimentInferenceConfigRepository inferenceConfigRepository;
    private final ArtifactRepository artifactRepository;

    @Transactional
    public InferenceResponse processInferenceResult(
            InferenceRequest request) {

        Experiment experiment = experimentRepository
                .findById(request.getExperimentId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Experiment not found"));

        ExperimentInferenceConfig inferenceConfig = inferenceConfigRepository
                .findByExperimentId(experiment.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Inference configuration not found"));

        experiment.setInferenceReady(
                request.getStatus());

        if (request.getStatus() == InferenceStatus.DONE) {

            Artifact inferenceArtifact = inferenceConfig.getInferenceArtifact();

            if (inferenceArtifact == null) {

                inferenceArtifact = Artifact.builder()
                        .experiment(experiment)
                        .artifactType(
                                ArtifactType.INFERENCE_RESULT)
                        .storageKey(
                                request.getInferenceResultStorageKey())
                        .mimeType("application/json")
                        .build();

            } else {

                inferenceArtifact.setStorageKey(
                        request.getInferenceResultStorageKey());

                inferenceArtifact.setMimeType(
                        "application/json");
            }

            inferenceArtifact = artifactRepository.save(
                    inferenceArtifact);

            inferenceConfig.setInferenceArtifact(
                    inferenceArtifact);

            inferenceConfig.setLastInferenceError(
                    null);

        } else if (request.getStatus() == InferenceStatus.FAILED) {

            inferenceConfig.setLastInferenceError(
                    request.getInferenceError());
        }

        inferenceConfigRepository.save(
                inferenceConfig);

        experimentRepository.save(
                experiment);

        return InferenceResponse.builder()
                .experimentId(experiment.getId())
                .build();
    }
}