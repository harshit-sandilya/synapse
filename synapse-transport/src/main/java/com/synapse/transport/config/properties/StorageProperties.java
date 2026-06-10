package com.synapse.transport.config.properties;

import lombok.Getter;
import lombok.Setter;

import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "infra.storage")
public class StorageProperties {
    private Integer presignedUrlExpiryMinutes;
}