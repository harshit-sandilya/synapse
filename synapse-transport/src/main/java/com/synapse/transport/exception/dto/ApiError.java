package com.synapse.transport.exception.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiError {
    private String timestamp;
    private int status;
    private String error;
    private String message;
    private Object details;
    private String path;
}