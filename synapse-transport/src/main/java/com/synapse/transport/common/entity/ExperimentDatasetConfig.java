package com.synapse.transport.common.entity;

import com.synapse.transport.common.enums.DatasetProvider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "experiment_data_configs", indexes = {
        @Index(name = "idx_data_config_experiment", columnList = "experiment_id"),
        @Index(name = "idx_data_config_provider", columnList = "dataset_provider")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExperimentDatasetConfig extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experiment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_data_config_experiment"))
    private Experiment experiment;

    @Enumerated(EnumType.STRING)
    @Column(name = "dataset_provider", nullable = false)
    private DatasetProvider datasetProvider;

    @Column(name = "dataset_name", nullable = false)
    private String datasetName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dataset_artifact_id", foreignKey = @ForeignKey(name = "fk_data_config_dataset_artifact"))
    private Artifact datasetArtifact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dataset_config_artifact_id", foreignKey = @ForeignKey(name = "fk_data_config_dataset_config_artifact"))
    private Artifact datasetConfigArtifact;

    @Column(name = "train_sample_count", nullable = true)
    private Integer trainSampleCount;

    @Column(name = "test_sample_count", nullable = true)
    private Integer testSampleCount;

    @Column(name = "input_shape", nullable = true)
    private String inputShape;

    @Column(name = "output_shape", nullable = true)
    private String outputShape;

    @Column(name = "last_validation_error", nullable = true, length = 2000)
    private String lastValidationError;
}