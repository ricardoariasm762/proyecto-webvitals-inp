/**
 * Calculates theoretical frame drops based on long task execution duration
 */
export function calculateFrameDrops(durationMs: number, targetBudgetMs: number = 16.67): number {
  if (durationMs <= targetBudgetMs) return 0;
  return Math.floor(durationMs / targetBudgetMs);
}

/**
 * Returns frame rate classification label
 */
export function classifyFrameRate(fps: number): 'STABLE' | 'JANK' | 'CRITICAL' {
  if (fps >= 55) return 'STABLE';
  if (fps >= 30) return 'JANK';
  return 'CRITICAL';
}
