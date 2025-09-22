<script lang="ts">
  import { themeManager, currentTheme, isDark, isAuto } from '$lib/stores/theme'
  import { onMount } from 'svelte'

  let isOpen = $state(false)
  let currentScheme: string = 'light'
  let isAutoTheme: boolean = false

  // Subscribe to theme changes
  $effect(() => {
    currentTheme.subscribe(scheme => {
      currentScheme = scheme
    })

    isAuto.subscribe(auto => {
      isAutoTheme = auto
    })
  })

  // Handle theme selection
  function selectTheme(theme: 'light' | 'dark' | 'auto') {
    themeManager.setTheme(theme)
    isOpen = false
  }

  // Toggle between light and dark
  function toggleTheme() {
    themeManager.toggleTheme()
  }

  // Get theme icon
  function getThemeIcon(): string {
    if (isAutoTheme) {
      return '🌓'
    }
    return currentScheme === 'dark' ? '🌙' : '☀️'
  }

  // Get theme label
  function getThemeLabel(): string {
    if (isAutoTheme) {
      return 'Auto'
    }
    return currentScheme === 'dark' ? 'Dark' : 'Light'
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.theme-toggle')) {
      isOpen = false
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

<div class="theme-toggle relative">
  <!-- Toggle Button -->
  <button
    onclick={toggleTheme}
    class="theme-toggle-button"
    aria-label="Toggle theme"
    title="Toggle theme"
  >
    <span class="theme-icon">{getThemeIcon()}</span>
    <span class="theme-label">{getThemeLabel()}</span>
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div class="theme-dropdown">
      <div class="theme-dropdown-header">
        <span class="theme-dropdown-title">Theme</span>
      </div>

      <div class="theme-options">
        <button
          onclick={() => selectTheme('light')}
          class="theme-option {currentScheme === 'light' && !isAutoTheme ? 'active' : ''}"
        >
          <span class="theme-option-icon">☀️</span>
          <span class="theme-option-label">Light</span>
          {#if currentScheme === 'light' && !isAutoTheme}
            <span class="theme-option-check">✓</span>
          {/if}
        </button>

        <button
          onclick={() => selectTheme('dark')}
          class="theme-option {currentScheme === 'dark' && !isAutoTheme ? 'active' : ''}"
        >
          <span class="theme-option-icon">🌙</span>
          <span class="theme-option-label">Dark</span>
          {#if currentScheme === 'dark' && !isAutoTheme}
            <span class="theme-option-check">✓</span>
          {/if}
        </button>

        <button
          onclick={() => selectTheme('auto')}
          class="theme-option {isAutoTheme ? 'active' : ''}"
        >
          <span class="theme-option-icon">🌓</span>
          <span class="theme-option-label">Auto (System)</span>
          {#if isAutoTheme}
            <span class="theme-option-check">✓</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- Dropdown Toggle Button -->
  <button
    onclick={() => (isOpen = !isOpen)}
    class="theme-dropdown-toggle"
    aria-label="Theme options"
    title="Theme options"
  >
    <svg class="theme-dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
      ></path>
    </svg>
  </button>
</div>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .theme-toggle-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle-button:hover {
    background: var(--color-border);
    border-color: var(--color-primary);
  }

  .theme-toggle-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-icon {
    font-size: 16px;
    line-height: 1;
  }

  .theme-label {
    font-size: 14px;
  }

  .theme-dropdown-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-dropdown-toggle:hover {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-dropdown-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-dropdown-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .theme-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    z-index: 50;
    animation: dropdownFadeIn 0.2s ease;
  }

  .theme-dropdown-header {
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .theme-dropdown-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .theme-options {
    padding: 8px;
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--color-text);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-option:hover {
    background: var(--color-border);
  }

  .theme-option.active {
    background: var(--color-primary);
    color: white;
  }

  .theme-option.active:hover {
    background: var(--color-primary);
    opacity: 0.9;
  }

  .theme-option-icon {
    font-size: 16px;
    line-height: 1;
  }

  .theme-option-label {
    flex: 1;
    font-weight: 500;
  }

  .theme-option-check {
    font-size: 16px;
    font-weight: bold;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-toggle-button {
      padding: 6px 8px;
    }

    .theme-label {
      display: none;
    }

    .theme-dropdown {
      right: -8px;
      min-width: 180px;
    }
  }

  /* Dark theme specific adjustments */
  [data-theme='dark'] .theme-dropdown {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
</style>
