export type GrpcConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
export type SocketConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'RECONNECTING';

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

export const INP_THRESHOLDS = {
  GOOD_MAX: 200.0,
  NEEDS_IMPROVEMENT_MAX: 500.0,
  FRAME_BUDGET_60FPS: 16.67
} as const;

export const EVENT_LOOP_THRESHOLDS = {
  LONG_TASK_LIMIT: 50.0,
  WARNING_LAG_LIMIT: 25.0,
  CRITICAL_LAG_LIMIT: 100.0
} as const;
