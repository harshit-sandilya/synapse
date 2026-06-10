package com.synapse.transport.feature.experiment.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExperimentLookupService {

    private final ExperimentRepository experimentRepository;

    public Experiment getExperiment(UUID experimentId) {
        return experimentRepository
                .findById(experimentId)
                .orElseThrow(() -> new RuntimeException(
                        "Experiment not found: " + experimentId));
    }
}