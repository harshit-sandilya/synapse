package com.synapse.transport.infrastructure.queue;

import com.synapse.transport.common.enums.JobPriority;

public interface ActionQueueService {
    void enqueue(JobPriority priority, String payload);
}