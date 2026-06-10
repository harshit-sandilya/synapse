package com.synapse.transport.feature.dataset.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.transport.common.entity.ExperimentDatasetConfig;

public interface ExperimentDatasetConfigRepository extends JpaRepository<ExperimentDatasetConfig, UUID> {
    Optional<ExperimentDatasetConfig> findByExperimentId(UUID experimentId);

    boolean existsByExperimentId(UUID experimentId);
}