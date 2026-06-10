package com.synapse.transport.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "workspace_members", indexes = {
                @Index(name = "idx_workspace_user_workspace", columnList = "workspace_id"),
                @Index(name = "idx_workspace_member_name", columnList = "username")
}, uniqueConstraints = {
                @UniqueConstraint(name = "uk_workspace_user", columnNames = { "workspace_id", "username" })
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WorkspaceMember extends BaseEntity {
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "workspace_id", nullable = false, foreignKey = @ForeignKey(name = "fk_workpsace_user_workspace"))
        private Workspace workspace;

        @Column(nullable = false, length = 255)
        private String username;
}