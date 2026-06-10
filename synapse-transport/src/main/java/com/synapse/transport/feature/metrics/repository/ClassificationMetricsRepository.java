package com.synapse.transport.feature.metrics.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import com.synapse.transport.common.entity.ClassificationMetrics;

public interface ClassificationMetricsRepository extends JpaRepository<ClassificationMetrics, UUID> {
    Optional<ClassificationMetrics> findByExperimentId(UUID experimentId);
}
