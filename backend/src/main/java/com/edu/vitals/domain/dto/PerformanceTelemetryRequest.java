package com.edu.vitals.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PerformanceTelemetryRequest {
    private String sessionId;
    private String urlPath;
    private float longTaskDurationMs;
    private float blockingTimeMs;
    private float domNodeCount;
    private float eventLoopLagMs;
    private Boolean optimizationApplied;
}
