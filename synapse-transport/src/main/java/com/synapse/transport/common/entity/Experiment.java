package com.synapse.transport.common.entity;

import com.synapse.transport.common.enums.ConfigStatus;
import com.synapse.transport.common.enums.ExperimentStatus;
import com.synapse.transport.common.enums.ExperimentTaskType;
import com.synapse.transport.common.enums.InferenceStatus;
import com.synapse.transport.common.enums.ModelStatus;

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
@Table(name = "experiments", indexes = {
        @Index(name = "idx_experiment_workspace", columnList = "workspace_id"),
        @Index(name = "idx_experiment_status", columnList = "status"),
        @Index(name = "idx_experiment_created_by", columnList = "created_by")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Experiment extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false, foreignKey = @ForeignKey(name = "fk_experiment_workspace"))
    private Workspace workspace;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false)
    private ExperimentTaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ExperimentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "dataset_ready", nullable = false)
    private ConfigStatus datasetReady;

    @Enumerated(EnumType.STRING)
    @Column(name = "model_ready", nullable = false)
    private ModelStatus modelReady;

    @Enumerated(EnumType.STRING)
    @Column(name = "inference_ready", nullable = false)
    private InferenceStatus inferenceReady;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, foreignKey = @ForeignKey(name = "fk_experiment_created_by"))
    private WorkspaceMember createdBy;
}