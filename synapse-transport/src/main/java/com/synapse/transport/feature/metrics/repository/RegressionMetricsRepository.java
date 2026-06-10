package com.synapse.transport.feature.metrics.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import com.synapse.transport.common.entity.RegressionMetrics;

public interface RegressionMetricsRepository extends JpaRepository<RegressionMetrics, UUID> {
    Optional<RegressionMetrics> findByExperimentId(UUID experimentId);
}
