export interface PerformanceTelemetryRequest {
  sessionId: string;
  urlPath: string;
  longTaskDurationMs: number;
  blockingTimeMs: number;
  domNodeCount: number;
  eventLoopLagMs: number;
  optimizationApplied?: boolean;
}

export interface OptimizationRecommendationResponse {
  predictedInpMs: number;
  vitalsCategory: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  architecturalAdvice: string;
  offloadToWorker: boolean;
  yieldMainThread: boolean;
}

export interface PerformanceSnapshot {
  timestamp: number;
  eventLoopLagMs: number;
  longTaskDurationMs: number;
  blockingTimeMs: number;
  domNodeCount: number;
  predictedInpMs?: number;
  category?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  mode?: 'IDLE' | 'MAIN_THREAD' | 'WORKER';
}

export interface WorkerMessageRequest {
  type: 'COMPUTE';
  iterations: number;
}

export interface WorkerMessageResponse {
  status: 'done' | 'progress' | 'error';
  durationMs: number;
  primesCount?: number;
  error?: string;
}
