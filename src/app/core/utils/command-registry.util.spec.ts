import { describe, it, expect } from 'vitest';
import { CommandRegistry } from './command-registry.util';

describe('CommandRegistry', () => {
  it('should list all available terminal commands', () => {
    const list = CommandRegistry.listCommands();
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.map((c) => c.command)).toContain('worker');
    expect(list.map((c) => c.command)).toContain('reset');
  });

  it('should recognize valid commands in raw CLI input', () => {
    expect(CommandRegistry.isRecognized('execute_patch --strategy=scheduler.yield()')).toBe(true);
    expect(CommandRegistry.isRecognized('worker')).toBe(true);
    expect(CommandRegistry.isRecognized('clear')).toBe(true);
    expect(CommandRegistry.isRecognized('invalid_random_cmd')).toBe(false);
  });
});

