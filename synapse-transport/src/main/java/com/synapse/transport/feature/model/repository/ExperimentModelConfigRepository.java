package com.synapse.transport.feature.model.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.transport.common.entity.ExperimentModelConfig;

public interface ExperimentModelConfigRepository extends JpaRepository<ExperimentModelConfig, UUID> {
    Optional<ExperimentModelConfig> findByExperimentId(UUID experimentId);

    boolean existsByExperimentId(UUID experimentId);
}