/**
 * Environment-aware logger with filtering capabilities
 * Filters logs based on environment and log level
 */

// Log levels (higher number = more verbose)
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const

// Environment-specific log configurations
const LOG_CONFIG = {
  development: {
    level: LOG_LEVELS.ERROR, // Only show errors in dev
    showDbConnections: false,
    showApiRequests: true,
    showSelectStarWarnings: false, // Hide SELECT * warnings
  },
  production: {
    level: LOG_LEVELS.WARN, // Show warnings and errors in prod
    showDbConnections: false,
    showApiRequests: false,
    showSelectStarWarnings: true,
  },
  test: {
    level: LOG_LEVELS.ERROR,
    showDbConnections: false,
    showApiRequests: false,
    showSelectStarWarnings: false,
  },
} as const

const currentEnv = (process.env.NODE_ENV as keyof typeof LOG_CONFIG) || 'development'
const config = LOG_CONFIG[currentEnv]

function shouldLog(level: keyof typeof LOG_LEVELS): boolean {
  return LOG_LEVELS[level] <= config.level
}

function createLogFunction(
  level: keyof typeof LOG_LEVELS,
  consoleMethod: (...args: unknown[]) => void,
) {
  return (...args: unknown[]) => {
    if (shouldLog(level)) {
      consoleMethod(...args)
    }
  }
}

export const logger = {
  log: createLogFunction('INFO', console.log),
  info: createLogFunction('INFO', console.info),
  warn: createLogFunction('WARN', console.warn),
  error: createLogFunction('ERROR', console.error),
  debug: createLogFunction('DEBUG', console.debug),
  trace: createLogFunction('TRACE', console.trace),

  // Special loggers for specific concerns
  db: {
    connection: (...args: unknown[]) => {
      if (config.showDbConnections) {
        console.debug('🔗', ...args)
      }
    },
    query: (...args: unknown[]) => {
      if (config.showDbConnections) {
        console.debug('📊', ...args)
      }
    },
  },

  api: {
    request: (...args: unknown[]) => {
      if (config.showApiRequests) {
        console.info('🌐', ...args)
      }
    },
    response: (...args: unknown[]) => {
      if (config.showApiRequests) {
        console.info('✅', ...args)
      }
    },
  },

  selectStar: (...args: unknown[]) => {
    if (config.showSelectStarWarnings) {
      console.warn('⚠️', ...args)
    }
  },
} as const

export default logger
