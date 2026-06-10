package com.synapse.transport.feature.experiment.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.entity.Workspace;
import com.synapse.transport.common.entity.WorkspaceMember;
import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.ExperimentStatus;
import com.synapse.transport.common.enums.InferenceStatus;
import com.synapse.transport.common.enums.ModelStatus;
import com.synapse.transport.feature.experiment.dto.request.CreateExperimentRequest;
import com.synapse.transport.feature.experiment.dto.response.ExperimentHomeResponse;
import com.synapse.transport.feature.experiment.repository.ExperimentRepository;
import com.synapse.transport.feature.workspace.repository.WorkspaceMemberRepository;
import com.synapse.transport.feature.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ExperimentCreationService {

        private final ExperimentRepository experimentRepository;
        private final WorkspaceRepository workspaceRepository;
        private final WorkspaceMemberRepository workspaceMemberRepository;

        public ExperimentHomeResponse createExperiment(
                        CreateExperimentRequest request) {

                Workspace workspace = workspaceRepository
                                .findById(request.getWorkspaceId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Workspace not found"));

                WorkspaceMember member = workspaceMemberRepository
                                .findByIdAndWorkspace_Id(
                                                request.getMemberId(),
                                                request.getWorkspaceId())
                                .orElseThrow(() -> new RuntimeException(
                                                "Workspace member does not belong to workspace"));

                Experiment experiment = Experiment.builder()
                                .workspace(workspace)
                                .createdBy(member)
                                .name(request.getName().trim())
                                .description(request.getDescription())
                                .taskType(request.getTaskType())

                                .status(ExperimentStatus.DRAFT)

                                .datasetReady(ConfigStatus.NOT_CONFIGURED)
                                .modelReady(ModelStatus.NOT_CONFIGURED)
                                .inferenceReady(InferenceStatus.NOT_CONFIGURED)

                                .build();

                Experiment savedExperiment = experimentRepository
                                .save(experiment);

                return toResponse(savedExperiment);
        }

        private ExperimentHomeResponse toResponse(
                        Experiment experiment) {

                return ExperimentHomeResponse.builder()
                                .workspaceId(
                                                experiment.getWorkspace().getId())

                                .experimentId(
                                                experiment.getId())

                                .name(
                                                experiment.getName())

                                .description(
                                                experiment.getDescription())

                                .taskType(
                                                experiment.getTaskType())

                                .status(
                                                experiment.getStatus())

                                .datasetReady(
                                                experiment.getDatasetReady())

                                .modelReady(
                                                experiment.getModelReady())

                                .inferenceReady(
                                                experiment.getInferenceReady())

                                .createdBy(
                                                experiment.getCreatedBy().getUsername())

                                .createdAt(
                                                experiment.getCreatedAt())

                                .updatedAt(
                                                experiment.getUpdatedAt())

                                .build();
        }
}