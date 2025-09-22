<script lang="ts">
  // Props
  interface Props {
    checked?: boolean
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (checked: boolean) => void
    children?: any
  }

  let {
    checked = false,
    disabled = false,
    size = 'md',
    variant = 'default',
    class: className = '',
    onchange,
    children,
    ...restProps
  }: Props = $props()

  // Get radio classes
  function getRadioClasses(): string {
    const baseClasses = 'theme-radio'
    const sizeClass = `theme-radio-${size}`
    const variantClass = `theme-radio-${variant}`
    const stateClass = checked ? 'theme-radio-checked' : 'theme-radio-unchecked'
    const disabledClass = disabled ? 'theme-radio-disabled' : ''

    return [baseClasses, sizeClass, variantClass, stateClass, disabledClass, className]
      .filter(Boolean)
      .join(' ')
  }

  // Get color for variant
  function getColor(): string {
    switch (variant) {
      case 'success':
        return 'var(--color-success)'
      case 'warning':
        return 'var(--color-warning)'
      case 'error':
        return 'var(--color-error)'
      case 'info':
        return 'var(--color-info)'
      default:
        return 'var(--color-primary)'
    }
  }

  // Handle toggle
  function handleToggle() {
    if (disabled) return

    checked = !checked
    if (onchange) {
      onchange(checked)
    }
  }

  // Handle keydown
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }
</script>

<button
  class={getRadioClasses()}
  onclick={handleToggle}
  onkeydown={handleKeydown}
  {disabled}
  role="radio"
  aria-checked={checked}
  aria-disabled={disabled}
  {...restProps}
>
  <div
    class="theme-radio-input"
    style="border-color: {checked ? getColor() : 'var(--color-border)'};"
  >
    {#if checked}
      <div class="theme-radio-dot" style="background: {getColor()};"></div>
    {/if}
  </div>

  {#if children}
    <div class="theme-radio-label">
      {@render children?.()}
    </div>
  {/if}
</button>

<style>
  .theme-radio {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .theme-radio:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-radio-input {
    position: relative;
    border: 2px solid var(--color-border);
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .theme-radio-dot {
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .theme-radio-label {
    font-size: 14px;
    color: var(--color-text);
    user-select: none;
  }

  /* Sizes */
  .theme-radio-sm .theme-radio-input {
    width: 16px;
    height: 16px;
  }

  .theme-radio-sm .theme-radio-dot {
    width: 8px;
    height: 8px;
  }

  .theme-radio-sm .theme-radio-label {
    font-size: 12px;
  }

  .theme-radio-md .theme-radio-input {
    width: 20px;
    height: 20px;
  }

  .theme-radio-md .theme-radio-dot {
    width: 10px;
    height: 10px;
  }

  .theme-radio-md .theme-radio-label {
    font-size: 14px;
  }

  .theme-radio-lg .theme-radio-input {
    width: 24px;
    height: 24px;
  }

  .theme-radio-lg .theme-radio-dot {
    width: 12px;
    height: 12px;
  }

  .theme-radio-lg .theme-radio-label {
    font-size: 16px;
  }

  .theme-radio-xl .theme-radio-input {
    width: 28px;
    height: 28px;
  }

  .theme-radio-xl .theme-radio-dot {
    width: 14px;
    height: 14px;
  }

  .theme-radio-xl .theme-radio-label {
    font-size: 18px;
  }

  /* States */
  .theme-radio-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .theme-radio-disabled .theme-radio-input {
    background: var(--color-border-light);
    border-color: var(--color-border-light);
  }

  .theme-radio-disabled .theme-radio-dot {
    background: var(--color-text-muted) !important;
  }

  .theme-radio-disabled .theme-radio-label {
    color: var(--color-text-muted);
  }

  /* Hover effects */
  .theme-radio:not(.theme-radio-disabled):hover .theme-radio-input {
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-radio-sm .theme-radio-input {
      width: 14px;
      height: 14px;
    }

    .theme-radio-sm .theme-radio-dot {
      width: 6px;
      height: 6px;
    }

    .theme-radio-sm .theme-radio-label {
      font-size: 11px;
    }

    .theme-radio-md .theme-radio-input {
      width: 18px;
      height: 18px;
    }

    .theme-radio-md .theme-radio-dot {
      width: 8px;
      height: 8px;
    }

    .theme-radio-md .theme-radio-label {
      font-size: 13px;
    }

    .theme-radio-lg .theme-radio-input {
      width: 22px;
      height: 22px;
    }

    .theme-radio-lg .theme-radio-dot {
      width: 10px;
      height: 10px;
    }

    .theme-radio-lg .theme-radio-label {
      font-size: 15px;
    }

    .theme-radio-xl .theme-radio-input {
      width: 26px;
      height: 26px;
    }

    .theme-radio-xl .theme-radio-dot {
      width: 12px;
      height: 12px;
    }

    .theme-radio-xl .theme-radio-label {
      font-size: 17px;
    }
  }
</style>
