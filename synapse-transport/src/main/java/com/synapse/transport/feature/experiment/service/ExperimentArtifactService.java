package com.synapse.transport.feature.experiment.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.synapse.transport.common.entity.Artifact;
import com.synapse.transport.feature.artifact.repository.ArtifactRepository;
import com.synapse.transport.infrastructure.storage.ObjectStorageService;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
public class ExperimentArtifactService {

        private final ArtifactRepository artifactRepository;
        private final ObjectStorageService storageService;

        public JsonNode readArtifact(
                        Artifact artifact) {

                return storageService.readJson(
                                artifact.getStorageKey());
        }

        public JsonNode readArtifact(
                        UUID artifactId) {

                Artifact artifact = artifactRepository
                                .findById(artifactId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Artifact not found: " + artifactId));

                return readArtifact(
                                artifact);
        }

        public JsonNode readArtifactOrNull(
                        Artifact artifact) {

                if (artifact == null) {
                        return null;
                }

                return readArtifact(artifact);
        }

        public JsonNode readArtifactOrNull(
                        UUID artifactId) {

                Artifact artifact = artifactRepository
                                .findById(artifactId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Artifact not found: " + artifactId));

                return readArtifactOrNull(
                                artifact);
        }
}