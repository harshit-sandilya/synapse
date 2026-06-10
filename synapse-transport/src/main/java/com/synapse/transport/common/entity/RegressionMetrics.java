package com.synapse.transport.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "regression_metrics", indexes = {
        @Index(name = "idx_regression_metrics_experiment", columnList = "experiment_id")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RegressionMetrics extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experiment_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_regression_metrics_experiment"))
    private Experiment experiment;

    @Column(name = "mse")
    private Double mse;

    @Column(name = "rmse")
    private Double rmse;

    @Column(name = "mae")
    private Double mae;

    @Column(name = "r2_score")
    private Double r2Score;
}