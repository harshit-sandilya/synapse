package com.synapse.transport.feature.dataset.service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.common.entity.Experiment;
import com.synapse.transport.common.enums.ArtifactType;
import com.synapse.transport.feature.artifact.repository.ArtifactRepository;
import com.synapse.transport.infrastructure.storage.ObjectStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DatasetArtifactService {

    private final ObjectStorageService objectStorageService;
    private final ArtifactRepository artifactRepository;

    public Artifact createJsonArtifact(
            Experiment experiment,
            ArtifactType artifactType,
            String storageKey,
            String jsonContent) {

        byte[] content = jsonContent.getBytes(StandardCharsets.UTF_8);

        objectStorageService.upload(
                storageKey,
                new ByteArrayInputStream(content),
                content.length,
                "application/json");

        Artifact artifact = Artifact.builder()
                .experiment(experiment)
                .artifactType(artifactType)
                .storageKey(storageKey)
                .mimeType("application/json")
                .sizeBytes((long) content.length)
                .build();

        return artifactRepository.save(artifact);
    }

    public Artifact updateJsonArtifact(Artifact artifact, String jsonContent) {
        byte[] bytes = jsonContent.getBytes(StandardCharsets.UTF_8);

        objectStorageService.upload(
                artifact.getStorageKey(),
                new ByteArrayInputStream(bytes),
                bytes.length,
                "application/json");

        artifact.setMimeType("application/json");
        artifact.setSizeBytes((long) bytes.length);

        return artifactRepository.save(artifact);
    }

    public void deleteArtifact(Artifact artifact) {
        objectStorageService.delete(artifact.getStorageKey());
        artifactRepository.delete(artifact);
    }
}