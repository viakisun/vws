<script lang="ts">
  // Props
  interface Props {
    variant?: 'solid' | 'dashed' | 'dotted' | 'gradient'
    orientation?: 'horizontal' | 'vertical'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
    spacing?: 'sm' | 'md' | 'lg' | 'xl'
    class?: string
    children?: any
  }

  let {
    variant = 'solid',
    orientation = 'horizontal',
    size = 'md',
    color = 'default',
    spacing = 'md',
    class: className = '',
    children,
    ...restProps
  }: Props = $props()

  // Get divider classes
  function getDividerClasses(): string {
    const baseClasses = 'theme-divider'
    const variantClass = `theme-divider-${variant}`
    const orientationClass = `theme-divider-${orientation}`
    const sizeClass = `theme-divider-${size}`
    const colorClass = `theme-divider-${color}`
    const spacingClass = `theme-divider-spacing-${spacing}`

    return [
      baseClasses,
      variantClass,
      orientationClass,
      sizeClass,
      colorClass,
      spacingClass,
      className
    ]
      .filter(Boolean)
      .join(' ')
  }

  // Get color value
  function getColorValue(): string {
    switch (color) {
      case 'primary':
        return 'var(--color-primary)'
      case 'success':
        return 'var(--color-success)'
      case 'warning':
        return 'var(--color-warning)'
      case 'error':
        return 'var(--color-error)'
      case 'info':
        return 'var(--color-info)'
      default:
        return 'var(--color-border)'
    }
  }
</script>

<div class={getDividerClasses()} {...restProps}>
  {#if children}
    <div class="theme-divider-content">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-divider {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Orientation */
  .theme-divider-horizontal {
    width: 100%;
    height: 1px;
  }

  .theme-divider-vertical {
    width: 1px;
    height: 100%;
  }

  /* Variants */
  .theme-divider-solid::before {
    content: '';
    position: absolute;
    background: var(--color-border);
  }

  .theme-divider-dashed::before {
    content: '';
    position: absolute;
    background: repeating-linear-gradient(
      to right,
      var(--color-border) 0,
      var(--color-border) 8px,
      transparent 8px,
      transparent 16px
    );
  }

  .theme-divider-dotted::before {
    content: '';
    position: absolute;
    background: repeating-linear-gradient(
      to right,
      var(--color-border) 0,
      var(--color-border) 2px,
      transparent 2px,
      transparent 8px
    );
  }

  .theme-divider-gradient::before {
    content: '';
    position: absolute;
    background: linear-gradient(to right, transparent, var(--color-border), transparent);
  }

  /* Horizontal variants */
  .theme-divider-horizontal.theme-divider-solid::before,
  .theme-divider-horizontal.theme-divider-dashed::before,
  .theme-divider-horizontal.theme-divider-dotted::before,
  .theme-divider-horizontal.theme-divider-gradient::before {
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    transform: translateY(-50%);
  }

  /* Vertical variants */
  .theme-divider-vertical.theme-divider-solid::before,
  .theme-divider-vertical.theme-divider-dashed::before,
  .theme-divider-vertical.theme-divider-dotted::before,
  .theme-divider-vertical.theme-divider-gradient::before {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    transform: translateX(-50%);
  }

  /* Vertical dashed and dotted */
  .theme-divider-vertical.theme-divider-dashed::before {
    background: repeating-linear-gradient(
      to bottom,
      var(--color-border) 0,
      var(--color-border) 8px,
      transparent 8px,
      transparent 16px
    );
  }

  .theme-divider-vertical.theme-divider-dotted::before {
    background: repeating-linear-gradient(
      to bottom,
      var(--color-border) 0,
      var(--color-border) 2px,
      transparent 2px,
      transparent 8px
    );
  }

  .theme-divider-vertical.theme-divider-gradient::before {
    background: linear-gradient(to bottom, transparent, var(--color-border), transparent);
  }

  /* Sizes */
  .theme-divider-sm::before {
    height: 1px;
    width: 1px;
  }

  .theme-divider-md::before {
    height: 2px;
    width: 2px;
  }

  .theme-divider-lg::before {
    height: 3px;
    width: 3px;
  }

  .theme-divider-xl::before {
    height: 4px;
    width: 4px;
  }

  /* Colors */
  .theme-divider-primary::before {
    background: var(--color-primary) !important;
  }

  .theme-divider-success::before {
    background: var(--color-success) !important;
  }

  .theme-divider-warning::before {
    background: var(--color-warning) !important;
  }

  .theme-divider-error::before {
    background: var(--color-error) !important;
  }

  .theme-divider-info::before {
    background: var(--color-info) !important;
  }

  /* Spacing */
  .theme-divider-spacing-sm {
    margin: 8px 0;
  }

  .theme-divider-spacing-md {
    margin: 16px 0;
  }

  .theme-divider-spacing-lg {
    margin: 24px 0;
  }

  .theme-divider-spacing-xl {
    margin: 32px 0;
  }

  /* Content */
  .theme-divider-content {
    background: var(--color-background);
    padding: 0 16px;
    font-size: 14px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    z-index: 1;
  }

  .theme-divider-vertical .theme-divider-content {
    padding: 16px 0;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-divider-spacing-sm {
      margin: 6px 0;
    }

    .theme-divider-spacing-md {
      margin: 12px 0;
    }

    .theme-divider-spacing-lg {
      margin: 18px 0;
    }

    .theme-divider-spacing-xl {
      margin: 24px 0;
    }

    .theme-divider-content {
      padding: 0 12px;
      font-size: 13px;
    }

    .theme-divider-vertical .theme-divider-content {
      padding: 12px 0;
    }
  }
</style>
