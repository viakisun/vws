<script lang="ts">
  // Props
  interface Props {
    value?: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (value: number) => void
    children?: any
  }

  let {
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    size = 'md',
    variant = 'default',
    class: className = '',
    onchange,
    children,
    ...restProps
  }: Props = $props()

  // Get slider classes
  function getSliderClasses(): string {
    const baseClasses = 'theme-slider'
    const sizeClass = `theme-slider-${size}`
    const variantClass = `theme-slider-${variant}`
    const disabledClass = disabled ? 'theme-slider-disabled' : ''

    return [baseClasses, sizeClass, variantClass, disabledClass, className]
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

  // Calculate percentage
  function getPercentage(): number {
    return ((value - min) / (max - min)) * 100
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement
    const newValue = parseFloat(target.value)

    if (!isNaN(newValue)) {
      value = newValue
      if (onchange) {
        onchange(newValue)
      }
    }
  }

  // Handle keydown
  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return

    const stepSize = step || 1
    let newValue = value

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault()
        newValue = Math.max(min, value - stepSize)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault()
        newValue = Math.min(max, value + stepSize)
        break
      case 'Home':
        event.preventDefault()
        newValue = min
        break
      case 'End':
        event.preventDefault()
        newValue = max
        break
    }

    if (newValue !== value) {
      value = newValue
      if (onchange) {
        onchange(newValue)
      }
    }
  }
</script>

<div class={getSliderClasses()} {...restProps}>
  <input
    type="range"
    class="theme-slider-input"
    {min}
    {max}
    {step}
    {disabled}
    {value}
    oninput={handleInputChange}
    onkeydown={handleKeydown}
    aria-label="Slider"
    aria-valuenow={value}
    aria-valuemin={min}
    aria-valuemax={max}
  />

  <div
    class="theme-slider-track"
    style="background: linear-gradient(to right, {getColor()} 0%, {getColor()} {getPercentage()}%, var(--color-border) {getPercentage()}%, var(--color-border) 100%);"
  >
    <div
      class="theme-slider-thumb"
      style="left: {getPercentage()}%; background: {getColor()};"
    ></div>
  </div>

  {#if children}
    <div class="theme-slider-content">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-slider {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .theme-slider-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }

  .theme-slider-track {
    position: relative;
    height: 6px;
    background: var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }

  .theme-slider-thumb {
    position: absolute;
    top: 50%;
    width: 20px;
    height: 20px;
    background: var(--color-primary);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    pointer-events: none;
  }

  .theme-slider-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  /* Sizes */
  .theme-slider-sm .theme-slider-track {
    height: 4px;
  }

  .theme-slider-sm .theme-slider-thumb {
    width: 16px;
    height: 16px;
  }

  .theme-slider-sm .theme-slider-content {
    font-size: 12px;
  }

  .theme-slider-md .theme-slider-track {
    height: 6px;
  }

  .theme-slider-md .theme-slider-thumb {
    width: 20px;
    height: 20px;
  }

  .theme-slider-md .theme-slider-content {
    font-size: 14px;
  }

  .theme-slider-lg .theme-slider-track {
    height: 8px;
  }

  .theme-slider-lg .theme-slider-thumb {
    width: 24px;
    height: 24px;
  }

  .theme-slider-lg .theme-slider-content {
    font-size: 16px;
  }

  .theme-slider-xl .theme-slider-track {
    height: 10px;
  }

  .theme-slider-xl .theme-slider-thumb {
    width: 28px;
    height: 28px;
  }

  .theme-slider-xl .theme-slider-content {
    font-size: 18px;
  }

  /* States */
  .theme-slider-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .theme-slider-disabled .theme-slider-input {
    cursor: not-allowed;
  }

  .theme-slider-disabled .theme-slider-track {
    background: var(--color-border-light);
  }

  .theme-slider-disabled .theme-slider-thumb {
    background: var(--color-text-muted);
  }

  /* Hover effects */
  .theme-slider:not(.theme-slider-disabled):hover .theme-slider-thumb {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* Focus effects */
  .theme-slider-input:focus + .theme-slider-track .theme-slider-thumb {
    box-shadow: 0 0 0 4px var(--color-primary-light);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-slider-sm .theme-slider-track {
      height: 3px;
    }

    .theme-slider-sm .theme-slider-thumb {
      width: 14px;
      height: 14px;
    }

    .theme-slider-sm .theme-slider-content {
      font-size: 11px;
    }

    .theme-slider-md .theme-slider-track {
      height: 5px;
    }

    .theme-slider-md .theme-slider-thumb {
      width: 18px;
      height: 18px;
    }

    .theme-slider-md .theme-slider-content {
      font-size: 13px;
    }

    .theme-slider-lg .theme-slider-track {
      height: 7px;
    }

    .theme-slider-lg .theme-slider-thumb {
      width: 22px;
      height: 22px;
    }

    .theme-slider-lg .theme-slider-content {
      font-size: 15px;
    }

    .theme-slider-xl .theme-slider-track {
      height: 9px;
    }

    .theme-slider-xl .theme-slider-thumb {
      width: 26px;
      height: 26px;
    }

    .theme-slider-xl .theme-slider-content {
      font-size: 17px;
    }
  }
</style>
