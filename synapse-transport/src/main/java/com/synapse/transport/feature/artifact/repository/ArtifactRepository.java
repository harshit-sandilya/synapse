package com.synapse.transport.feature.artifact.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.enums.ArtifactType;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {
    List<Artifact> findByExperimentId(UUID experimentId);

    List<Artifact> findByExperimentIdAndArtifactType(UUID experimentId, ArtifactType artifactType);
}