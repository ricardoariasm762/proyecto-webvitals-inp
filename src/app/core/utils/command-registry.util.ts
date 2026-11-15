export interface CommandMetadata {
  command: string;
  description: string;
  usage: string;
}

export class CommandRegistry {
  private static readonly COMMANDS: CommandMetadata[] = [
    {
      command: 'scheduler.yield()',
      description: 'Inserts cooperative microtask yield checkpoints to avoid long task penalties',
      usage: 'execute_patch --strategy=scheduler.yield()'
    },
    {
      command: 'worker',
      description: 'Offloads CPU-heavy loops to WebWorker#03 preserving 60 FPS frame rate',
      usage: 'worker'
    },
    {
      command: 'reset',
      description: 'Flushes all telemetry metrics and resets benchmark sliders to zero',
      usage: 'reset'
    },
    {
      command: 'clear',
      description: 'Clears all messages and execution logs from the terminal container',
      usage: 'clear'
    }
  ];

  public static listCommands(): CommandMetadata[] {
    return this.COMMANDS;
  }

  public static isRecognized(rawCommand: string): boolean {
    const trimmed = rawCommand.trim().toLowerCase();
    return this.COMMANDS.some((c) => trimmed.includes(c.command.toLowerCase()));
  }
}
