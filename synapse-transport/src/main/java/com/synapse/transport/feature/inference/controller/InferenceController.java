package com.synapse.transport.feature.inference.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.synapse.transport.exception.dto.ApiSuccessResponse;
import com.synapse.transport.feature.inference.dto.request.InferenceQueueRequest;
import com.synapse.transport.feature.inference.dto.response.InferenceQueueResponse;
import com.synapse.transport.feature.inference.service.InferenceService;
import com.synapse.transport.util.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/inference")
@RequiredArgsConstructor
@Validated
public class InferenceController {

    private final InferenceService inferenceService;

    @PostMapping
    public ResponseEntity<ApiSuccessResponse<InferenceQueueResponse>> queueInference(
            @Valid @RequestBody InferenceQueueRequest request) {

        return ResponseUtil.success("Inference queued successfully",
                inferenceService.queueInference(request));
    }
}