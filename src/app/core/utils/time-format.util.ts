/**
 * Formats a Date object into HUD-styled military UTC string: YYYY.MM.DD//HH:mm:ss
 */
export function formatHudUtc(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}//${hh}:${min}:${ss}`;
}

/**
 * Formats seconds into an elapsed epoch timer string: +00:mm:ss.SSS
 */
export function formatEpochTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const rawSec = totalSeconds % 60;
  const remSec = rawSec.toFixed(3);
  return `+00:${mins < 10 ? '0' : ''}${mins}:${rawSec < 10 ? '0' : ''}${remSec}`;
}

/**
 * Generates terminal timestamp format: [00:mm:ss.ms]
 */
export function formatTerminalTimestamp(date: Date = new Date()): string {
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, '0');
  return `[00:${mm}:${ss}.${ms}]`;
}

