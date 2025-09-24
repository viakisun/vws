import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

// Theme types
export type Theme = "light" | "dark" | "auto";
export type ColorScheme = "light" | "dark";

// Theme configuration
export interface ThemeConfig {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// Predefined themes
export const themes: Record<ColorScheme, ThemeConfig> = {
  light: {
    name: "light",
    displayName: "Light",
    colors: {
      primary: "#3B82F6",
      secondary: "#6B7280",
      accent: "#8B5CF6",
      background: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      textSecondary: "#6B7280",
      border: "#E5E7EB",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#06B6D4",
    },
  },
  dark: {
    name: "dark",
    displayName: "Dark",
    colors: {
      primary: "#60A5FA",
      secondary: "#9CA3AF",
      accent: "#A78BFA",
      background: "#111827",
      surface: "#1F2937",
      text: "#F9FAFB",
      textSecondary: "#D1D5DB",
      border: "#374151",
      success: "#34D399",
      warning: "#FBBF24",
      error: "#F87171",
      info: "#22D3EE",
    },
  },
};

// Theme store
const themeStore = writable<Theme>("auto");
const systemColorScheme = writable<ColorScheme>("light");

// Current effective theme (resolved from auto)
export const currentTheme = derived(
  [themeStore, systemColorScheme],
  ([theme, systemScheme]) => {
    if (theme === "auto") {
      return systemScheme;
    }
    return theme as ColorScheme;
  },
);

// Current theme configuration
export const themeConfig = derived(currentTheme, (scheme) => themes[scheme]);

// Theme management class
export class ThemeManager {
  private static instance: ThemeManager;
  private store = themeStore;
  private systemStore = systemColorScheme;

  private constructor() {
    if (browser) {
      this.initializeTheme();
      this.setupSystemThemeListener();
    }
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Initialize theme from localStorage and system preference
  private initializeTheme(): void {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
      this.store.set(savedTheme);
    }

    // Get system color scheme
    this.updateSystemColorScheme();
  }

  // Setup listener for system theme changes
  private setupSystemThemeListener(): (() => void) | void {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      this.updateSystemColorScheme();
    };

    mediaQuery.addEventListener("change", handleChange);

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }

  // Update system color scheme
  private updateSystemColorScheme(): void {
    if (browser) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.systemStore.set(isDark ? "dark" : "light");
    }
  }

  // Set theme
  public setTheme(theme: Theme): void {
    this.store.set(theme);

    if (browser) {
      localStorage.setItem("theme", theme);
      this.applyTheme();
    }
  }

  // Get current theme
  public getTheme(): Theme {
    let currentTheme: Theme;
    this.store.subscribe((theme) => {
      currentTheme = theme;
    })();
    return currentTheme!;
  }

  // Apply theme to document
  public applyTheme(): void {
    if (!browser) return;

    const scheme = this.getEffectiveColorScheme();
    const config = themes[scheme];

    // Apply CSS custom properties
    const root = document.documentElement;

    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Set data attribute for CSS selectors
    root.setAttribute("data-theme", scheme);
    root.setAttribute("data-color-scheme", scheme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", config.colors.primary);
    }
  }

  // Get effective color scheme
  public getEffectiveColorScheme(): ColorScheme {
    const theme = this.getTheme();
    if (theme === "auto") {
      let systemScheme: ColorScheme;
      this.systemStore.subscribe((scheme) => {
        systemScheme = scheme;
      })();
      return systemScheme!;
    }
    return theme as ColorScheme;
  }

  // Toggle between light and dark
  public toggleTheme(): void {
    const current = this.getEffectiveColorScheme();
    const newTheme = current === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  // Get available themes
  public getAvailableThemes(): Array<{ value: Theme; label: string }> {
    return [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
      { value: "auto", label: "Auto (System)" },
    ];
  }

  // Subscribe to theme changes
  public subscribe(callback: (theme: Theme) => void) {
    return this.store.subscribe(callback);
  }

  // Subscribe to current effective theme
  public subscribeToCurrent(callback: (scheme: ColorScheme) => void) {
    return currentTheme.subscribe(callback);
  }

  // Subscribe to theme config
  public subscribeToConfig(callback: (config: ThemeConfig) => void) {
    return themeConfig.subscribe(callback);
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Apply theme on initialization
if (browser) {
  themeManager.applyTheme();

  // Apply theme when it changes
  currentTheme.subscribe(() => {
    themeManager.applyTheme();
  });
}

// CSS custom properties for theme colors
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

	[data-theme="dark"] {
		--color-primary: ${themes.dark.colors.primary};
		--color-secondary: ${themes.dark.colors.secondary};
		--color-accent: ${themes.dark.colors.accent};
		--color-background: ${themes.dark.colors.background};
		--color-surface: ${themes.dark.colors.surface};
		--color-text: ${themes.dark.colors.text};
		--color-text-secondary: ${themes.dark.colors.textSecondary};
		--color-border: ${themes.dark.colors.border};
		--color-success: ${themes.dark.colors.success};
		--color-warning: ${themes.dark.colors.warning};
		--color-error: ${themes.dark.colors.error};
		--color-info: ${themes.dark.colors.info};
	}
`;

// Utility functions for components
export function useTheme() {
  return {
    subscribe: themeManager.subscribe.bind(themeManager),
    subscribeToCurrent: themeManager.subscribeToCurrent.bind(themeManager),
    subscribeToConfig: themeManager.subscribeToConfig.bind(themeManager),
    setTheme: themeManager.setTheme.bind(themeManager),
    toggleTheme: themeManager.toggleTheme.bind(themeManager),
    getTheme: themeManager.getTheme.bind(themeManager),
    getAvailableThemes: themeManager.getAvailableThemes.bind(themeManager),
  };
}

// Reactive stores for common theme checks
export const isDark = derived(currentTheme, (scheme) => scheme === "dark");
export const isLight = derived(currentTheme, (scheme) => scheme === "light");
export const isAuto = derived(themeStore, (theme) => theme === "auto");
