package com.synapse.transport.feature.experiment.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.feature.experiment.dto.response.ExperimentTelemetryResponse;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExperimentTelemetryViewService {
        private final ExperimentRepository experimentRepository;
        private final ExperimentModelConfigRepository modelConfigRepository;

        @Transactional(readOnly = true)
        public ExperimentTelemetryResponse getTelemetry(UUID experimentId) {

                Experiment experiment = experimentRepository
                                .findById(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Experiment not found"));

                ExperimentModelConfig modelConfig = modelConfigRepository
                                .findByExperimentId(experimentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Model configuration not found"));

                String topic = experiment.getModelReady() == ModelStatus.TRAINING
                                ? modelConfig.getPublisherTopic()
                                : null;

                String url = experiment.getModelReady() == ModelStatus.TRAINING
                                ? modelConfig.getPublisherServiceUrl()
                                : null;

                return ExperimentTelemetryResponse.builder()
                                .experimentId(experimentId)
                                .status(experiment.getModelReady())
                                .publisherServiceUrl(url)
                                .publisherTopic(topic)
                                .startedAt(modelConfig.getStartedAt())
                                .endedAt(modelConfig.getEndedAt())
                                .build();
        }
}