package com.synapse.transport.config.minio;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.synapse.transport.config.properties.MinioProperties;

import io.minio.MinioClient;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class MinioConfig {
    private final MinioProperties properties;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(properties.getEndpoint())
                .credentials(
                        properties.getAccessKey(),
                        properties.getSecretKey())
                .build();
    }
}