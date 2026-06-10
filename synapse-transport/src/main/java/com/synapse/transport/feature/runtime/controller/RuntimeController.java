package com.synapse.transport.feature.runtime.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.synapse.transport.feature.runtime.dto.request.DataValidationRequest;
import com.synapse.transport.feature.runtime.dto.request.InferenceRequest;
import com.synapse.transport.feature.runtime.dto.request.TrainingEndRequest;
import com.synapse.transport.feature.runtime.dto.request.TrainingStartRequest;
import com.synapse.transport.feature.runtime.dto.response.DataValidationResponse;
import com.synapse.transport.feature.runtime.dto.response.InferenceResponse;
import com.synapse.transport.feature.runtime.dto.response.TrainingEndResponse;
import com.synapse.transport.feature.runtime.dto.response.TrainingStartResponse;
import com.synapse.transport.feature.runtime.service.RuntimeDatasetService;
import com.synapse.transport.feature.runtime.service.RuntimeInferenceService;
import com.synapse.transport.feature.runtime.service.RuntimeModelService;
import com.synapse.transport.exception.dto.ApiSuccessResponse;
import com.synapse.transport.util.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/runtime")
@RequiredArgsConstructor
@Validated
public class RuntimeController {

        private final RuntimeDatasetService runtimeDatasetService;
        private final RuntimeModelService runtimeModelService;
        private final RuntimeInferenceService runtimeInferenceService;

        @PostMapping("/dataset")
        public ResponseEntity<ApiSuccessResponse<DataValidationResponse>> datasetValidationCompleted(
                        @Valid @RequestBody DataValidationRequest request) {

                DataValidationResponse response = runtimeDatasetService
                                .processValidationResult(request);

                return ResponseUtil.success(
                                "Dataset validation processed successfully",
                                response,
                                HttpStatus.OK);
        }

        @PostMapping("/training/start")
        public ResponseEntity<ApiSuccessResponse<TrainingStartResponse>> trainingStarted(
                        @Valid @RequestBody TrainingStartRequest request) {

                TrainingStartResponse response = runtimeModelService.trainingStarted(request);

                return ResponseUtil.success(
                                "Training started",
                                response);
        }

        @PostMapping("/training/end")
        public ResponseEntity<ApiSuccessResponse<TrainingEndResponse>> trainingEnded(
                        @Valid @RequestBody TrainingEndRequest request) {

                TrainingEndResponse response = runtimeModelService.trainingEnded(request);

                return ResponseUtil.success(
                                "Training completed",
                                response);
        }

        @PostMapping("/inference")
        public ResponseEntity<ApiSuccessResponse<InferenceResponse>> inferenceCompleted(
                        @Valid @RequestBody InferenceRequest request) {

                InferenceResponse response = runtimeInferenceService.processInferenceResult(request);

                return ResponseUtil.success(
                                "Inference processed successfully",
                                response,
                                HttpStatus.OK);
        }
}