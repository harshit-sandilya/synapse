package com.synapse.transport.feature.experiment.service;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.ExperimentModelConfig;
import com.synapse.transport.common.enums.ExperimentTaskType;
import com.synapse.transport.feature.experiment.dto.internal.MetricSeries;
import com.synapse.transport.feature.experiment.dto.response.ExperimentMetricsResponse;
import com.synapse.transport.feature.metrics.repository.ClassificationMetricsRepository;
import com.synapse.transport.feature.metrics.repository.RegressionMetricsRepository;
import com.synapse.transport.feature.model.repository.ExperimentModelConfigRepository;
import com.synapse.transport.infrastructure.storage.ObjectStorageService;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class ExperimentMetricsViewService {

    private final ObjectStorageService storageService;
    private final ClassificationMetricsRepository classificationMetricsRepository;
    private final RegressionMetricsRepository regressionMetricsRepository;
    private final ExperimentModelConfigRepository modelConfigRepository;
    private final ExperimentLookupService experimentLookupService;

    @Transactional(readOnly = true)
    public ExperimentMetricsResponse getMetrics(UUID experimentId) {
        Experiment experiment = experimentLookupService.getExperiment(experimentId);

        ExperimentModelConfig modelConfig = modelConfigRepository.findByExperimentId(experimentId).orElse(null);

        if (modelConfig == null) {
            return emptyMetricsResponse(experimentId, experiment);
        }

        Artifact metricsArtifact = modelConfig.getMetricsStorageArtifact();

        if (metricsArtifact == null) {
            return emptyMetricsResponse(experimentId, experiment);
        }

        List<MetricSeries> trainMetrics = loadMetricSeries(metricsArtifact.getStorageKey(), "train_metrics");

        List<MetricSeries> testMetrics = loadMetricSeries(metricsArtifact.getStorageKey(), "test_metrics");

        Object finalMetrics = loadFinalMetrics(experiment);

        return ExperimentMetricsResponse.builder()
            .experimentId(experimentId)
            .taskType(experiment.getTaskType())
            .finalMetrics(finalMetrics)
            .trainMetrics(trainMetrics)
            .testMetrics(testMetrics)
            .build();
    }

    private ExperimentMetricsResponse emptyMetricsResponse(UUID experimentId, Experiment experiment) {
        return ExperimentMetricsResponse.builder()
            .experimentId(experimentId)
            .taskType(experiment.getTaskType())
            .trainMetrics(List.of())
            .testMetrics(List.of())
            .finalMetrics(null)
            .build();
    }

    private Object loadFinalMetrics(Experiment experiment) {
        if (experiment.getTaskType() == ExperimentTaskType.CLASSIFICATION) {
            return classificationMetricsRepository.findByExperimentId(experiment.getId()).orElse(null);
        }

        return regressionMetricsRepository.findByExperimentId(experiment.getId()).orElse(null);
    }

    public List<MetricSeries> loadMetricSeries(String metricsStorageKey, String section) {
        List<JsonNode> rows;

        try {
            rows = storageService.readJsonLines(metricsStorageKey);
        } catch (RuntimeException ignored) {
            return List.of();
        }

        Map<String, List<Double>> metrics = new LinkedHashMap<>();

        for (JsonNode row : rows) {
            JsonNode metricNode = row.path(section);

            metricNode.properties().forEach(entry -> {
                String metricName = entry.getKey();

                metrics.computeIfAbsent(metricName, ignored -> new ArrayList<>());

                metrics.get(metricName).add(entry.getValue().asDouble());
            });
        }

        return metrics
            .entrySet()
            .stream()
            .map(entry -> MetricSeries.builder().name(entry.getKey()).values(entry.getValue()).build())
            .toList();
    }
}
