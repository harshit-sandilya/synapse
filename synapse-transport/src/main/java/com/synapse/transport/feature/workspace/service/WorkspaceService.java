package com.synapse.transport.feature.workspace.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Workspace;
import com.synapse.transport.common.entity.WorkspaceMember;
import com.synapse.transport.feature.workspace.dto.request.WorkspaceConnectionRequest;
import com.synapse.transport.feature.workspace.dto.response.WorkspaceConnectionResponse;
import com.synapse.transport.feature.workspace.repository.WorkspaceMemberRepository;
import com.synapse.transport.feature.workspace.repository.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkspaceService {
        private final WorkspaceRepository workspaceRepository;
        private final WorkspaceMemberRepository workspaceMemberRepository;

        @Transactional
        public WorkspaceConnectionResponse connect(WorkspaceConnectionRequest request) {

                String workspaceName = normalize(request.getWorkspaceName());
                String username = normalize(request.getUsername());

                Workspace workpsace = workspaceRepository
                                .findByName(workspaceName)
                                .orElseGet(() -> createWorkspace(workspaceName));

                WorkspaceMember member = workspaceMemberRepository
                                .findByWorkspaceAndUsername(workpsace, username)
                                .orElseGet(() -> createWorkspaceMember(workpsace, username));

                return WorkspaceConnectionResponse.builder()
                                .workspaceId(workpsace.getId())
                                .memberId(member.getId())
                                .workspaceName(workpsace.getName())
                                .username(member.getUsername())
                                .build();
        }

        private Workspace createWorkspace(String workspaceName) {
                Workspace workspace = Workspace.builder()
                                .name(workspaceName)
                                .build();

                return workspaceRepository.save(workspace);
        }

        private WorkspaceMember createWorkspaceMember(Workspace workspace, String username) {
                WorkspaceMember member = WorkspaceMember.builder()
                                .workspace(workspace)
                                .username(username)
                                .build();

                return workspaceMemberRepository.save(member);
        }

        private String normalize(String value) {
                return value
                                .trim()
                                .toLowerCase();
        }
}
