package com.synapse.transport.infrastructure.storage;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.synapse.transport.config.properties.MinioProperties;
import com.synapse.transport.config.properties.StorageProperties;

import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.Http.Method;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MinioObjectStorageService implements ObjectStorageService {
        private final MinioClient minioClient;
        private final MinioProperties minioProperties;
        private final StorageProperties storageProperties;
        private final ObjectMapper objectMapper;

        @Override
        public String upload(
                        String objectKey,
                        InputStream inputStream,
                        long size,
                        String contentType) {
                try {
                        minioClient.putObject(PutObjectArgs.builder()
                                        .bucket(minioProperties.getBucket())
                                        .object(objectKey)
                                        .stream(inputStream, size, -1L)
                                        .contentType(contentType)
                                        .build());

                        return objectKey;

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to upload object",
                                        e);
                }
        }

        @Override
        public InputStream download(
                        String objectKey) {
                try {

                        return minioClient.getObject(
                                        GetObjectArgs.builder()
                                                        .bucket(minioProperties.getBucket())
                                                        .object(objectKey)
                                                        .build());

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to download object",
                                        e);
                }
        }

        @Override
        public String generatePresignedUrl(
                        String objectKey) {
                try {

                        return minioClient.getPresignedObjectUrl(
                                        GetPresignedObjectUrlArgs.builder()
                                                        .bucket(minioProperties.getBucket())
                                                        .object(objectKey)
                                                        .method(Method.GET)
                                                        .expiry(
                                                                        storageProperties
                                                                                        .getPresignedUrlExpiryMinutes(),
                                                                        TimeUnit.MINUTES)
                                                        .build());

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to generate presigned url",
                                        e);
                }
        }

        @Override
        public void delete(
                        String objectKey) {
                try {

                        minioClient.removeObject(
                                        RemoveObjectArgs.builder()
                                                        .bucket(minioProperties.getBucket())
                                                        .object(objectKey)
                                                        .build());

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to delete object",
                                        e);
                }
        }

        @Override
        public JsonNode readJson(
                        String objectKey) {

                try (InputStream stream = download(objectKey)) {

                        return objectMapper.readTree(stream);

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to read json object: "
                                                        + objectKey,
                                        e);
                }
        }

        @Override
        public List<JsonNode> readJsonLines(
                        String objectKey) {

                try (
                                InputStream stream = download(objectKey);

                                BufferedReader reader = new BufferedReader(
                                                new InputStreamReader(
                                                                stream))) {

                        List<JsonNode> rows = new ArrayList<>();

                        String line;

                        while ((line = reader.readLine()) != null) {

                                if (line.isBlank()) {
                                        continue;
                                }

                                rows.add(
                                                objectMapper.readTree(
                                                                line));
                        }

                        return rows;

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to read jsonl object: "
                                                        + objectKey,
                                        e);
                }
        }

        @Override
        public JsonNode readLastJsonLine(
                        String objectKey) {

                try (
                                InputStream stream = download(objectKey);

                                BufferedReader reader = new BufferedReader(
                                                new InputStreamReader(
                                                                stream))) {

                        String line;
                        String lastLine = null;

                        while ((line = reader.readLine()) != null) {

                                if (!line.isBlank()) {
                                        lastLine = line;
                                }
                        }

                        if (lastLine == null) {
                                throw new RuntimeException(
                                                "JSONL file is empty: "
                                                                + objectKey);
                        }

                        return objectMapper.readTree(
                                        lastLine);

                } catch (Exception e) {
                        throw new RuntimeException(
                                        "Failed to read last jsonl row: "
                                                        + objectKey,
                                        e);
                }
        }
}