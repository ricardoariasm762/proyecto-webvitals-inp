package com.edu.vitals.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OptimizationRecommendationResponse {
    private float predictedInpMs;
    private String vitalsCategory;        // GOOD, NEEDS_IMPROVEMENT, POOR
    private String architecturalAdvice;    // Recomendación técnica específica
    private boolean offloadToWorker;       // true si se requiere Web Worker
    private boolean yieldMainThread;       // true si se sugiere scheduler.yield() / requestIdleCallback
}
