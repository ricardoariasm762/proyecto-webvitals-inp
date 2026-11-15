import { describe, it, expect } from 'vitest';
import { calculateAverage, calculatePeak, calculatePercentile } from './math-metrics.util';

describe('math-metrics.util', () => {
  it('should calculate arithmetic mean correctly', () => {
    expect(calculateAverage([10, 20, 30, 40])).toBe(25);
    expect(calculateAverage([])).toBe(0);
  });

  it('should find peak latency accurately', () => {
    expect(calculatePeak([12.5, 95.4, 42.1, 150.0])).toBe(150.0);
    expect(calculatePeak([])).toBe(0);
  });

  it('should calculate 75th percentile for Web Vitals compliance', () => {
    const latencies = [50, 75, 100, 150, 200, 250, 300, 400];
    const p75 = calculatePercentile(latencies, 75);
    expect(p75).toBe(250);
  });
});
