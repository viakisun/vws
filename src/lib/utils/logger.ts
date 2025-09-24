/**
 * Safe logger wrapper that delegates to console by default
 * This allows for future logging infrastructure changes without code modifications
 */
export const logger = {
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  trace: (...args: unknown[]) => console.trace(...args),
} as const;

export default logger;
