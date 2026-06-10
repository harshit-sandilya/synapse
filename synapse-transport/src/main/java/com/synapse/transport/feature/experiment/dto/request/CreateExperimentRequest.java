package com.synapse.transport.feature.experiment.dto.request;

import java.util.UUID;
import com.synapse.transport.common.enums.ExperimentTaskType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExperimentRequest {
    @NotNull(message = "Workspace id is required")
    private UUID workspaceId;

    @NotNull(message = "Workspace member id is required")
    private UUID memberId;

    @NotBlank(message = "Experiment name is required")
    private String name;

    private String description;

    @NotNull(message = "Task type is required")
    private ExperimentTaskType taskType;
}
