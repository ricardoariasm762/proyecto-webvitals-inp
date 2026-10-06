package com.edu.vitals.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "performance_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private String urlPath;

    @Column(nullable = false)
    private Float longTaskDurationMs;

    @Column(nullable = false)
    private Float blockingTimeMs;

    @Column(nullable = false)
    private Float domNodeCount;

    @Column(nullable = false)
    private Float eventLoopLagMs;

    @Column(nullable = false)
    private Float predictedInpMs;

    @Column(nullable = false)
    private String vitalsStatus;

    @Column(nullable = false)
    @Builder.Default
    private Boolean optimizationApplied = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
