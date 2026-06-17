package com.synapse.transport.feature.experiment.service;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.feature.experiment.dto.response.ExperimentTelemetryResponse;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExperimentTelemetryViewService {

    private final ExperimentRepository experimentRepository;
    private final ExperimentModelConfigRepository modelConfigRepository;

    @Transactional(readOnly = true)
    public ExperimentTelemetryResponse getTelemetry(UUID experimentId) {
        Experiment experiment = experimentRepository
            .findById(experimentId)
            .orElseThrow(() -> new IllegalArgumentException("Experiment not found"));

        ExperimentModelConfig modelConfig = modelConfigRepository.findByExperimentId(experimentId).orElse(null);

        String topic =
            experiment.getModelReady() == ModelStatus.TRAINING && modelConfig != null ? modelConfig.getPublisherTopic() : null;

        String url =
            experiment.getModelReady() == ModelStatus.TRAINING && modelConfig != null
                ? modelConfig.getPublisherServiceUrl()
                : null;

        return ExperimentTelemetryResponse.builder()
            .experimentId(experimentId)
            .status(experiment.getModelReady())
            .publisherServiceUrl(url)
            .publisherTopic(topic)
            .startedAt(modelConfig == null ? null : modelConfig.getStartedAt())
            .endedAt(modelConfig == null ? null : modelConfig.getEndedAt())
            .build();
    }
}
