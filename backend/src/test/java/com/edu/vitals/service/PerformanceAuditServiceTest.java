package com.edu.vitals.service;

import com.edu.vitals.domain.PerformanceLog;
import com.edu.vitals.domain.dto.OptimizationRecommendationResponse;
import com.edu.vitals.domain.dto.PerformanceTelemetryRequest;
import com.edu.vitals.ml.InpInferenceEngine;
import com.edu.vitals.repository.PerformanceLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PerformanceAuditServiceTest {

    @Mock
    private InpInferenceEngine inferenceEngine;

    @Mock
    private PerformanceLogRepository performanceLogRepository;

    @InjectMocks
    private PerformanceAuditService performanceAuditService;

    @Test
    void testAuditPerformance_Good() {
        PerformanceTelemetryRequest request = PerformanceTelemetryRequest.builder()
                .sessionId("sess-1")
                .urlPath("/home")
                .longTaskDurationMs(20.0f)
                .blockingTimeMs(15.0f)
                .domNodeCount(500.0f)
                .eventLoopLagMs(5.0f)
                .build();

        when(inferenceEngine.predictInp(20.0f, 15.0f, 500.0f, 5.0f)).thenReturn(120.0f);
        when(performanceLogRepository.save(any(PerformanceLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OptimizationRecommendationResponse response = performanceAuditService.auditPerformance(request);

        assertEquals(120.0f, response.getPredictedInpMs());
        assertEquals("GOOD", response.getVitalsCategory());
        assertFalse(response.isOffloadToWorker());
        assertFalse(response.isYieldMainThread());
        assertTrue(response.getArchitecturalAdvice().contains("Presupuesto de fotogramas óptimo"));

        verify(performanceLogRepository, times(1)).save(any(PerformanceLog.class));
    }

    @Test
    void testAuditPerformance_NeedsImprovement() {
        PerformanceTelemetryRequest request = PerformanceTelemetryRequest.builder()
                .sessionId("sess-2")
                .urlPath("/dashboard")
                .longTaskDurationMs(150.0f)
                .blockingTimeMs(120.0f)
                .domNodeCount(1800.0f)
                .eventLoopLagMs(40.0f)
                .build();

        when(inferenceEngine.predictInp(150.0f, 120.0f, 1800.0f, 40.0f)).thenReturn(320.0f);
        when(performanceLogRepository.save(any(PerformanceLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OptimizationRecommendationResponse response = performanceAuditService.auditPerformance(request);

        assertEquals(320.0f, response.getPredictedInpMs());
        assertEquals("NEEDS_IMPROVEMENT", response.getVitalsCategory());
        assertFalse(response.isOffloadToWorker());
        assertTrue(response.isYieldMainThread());
        assertTrue(response.getArchitecturalAdvice().contains("requestIdleCallback() o scheduler.yield()"));
    }

    @Test
    void testAuditPerformance_Poor() {
        PerformanceTelemetryRequest request = PerformanceTelemetryRequest.builder()
                .sessionId("sess-3")
                .urlPath("/heavy-grid")
                .longTaskDurationMs(300.0f)
                .blockingTimeMs(400.0f)
                .domNodeCount(4000.0f)
                .eventLoopLagMs(100.0f)
                .build();

        when(inferenceEngine.predictInp(300.0f, 400.0f, 4000.0f, 100.0f)).thenReturn(650.0f);
        when(performanceLogRepository.save(any(PerformanceLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OptimizationRecommendationResponse response = performanceAuditService.auditPerformance(request);

        assertEquals(650.0f, response.getPredictedInpMs());
        assertEquals("POOR", response.getVitalsCategory());
        assertTrue(response.isOffloadToWorker());
        assertTrue(response.isYieldMainThread());
        assertTrue(response.getArchitecturalAdvice().contains("Web Worker desacoplado"));
    }

    @Test
    void testGetMetricsBySessionId() {
        when(performanceLogRepository.findBySessionIdOrderByTimestampAsc("sess-1"))
                .thenReturn(Collections.singletonList(PerformanceLog.builder().sessionId("sess-1").build()));

        List<PerformanceLog> results = performanceAuditService.getMetricsBySessionId("sess-1");

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("sess-1", results.get(0).getSessionId());
    }
}
