import { config } from '$lib/utils/config'

function shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  const order = ['debug', 'info', 'warn', 'error']
  return order.indexOf(level) >= order.indexOf(config.logLevel)
}

// Global error handlers (safe outside components)
window.addEventListener('error', (_ev) => {
  if (shouldLog('error')) {
    // logger.error('[error]', ev.error || ev.message)
  }
})
window.addEventListener('unhandledrejection', (_ev) => {
  if (shouldLog('error')) {
    // logger.error('[unhandledrejection]', ev.reason)
  }
})
