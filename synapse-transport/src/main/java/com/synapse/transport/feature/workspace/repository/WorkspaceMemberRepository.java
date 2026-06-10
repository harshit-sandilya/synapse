package com.synapse.transport.feature.workspace.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import com.synapse.transport.common.entity.Workspace;
import com.synapse.transport.common.entity.WorkspaceMember;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, UUID> {
    Optional<WorkspaceMember> findByWorkspaceAndUsername(Workspace workspace, String username);

    Optional<WorkspaceMember> findByIdAndWorkspace_Id(UUID memberId, UUID workspaceId);
}
