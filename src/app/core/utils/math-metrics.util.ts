/**
 * Computes arithmetic mean of a numbers array
 */
export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / values.length).toFixed(2));
}

/**
 * Computes maximum peak value in numbers array
 */
export function calculatePeak(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Calculates p75 (75th percentile) recommended by Google Core Web Vitals
 */
export function calculatePercentile(values: number[], percentile: number = 75): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

