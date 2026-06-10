package com.synapse.transport.feature.workspace.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.Workspace;
import com.synapse.transport.feature.workspace.dto.response.ExperimentSummaryResponse;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.feature.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkspaceExperimentService {
    private final ExperimentRepository experimentRepository;
    private final WorkspaceRepository workspaceRepository;

    @Transactional(readOnly = true)
    public List<ExperimentSummaryResponse> getWorkspaceExperiments(UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        return experimentRepository.findAllByWorkspaceOrderByUpdatedAtDesc(workspace).stream()
                .map(this::mapToExperimentSummary).toList();
    }

    private ExperimentSummaryResponse mapToExperimentSummary(Experiment experiment) {
        return ExperimentSummaryResponse.builder().id(experiment.getId()).name(experiment.getName())
                .status(experiment.getStatus()).createdAt(experiment.getCreatedAt())
                .updatedAt(experiment.getUpdatedAt()).build();
    }
}
