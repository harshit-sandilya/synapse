package com.synapse.transport.feature.experiment.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.feature.experiment.dto.response.ExperimentHomeResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExperimentHomeViewService {
    private final ExperimentLookupService experimentLookupService;

    @Transactional(readOnly = true)
    public ExperimentHomeResponse getHome(UUID experimentId) {
        Experiment experiment = experimentLookupService.getExperiment(experimentId);

        return ExperimentHomeResponse.builder()
                .workspaceId(experiment.getWorkspace().getId())
                .experimentId(experiment.getId())
                .name(experiment.getName())
                .description(experiment.getDescription())
                .taskType(experiment.getTaskType())
                .status(experiment.getStatus())
                .datasetReady(experiment.getDatasetReady())
                .modelReady(experiment.getModelReady())
                .inferenceReady(experiment.getInferenceReady())
                .createdBy(experiment.getCreatedBy().getUsername())
                .createdAt(experiment.getCreatedAt())
                .updatedAt(experiment.getUpdatedAt())
                .build();
    }
}