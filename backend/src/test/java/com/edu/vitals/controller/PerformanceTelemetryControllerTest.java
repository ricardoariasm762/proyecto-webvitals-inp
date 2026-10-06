package com.edu.vitals.controller;

import com.edu.vitals.domain.PerformanceLog;
import com.edu.vitals.domain.dto.OptimizationRecommendationResponse;
import com.edu.vitals.domain.dto.PerformanceTelemetryRequest;
import com.edu.vitals.service.PerformanceAuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PerformanceTelemetryController.class)
class PerformanceTelemetryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PerformanceAuditService performanceAuditService;

    @Test
    void testEvaluateTelemetry() throws Exception {
        PerformanceTelemetryRequest request = PerformanceTelemetryRequest.builder()
                .sessionId("test-session")
                .urlPath("/analytics")
                .longTaskDurationMs(100.0f)
                .blockingTimeMs(80.0f)
                .domNodeCount(1200.0f)
                .eventLoopLagMs(25.0f)
                .build();

        OptimizationRecommendationResponse response = OptimizationRecommendationResponse.builder()
                .predictedInpMs(180.5f)
                .vitalsCategory("GOOD")
                .architecturalAdvice("Presupuesto de fotogramas óptimo.")
                .offloadToWorker(false)
                .yieldMainThread(false)
                .build();

        when(performanceAuditService.auditPerformance(any(PerformanceTelemetryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/vitals/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.predictedInpMs").value(180.5))
                .andExpect(jsonPath("$.vitalsCategory").value("GOOD"))
                .andExpect(jsonPath("$.offloadToWorker").value(false))
                .andExpect(jsonPath("$.yieldMainThread").value(false));
    }

    @Test
    void testGetSessionMetrics() throws Exception {
        PerformanceLog log = PerformanceLog.builder()
                .id(1L)
                .sessionId("sess-100")
                .urlPath("/reports")
                .longTaskDurationMs(50.0f)
                .blockingTimeMs(30.0f)
                .domNodeCount(900.0f)
                .eventLoopLagMs(10.0f)
                .predictedInpMs(95.0f)
                .vitalsStatus("GOOD")
                .optimizationApplied(false)
                .timestamp(LocalDateTime.now())
                .build();

        when(performanceAuditService.getMetricsBySessionId("sess-100"))
                .thenReturn(Collections.singletonList(log));

        mockMvc.perform(get("/api/vitals/metrics/session/sess-100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sessionId").value("sess-100"))
                .andExpect(jsonPath("$[0].vitalsStatus").value("GOOD"));
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/vitals/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").isNotEmpty());
    }
}
