package com.synapse.transport.exception.dto;

import com.synapse.transport.common.enums.JobType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueJob<T> {
    private String timestamp;
    private String message;
    private JobType jobType;
    private T payload;
}
