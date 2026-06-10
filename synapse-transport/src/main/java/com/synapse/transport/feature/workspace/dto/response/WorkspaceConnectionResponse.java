package com.synapse.transport.feature.workspace.dto.response;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceConnectionResponse {
    private UUID workspaceId;
    private UUID memberId;
    private String workspaceName;
    private String username;
}
