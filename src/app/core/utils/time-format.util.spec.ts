import { describe, it, expect } from 'vitest';
import { formatHudUtc, formatEpochTimer, formatTerminalTimestamp } from './time-format.util';

describe('time-format.util', () => {
  it('should format HUD UTC date string correctly', () => {
    const fixedDate = new Date(Date.UTC(2026, 10, 15, 14, 30, 45));
    const result = formatHudUtc(fixedDate);
    expect(result).toBe('2026.11.15//14:30:45');
  });

  it('should format epoch timer with sub-second precision', () => {
    const result = formatEpochTimer(125.456);
    expect(result).toBe('+00:02:05.456');
  });

  it('should format terminal timestamp enclosed in brackets', () => {
    const fixedDate = new Date(2026, 10, 15, 10, 5, 8, 450);
    const result = formatTerminalTimestamp(fixedDate);
    expect(result).toMatch(/^\[00:\d{2}:\d{2}\.\d{2}\]$/);
  });
});
