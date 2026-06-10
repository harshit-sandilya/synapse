package com.synapse.transport.common.entity;

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
@Table(name = "experiment_inference_configs", indexes = {
        @Index(name = "idx_inference_config_experiment", columnList = "experiment_id"),
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExperimentInferenceConfig extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experiment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_inference_config_experiment"))
    private Experiment experiment;

    @Column(name = "sample_number", nullable = true)
    private Integer sampleNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inference_artifact_id", foreignKey = @ForeignKey(name = "fk_inference_artifact"))
    private Artifact inferenceArtifact;

    @Column(name = "last_inference_error", nullable = true, length = 2000)
    private String lastInferenceError;
}
