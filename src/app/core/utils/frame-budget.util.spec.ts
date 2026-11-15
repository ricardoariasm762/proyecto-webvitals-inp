import { describe, it, expect } from 'vitest';
import { calculateFrameDrops, classifyFrameRate } from './frame-budget.util';

describe('frame-budget.util', () => {
  it('should calculate zero frame drops within nominal 16.67ms budget', () => {
    expect(calculateFrameDrops(12.0)).toBe(0);
    expect(calculateFrameDrops(16.67)).toBe(0);
  });

  it('should calculate dropped frames for long blocking tasks', () => {
    expect(calculateFrameDrops(66.8)).toBe(4);
    expect(calculateFrameDrops(100.0)).toBe(5);
  });

  it('should classify frame rate thresholds accurately', () => {
    expect(classifyFrameRate(60)).toBe('STABLE');
    expect(classifyFrameRate(45)).toBe('JANK');
    expect(classifyFrameRate(15)).toBe('CRITICAL');
  });
});
