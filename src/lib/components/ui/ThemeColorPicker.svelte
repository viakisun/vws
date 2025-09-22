<script lang="ts">
  // Props
  interface Props {
    value?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (color: string) => void
    children?: any
  }

  let {
    value = '#000000',
    disabled = false,
    size = 'md',
    variant = 'default',
    class: className = '',
    onchange,
    children,
    ...restProps
  }: Props = $props()

  // Get color picker classes
  function getColorPickerClasses(): string {
    const baseClasses = 'theme-colorpicker'
    const sizeClass = `theme-colorpicker-${size}`
    const variantClass = `theme-colorpicker-${variant}`
    const disabledClass = disabled ? 'theme-colorpicker-disabled' : ''

    return [baseClasses, sizeClass, variantClass, disabledClass, className]
      .filter(Boolean)
      .join(' ')
  }

  // Get input classes
  function getInputClasses(): string {
    const baseClasses = 'theme-colorpicker-input'
    const sizeClass = `theme-colorpicker-input-${size}`
    const variantClass = `theme-colorpicker-input-${variant}`
    const disabledClass = disabled ? 'theme-colorpicker-input-disabled' : ''

    return [baseClasses, sizeClass, variantClass, disabledClass].filter(Boolean).join(' ')
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

  // Handle color change
  function handleColorChange(event: Event) {
    const target = event.target as HTMLInputElement
    const newColor = target.value

    value = newColor
    if (onchange) {
      onchange(newColor)
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement
    const newColor = target.value

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      value = newColor
      if (onchange) {
        onchange(newColor)
      }
    }
  }

  // Get color preview style
  function getColorPreviewStyle(): string {
    return `background: ${value};`
  }

  // Get input border color
  function getInputBorderColor(): string {
    return value
  }
</script>

<div class={getColorPickerClasses()} {...restProps}>
  <div class="theme-colorpicker-container">
    <div class="theme-colorpicker-preview" style={getColorPreviewStyle()}></div>

    <input
      type="color"
      class={getInputClasses()}
      {value}
      {disabled}
      onchange={handleColorChange}
      aria-label="Color picker"
    />

    <input
      type="text"
      class="theme-colorpicker-text"
      {value}
      {disabled}
      oninput={handleInputChange}
      placeholder="#000000"
      maxlength="7"
    />
  </div>

  {#if children}
    <div class="theme-colorpicker-content">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-colorpicker {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .theme-colorpicker-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .theme-colorpicker-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid var(--color-border);
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .theme-colorpicker-input {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }

  .theme-colorpicker-text {
    flex: 1;
    padding: 10px 12px;
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
    border-radius: 8px;
    font-size: 14px;
    color: var(--color-text);
    transition: all 0.2s ease;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
  }

  .theme-colorpicker-text:focus {
    outline: none;
    border-color: var(--color-input-focus);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  .theme-colorpicker-text::placeholder {
    color: var(--color-text-muted);
    text-transform: none;
  }

  .theme-colorpicker-content {
    margin-top: 8px;
  }

  /* Sizes */
  .theme-colorpicker-sm .theme-colorpicker-preview {
    width: 32px;
    height: 32px;
  }

  .theme-colorpicker-sm .theme-colorpicker-input {
    width: 32px;
    height: 32px;
  }

  .theme-colorpicker-sm .theme-colorpicker-text {
    padding: 8px 10px;
    font-size: 12px;
  }

  .theme-colorpicker-md .theme-colorpicker-preview {
    width: 40px;
    height: 40px;
  }

  .theme-colorpicker-md .theme-colorpicker-input {
    width: 40px;
    height: 40px;
  }

  .theme-colorpicker-md .theme-colorpicker-text {
    padding: 10px 12px;
    font-size: 14px;
  }

  .theme-colorpicker-lg .theme-colorpicker-preview {
    width: 48px;
    height: 48px;
  }

  .theme-colorpicker-lg .theme-colorpicker-input {
    width: 48px;
    height: 48px;
  }

  .theme-colorpicker-lg .theme-colorpicker-text {
    padding: 12px 14px;
    font-size: 16px;
  }

  .theme-colorpicker-xl .theme-colorpicker-preview {
    width: 56px;
    height: 56px;
  }

  .theme-colorpicker-xl .theme-colorpicker-input {
    width: 56px;
    height: 56px;
  }

  .theme-colorpicker-xl .theme-colorpicker-text {
    padding: 14px 16px;
    font-size: 18px;
  }

  /* States */
  .theme-colorpicker-disabled .theme-colorpicker-preview {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .theme-colorpicker-disabled .theme-colorpicker-input {
    cursor: not-allowed;
  }

  .theme-colorpicker-disabled .theme-colorpicker-text {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Hover effects */
  .theme-colorpicker:not(.theme-colorpicker-disabled):hover .theme-colorpicker-preview {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Focus effects */
  .theme-colorpicker-text:focus {
    border-color: var(--color-primary);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-colorpicker-container {
      gap: 8px;
    }

    .theme-colorpicker-sm .theme-colorpicker-preview {
      width: 28px;
      height: 28px;
    }

    .theme-colorpicker-sm .theme-colorpicker-input {
      width: 28px;
      height: 28px;
    }

    .theme-colorpicker-sm .theme-colorpicker-text {
      padding: 6px 8px;
      font-size: 11px;
    }

    .theme-colorpicker-md .theme-colorpicker-preview {
      width: 36px;
      height: 36px;
    }

    .theme-colorpicker-md .theme-colorpicker-input {
      width: 36px;
      height: 36px;
    }

    .theme-colorpicker-md .theme-colorpicker-text {
      padding: 8px 10px;
      font-size: 13px;
    }

    .theme-colorpicker-lg .theme-colorpicker-preview {
      width: 44px;
      height: 44px;
    }

    .theme-colorpicker-lg .theme-colorpicker-input {
      width: 44px;
      height: 44px;
    }

    .theme-colorpicker-lg .theme-colorpicker-text {
      padding: 10px 12px;
      font-size: 15px;
    }

    .theme-colorpicker-xl .theme-colorpicker-preview {
      width: 52px;
      height: 52px;
    }

    .theme-colorpicker-xl .theme-colorpicker-input {
      width: 52px;
      height: 52px;
    }

    .theme-colorpicker-xl .theme-colorpicker-text {
      padding: 12px 14px;
      font-size: 17px;
    }
  }
</style>
