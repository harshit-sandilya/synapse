package com.synapse.transport.feature.runtime.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.ClassificationMetrics;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.RegressionMetrics;
import com.synapse.transport.common.enums.ExperimentTaskType;
import com.synapse.transport.feature.metrics.repository.ClassificationMetricsRepository;
import com.synapse.transport.feature.metrics.repository.RegressionMetricsRepository;
import com.synapse.transport.infrastructure.storage.ObjectStorageService;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class MetricsExtractionService {
    private final ObjectStorageService storageService;
    private final ClassificationMetricsRepository classificationMetricsRepository;
    private final RegressionMetricsRepository regressionMetricsRepository;

    @Transactional
    public void extractAndPersistMetrics(Experiment experiment, String metricsStorageKey) {
        JsonNode root = storageService.readLastJsonLine(metricsStorageKey);
        JsonNode metrics = root.path("test_metrics");

        if (experiment.getTaskType() == ExperimentTaskType.CLASSIFICATION) {
            ClassificationMetrics entity = classificationMetricsRepository
                    .findByExperimentId(experiment.getId())
                    .orElse(ClassificationMetrics
                            .builder()
                            .experiment(experiment)
                            .build());

            entity.setAccuracy(
                    metrics.path("accuracy")
                            .asDouble());

            entity.setPrecisionScore(
                    metrics.path("precision")
                            .asDouble());

            entity.setRecallScore(
                    metrics.path("recall")
                            .asDouble());

            entity.setF1Score(
                    metrics.path("f1")
                            .asDouble());

            classificationMetricsRepository
                    .save(entity);

            return;
        }

        RegressionMetrics entity = regressionMetricsRepository
                .findByExperimentId(experiment.getId())
                .orElse(RegressionMetrics
                        .builder()
                        .experiment(experiment)
                        .build());

        entity.setMse(
                metrics.path("mse")
                        .asDouble());

        entity.setRmse(
                metrics.path("rmse")
                        .asDouble());

        entity.setMae(
                metrics.path("mae")
                        .asDouble());

        entity.setR2Score(
                metrics.path("r2")
                        .asDouble());

        regressionMetricsRepository
                .save(entity);

    }
}
