import { logger } from '$lib/utils/logger';
/**
 * Safe logger wrapper that delegates to console by default
 * This allows for future logging infrastructure changes without code modifications
 */
export const logger = {
  log: (...args: unknown[]) => logger.log(...args),
  info: (...args: unknown[]) => logger.info(...args),
  warn: (...args: unknown[]) => logger.warn(...args),
  error: (...args: unknown[]) => logger.error(...args),
  debug: (...args: unknown[]) => logger.debug(...args),
  trace: (...args: unknown[]) => logger.trace(...args)
} as const;

export default logger;
