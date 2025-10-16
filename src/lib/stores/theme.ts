import { browser } from '$app/environment'
import { derived, writable } from 'svelte/store'

// Theme types
export type Theme = 'light' | 'dark' | 'auto'
export type ColorScheme = 'light' | 'dark'

// Theme configuration
export interface ThemeConfig {
  name: string
  displayName: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
    info: string
  }
}

// Predefined themes - Light mode only
export const themes: Record<ColorScheme, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#8B5CF6',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    },
  },
}

// Theme store - Fixed to light mode
const themeStore = writable<Theme>('light')
const systemColorScheme = writable<ColorScheme>('light')

// Current effective theme (resolved from auto)
export const currentTheme = derived([themeStore, systemColorScheme], ([theme, systemScheme]) => {
  if (theme === 'auto') {
    return systemScheme
  }
  return theme as ColorScheme
})

// Current theme configuration
export const themeConfig = derived(currentTheme, (scheme) => themes[scheme])

// Theme management class
export class ThemeManager {
  private static instance: ThemeManager
  private store = themeStore
  private systemStore = systemColorScheme

  private constructor() {
    if (browser) {
      this.initializeTheme()
      this.setupSystemThemeListener()
    }
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  // Initialize theme - Fixed to light mode
  private initializeTheme(): void {
    // Always set to light mode, ignore localStorage
    this.store.set('light')
    this.systemStore.set('light')
  }

  // Setup listener for system theme changes - Disabled
  private setupSystemThemeListener(): (() => void) | void {
    // System theme listener disabled - always use light mode
    return undefined
  }

  // Update system color scheme - Disabled
  private updateSystemColorScheme(): void {
    // Always use light mode
    this.systemStore.set('light')
  }

  // Set theme - Disabled, always use light mode
  public setTheme(theme: Theme): void {
    // Always set to light mode regardless of input
    this.store.set('light')

    if (browser) {
      localStorage.setItem('theme', 'light')
      this.applyTheme()
    }
  }

  // Get current theme
  public getTheme(): Theme {
    let currentTheme: Theme
    this.store.subscribe((theme) => {
      currentTheme = theme
    })()
    return currentTheme!
  }

  // Apply theme to document
  public applyTheme(): void {
    if (!browser) return

    const scheme = this.getEffectiveColorScheme()
    const config = themes[scheme]

    // Apply CSS custom properties
    const root = document.documentElement

    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', scheme)
    root.setAttribute('data-color-scheme', scheme)

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', config.colors.primary)
    }
  }

  // Get effective color scheme
  public getEffectiveColorScheme(): ColorScheme {
    const theme = this.getTheme()
    if (theme === 'auto') {
      let systemScheme: ColorScheme
      this.systemStore.subscribe((scheme) => {
        systemScheme = scheme
      })()
      return systemScheme!
    }
    return theme as ColorScheme
  }

  // Toggle between light and dark - Disabled
  public toggleTheme(): void {
    // Theme toggle disabled - always use light mode
    this.setTheme('light')
  }

  // Get available themes - Only light mode available
  public getAvailableThemes(): Array<{ value: Theme; label: string }> {
    return [{ value: 'light', label: 'Light' }]
  }

  // Subscribe to theme changes
  public subscribe(callback: (theme: Theme) => void) {
    return this.store.subscribe(callback)
  }

  // Subscribe to current effective theme
  public subscribeToCurrent(callback: (scheme: ColorScheme) => void) {
    return currentTheme.subscribe(callback)
  }

  // Subscribe to theme config
  public subscribeToConfig(callback: (config: ThemeConfig) => void) {
    return themeConfig.subscribe(callback)
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance()

// Apply theme on initialization
if (browser) {
  themeManager.applyTheme()

  // Apply theme when it changes
  currentTheme.subscribe(() => {
    themeManager.applyTheme()
  })
}

// CSS custom properties for theme colors - Light mode only
export const themeCSS = `
	:root {
		--color-primary: ${themes.light.colors.primary};
		--color-secondary: ${themes.light.colors.secondary};
		--color-accent: ${themes.light.colors.accent};
		--color-background: ${themes.light.colors.background};
		--color-surface: ${themes.light.colors.surface};
		--color-text: ${themes.light.colors.text};
		--color-text-secondary: ${themes.light.colors.textSecondary};
		--color-border: ${themes.light.colors.border};
		--color-success: ${themes.light.colors.success};
		--color-warning: ${themes.light.colors.warning};
		--color-error: ${themes.light.colors.error};
		--color-info: ${themes.light.colors.info};
	}
`

// Utility functions for components
export function useTheme() {
  return {
    subscribe: themeManager.subscribe.bind(themeManager) as typeof themeManager.subscribe,
    subscribeToCurrent: themeManager.subscribeToCurrent.bind(
      themeManager,
    ) as typeof themeManager.subscribeToCurrent,
    subscribeToConfig: themeManager.subscribeToConfig.bind(
      themeManager,
    ) as typeof themeManager.subscribeToConfig,
    setTheme: themeManager.setTheme.bind(themeManager) as typeof themeManager.setTheme,
    toggleTheme: themeManager.toggleTheme.bind(themeManager) as typeof themeManager.toggleTheme,
    getTheme: themeManager.getTheme.bind(themeManager) as typeof themeManager.getTheme,
    getAvailableThemes: themeManager.getAvailableThemes.bind(
      themeManager,
    ) as typeof themeManager.getAvailableThemes,
  }
}

// Reactive stores for light mode only
export const isLight = derived(currentTheme, (scheme) => scheme === 'light')
