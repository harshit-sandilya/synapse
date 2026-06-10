package com.synapse.transport.feature.experiment.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.synapse.transport.exception.dto.ApiSuccessResponse;
import com.synapse.transport.util.ResponseUtil;
import com.synapse.transport.feature.experiment.dto.request.CreateExperimentRequest;
import com.synapse.transport.feature.experiment.dto.response.*;
import com.synapse.transport.feature.experiment.service.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/experiment")
@RequiredArgsConstructor
@Validated
public class ExperimentController {

        private final ExperimentCreationService experimentCreationService;

        private final ExperimentHomeViewService experimentHomeService;
        private final ExperimentDatasetViewService experimentDatasetService;
        private final ExperimentModelViewService experimentModelService;
        private final ExperimentMetricsViewService experimentMetricsService;
        private final ExperimentTelemetryViewService experimentTelemetryService;
        private final ExperimentInferenceViewService experimentInferenceService;

        @PostMapping
        public ResponseEntity<ApiSuccessResponse<ExperimentHomeResponse>> createExperiment(
                        @Valid @RequestBody CreateExperimentRequest request) {

                ExperimentHomeResponse response = experimentCreationService.createExperiment(request);

                return ResponseUtil.success(
                                "Experiment created successfully",
                                response,
                                HttpStatus.CREATED);
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiSuccessResponse<ExperimentHomeResponse>> getExperiment(
                        @PathVariable UUID id) {

                ExperimentHomeResponse response = experimentHomeService.getHome(id);

                return ResponseUtil.success(
                                "Experiment fetched successfully",
                                response);
        }

        @GetMapping("/{id}/dataset")
        public ResponseEntity<ApiSuccessResponse<ExperimentDatasetResponse>> getDataset(
                        @PathVariable UUID id) {

                ExperimentDatasetResponse response = experimentDatasetService.getDataset(id);

                return ResponseUtil.success(
                                "Dataset fetched successfully",
                                response);
        }

        @GetMapping("/{id}/model")
        public ResponseEntity<ApiSuccessResponse<ExperimentModelResponse>> getModel(
                        @PathVariable UUID id) {

                ExperimentModelResponse response = experimentModelService.getModel(id);

                return ResponseUtil.success(
                                "Model fetched successfully",
                                response);
        }

        @GetMapping("/{id}/metrics")
        public ResponseEntity<ApiSuccessResponse<ExperimentMetricsResponse>> getMetrics(
                        @PathVariable UUID id) {

                ExperimentMetricsResponse response = experimentMetricsService.getMetrics(id);

                return ResponseUtil.success(
                                "Metrics fetched successfully",
                                response);
        }

        @GetMapping("/{id}/telemetry")
        public ResponseEntity<ApiSuccessResponse<ExperimentTelemetryResponse>> getTelemetry(
                        @PathVariable UUID id) {

                ExperimentTelemetryResponse response = experimentTelemetryService.getTelemetry(id);

                return ResponseUtil.success(
                                "Telemetry fetched successfully",
                                response);
        }

        @GetMapping("/{id}/inference")
        public ResponseEntity<ApiSuccessResponse<ExperimentInferenceResponse>> getInference(
                        @PathVariable UUID id) {

                ExperimentInferenceResponse response = experimentInferenceService.getInference(id);

                return ResponseUtil.success(
                                "Inference fetched successfully",
                                response);
        }
}