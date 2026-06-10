package com.synapse.transport.feature.experiment.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.Workspace;

public interface ExperimentRepository extends JpaRepository<Experiment, UUID> {
    List<Experiment> findAllByWorkspaceOrderByUpdatedAtDesc(Workspace workspace);
}