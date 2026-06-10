package com.synapse.transport.infrastructure.queue;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.synapse.transport.common.enums.JobPriority;
import com.synapse.transport.config.properties.QueueProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RedisActionQueueService implements ActionQueueService {
    private final StringRedisTemplate redisTemplate;
    private final QueueProperties queueProperties;

    @Override
    public void enqueue(JobPriority priority, String payload) {
        String queueName = queueProperties.getActionQueuePrefix() + ":" + priority.name().toLowerCase();
        redisTemplate.opsForList()
                .rightPush(queueName, payload);
    }
}