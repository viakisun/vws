// SVELTE-CHECK CONFIGURATION GUIDE
// =================================

// This file configures svelte-check behavior for different environments

export default {
  // Development: Show all warnings including accessibility
  dev: {
    onwarn: (warning) => {
      // Show all warnings in development
      return warning
    },
  },

  // CI/CD: Allow warnings but don't fail builds
  ci: {
    onwarn: (warning) => {
      // Log warnings but don't fail CI
      console.warn(`[svelte-check] ${warning.code}: ${warning.message}`)
      return warning
    },
  },

  // Production: Strict mode - fail on any warnings
  production: {
    onwarn: (warning) => {
      // Fail on any warnings in production builds
      throw new Error(`Svelte check failed: ${warning.code} - ${warning.message}`)
    },
  },

  // Current configuration: Allow accessibility warnings
  onwarn: (warning) => {
    // Suppress only CSS warnings, allow accessibility warnings
    if (warning.code === 'css-unused-selector') return

    // Allow all other warnings (including accessibility)
    return warning
  },
}
