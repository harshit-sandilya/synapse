package com.synapse.transport.config.minio;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.synapse.transport.config.properties.MinioProperties;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MinioBucketInitializer implements CommandLineRunner {
    private final MinioClient minioClient;
    private final MinioProperties properties;

    @Override
    public void run(String... args)
            throws Exception {

        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                        .bucket(properties.getBucket())
                        .build());

        if (!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(properties.getBucket())
                            .build());
        }
    }
}