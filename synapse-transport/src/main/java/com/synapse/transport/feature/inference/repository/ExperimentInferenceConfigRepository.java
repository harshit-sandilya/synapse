package com.synapse.transport.feature.inference.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.transport.common.entity.ExperimentInferenceConfig;

public interface ExperimentInferenceConfigRepository extends JpaRepository<ExperimentInferenceConfig, UUID> {
    Optional<ExperimentInferenceConfig> findByExperimentId(UUID experimentId);

    boolean existsByExperimentId(UUID experimentId);
}
