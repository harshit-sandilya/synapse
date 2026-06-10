package com.synapse.transport.feature.workspace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceConnectionRequest {
    @NotBlank(message = "Workspace name is required")
    private String workspaceName;

    @NotBlank(message = "Username is required")
    private String username;
}
