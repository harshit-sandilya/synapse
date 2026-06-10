package com.synapse.transport.feature.dataset.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.synapse.transport.exception.dto.ApiSuccessResponse;
import com.synapse.transport.feature.dataset.dto.request.SaveDatasetConfigRequest;
import com.synapse.transport.feature.dataset.dto.request.ValidateDatasetRequest;
import com.synapse.transport.feature.dataset.dto.response.SaveDatasetConfigResponse;
import com.synapse.transport.feature.dataset.dto.response.ValidateDatasetResponse;
import com.synapse.transport.feature.dataset.service.DatasetConfigService;
import com.synapse.transport.util.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/dataset")
@RequiredArgsConstructor
@Validated
public class DatasetController {

    private final DatasetConfigService datasetConfigService;

    @PostMapping
    public ResponseEntity<ApiSuccessResponse<SaveDatasetConfigResponse>> saveDatasetConfig(
            @Valid @RequestBody SaveDatasetConfigRequest request) {

        return ResponseUtil.success(
                "Dataset configuration saved successfully",
                datasetConfigService.saveDatasetConfig(request));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiSuccessResponse<ValidateDatasetResponse>> validateDataset(
            @Valid @RequestBody ValidateDatasetRequest request) {

        return ResponseUtil.success(
                "Dataset validation job queued successfully",
                datasetConfigService.validateDataset(request));
    }
}