package com.synapse.transport.infrastructure.storage;

import java.io.InputStream;
import java.util.List;

import tools.jackson.databind.JsonNode;

public interface ObjectStorageService {

    String upload(
            String objectKey,
            InputStream inputStream,
            long size,
            String contentType);

    InputStream download(String objectKey);

    String generatePresignedUrl(String objectKey);

    void delete(String objectKey);

    JsonNode readJson(String objectKey);

    List<JsonNode> readJsonLines(String objectKey);

    JsonNode readLastJsonLine(String objectKey);
}