package com.synapse.transport.feature.model.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.synapse.transport.feature.model.dto.request.RunTrainingRequest;
import com.synapse.transport.feature.model.dto.request.SaveModelConfigRequest;
import com.synapse.transport.feature.model.dto.response.RunTrainingResponse;
import com.synapse.transport.feature.model.dto.response.SaveModelConfigResponse;

import com.synapse.transport.feature.model.service.ExperimentModelService;

import com.synapse.transport.exception.dto.ApiSuccessResponse;
import com.synapse.transport.util.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/model")
@RequiredArgsConstructor
public class ModelController {

        private final ExperimentModelService experimentModelService;

        @PostMapping
        public ResponseEntity<ApiSuccessResponse<SaveModelConfigResponse>> saveModelConfig(
                        @Validated @RequestBody SaveModelConfigRequest request) {

                SaveModelConfigResponse response = experimentModelService.saveModelConfig(
                                request);

                return ResponseUtil.success(
                                "Model configuration saved successfully",
                                response,
                                HttpStatus.CREATED);
        }

        @PostMapping("/train")
        public ResponseEntity<ApiSuccessResponse<RunTrainingResponse>> runTraining(
                        @Valid @RequestBody RunTrainingRequest request) {

                RunTrainingResponse response = experimentModelService.runTraining(
                                request);

                return ResponseUtil.success(
                                "Training job queued successfully",
                                response,
                                HttpStatus.OK);
        }
}