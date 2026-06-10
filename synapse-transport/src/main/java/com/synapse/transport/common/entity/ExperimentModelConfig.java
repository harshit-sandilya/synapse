package com.synapse.transport.common.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "experiment_model_configs", indexes = {
        @Index(name = "idx_model_config_experiment", columnList = "experiment_id"),
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExperimentModelConfig extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experiment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_model_config_experiment"))
    private Experiment experiment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_artifact_id", nullable = false, foreignKey = @ForeignKey(name = "fk_model_ir_artifact"))
    private Artifact modelArtifact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_config_artifact_id", nullable = false, foreignKey = @ForeignKey(name = "fk_model_config_artifact"))
    private Artifact modelConfigArtifact;

    @Column(name = "publisher_topic")
    private String publisherTopic;

    @Column(name = "publisher_service_url")
    private String publisherServiceUrl;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metrics_storage_artifact_id", foreignKey = @ForeignKey(name = "fk_metrics_storage_artifact"))
    private Artifact metricsStorageArtifact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkpoint_storage_artifact_id", foreignKey = @ForeignKey(name = "fk_checkpoint_storage_artifact"))
    private Artifact checkpointStorageArtifact;

    @Column(name = "last_training_error", nullable = true, length = 2000)
    private String lastTrainingError;
}