package com.synapse.transport.feature.workspace.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.synapse.transport.exception.dto.ApiSuccessResponse;
import com.synapse.transport.feature.workspace.dto.request.WorkspaceConnectionRequest;
import com.synapse.transport.feature.workspace.dto.response.ExperimentSummaryResponse;
import com.synapse.transport.feature.workspace.dto.response.WorkspaceConnectionResponse;
import com.synapse.transport.feature.workspace.service.WorkspaceExperimentService;
import com.synapse.transport.feature.workspace.service.WorkspaceService;
import com.synapse.transport.util.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
@Validated
public class WorkspaceController {
    private final WorkspaceService workspaceService;
    private final WorkspaceExperimentService experimentService;

    @PostMapping("/connect")
    public ResponseEntity<ApiSuccessResponse<WorkspaceConnectionResponse>> connect(
            @Valid @RequestBody WorkspaceConnectionRequest request) {

        WorkspaceConnectionResponse response = workspaceService.connect(request);
        return ResponseUtil.success(
                "Workspace connected successfully",
                response,
                HttpStatus.OK);
    }

    @GetMapping("/{id}/experiments")
    public ResponseEntity<ApiSuccessResponse<List<ExperimentSummaryResponse>>> getMethodName(@PathVariable UUID id) {
        List<ExperimentSummaryResponse> response = experimentService.getWorkspaceExperiments(id);
        return ResponseUtil.success(
                "Workspace experiments fetched successfully",
                response,
                HttpStatus.OK);
    }
}
