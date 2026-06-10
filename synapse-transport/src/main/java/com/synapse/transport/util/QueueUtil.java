package com.synapse.transport.util;

import java.time.LocalDateTime;

import com.synapse.transport.common.enums.JobType;
import com.synapse.transport.exception.dto.QueueJob;

public class QueueUtil {
    public static <T> QueueJob<T> createJobEntry(String message, T payload, JobType jobType) {
        QueueJob<T> job = QueueJob.<T>builder()
                .timestamp(LocalDateTime.now().toString())
                .message(message)
                .payload(payload)
                .jobType(jobType)
                .build();
        return job;
    }
}
