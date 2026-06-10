package com.synapse.transport.util;

import com.synapse.transport.exception.dto.ApiSuccessResponse;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtil {
    public static <T> ResponseEntity<ApiSuccessResponse<T>> success(String message, T data, HttpStatus status) {
        ApiSuccessResponse<T> response = ApiSuccessResponse.<T>builder()
                .timestamp(LocalDateTime.now().toString())
                .message(message)
                .data(data)
                .build();

        return new ResponseEntity<>(response, status);
    }

    public static <T> ResponseEntity<ApiSuccessResponse<T>> success(String message, T data) {
        return success(message, data, HttpStatus.OK);
    }
}
