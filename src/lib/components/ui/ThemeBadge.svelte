<script lang="ts">
  // Props
  interface Props {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'ghost'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    shape?: 'rounded' | 'pill' | 'square'
    dot?: boolean
    class?: string
    children?: any
  }

  let {
    variant = 'default',
    size = 'md',
    shape = 'rounded',
    dot = false,
    class: className = '',
    children,
    ...restProps
  }: Props = $props()

  // Get badge classes
  function getBadgeClasses(): string {
    const baseClasses = 'theme-badge'
    const variantClass = `theme-badge-${variant}`
    const sizeClass = `theme-badge-${size}`
    const shapeClass = `theme-badge-${shape}`
    const dotClass = dot ? 'theme-badge-dot' : ''

    return [baseClasses, variantClass, sizeClass, shapeClass, dotClass, className]
      .filter(Boolean)
      .join(' ')
  }

  // Get color for variant
  function getColor(): string {
    switch (variant) {
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
        return 'var(--color-text-secondary)'
    }
  }
</script>

<span
  class={getBadgeClasses()}
  {...restProps}>
  {#if dot}
    <span
      class="theme-badge-dot"
      style:background={getColor()}></span>
  {/if}
  <span class="theme-badge-content">
    {@render children?.()}
  </span>
</span>

<style>
  .theme-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  /* Variants */
  .theme-badge-default {
    background: var(--color-border);
    color: var(--color-text-secondary);
  }

  .theme-badge-primary {
    background: var(--color-primary);
    color: white;
  }

  .theme-badge-success {
    background: var(--color-success);
    color: white;
  }

  .theme-badge-warning {
    background: var(--color-warning);
    color: #212529;
  }

  .theme-badge-error {
    background: var(--color-error);
    color: white;
  }

  .theme-badge-info {
    background: var(--color-info);
    color: white;
  }

  .theme-badge-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  /* Sizes */
  .theme-badge-sm {
    padding: 2px 6px;
    font-size: 10px;
    min-height: 16px;
  }

  .theme-badge-md {
    padding: 4px 8px;
    font-size: 12px;
    min-height: 20px;
  }

  .theme-badge-lg {
    padding: 6px 12px;
    font-size: 14px;
    min-height: 24px;
  }

  .theme-badge-xl {
    padding: 8px 16px;
    font-size: 16px;
    min-height: 28px;
  }

  /* Shapes */
  .theme-badge-rounded {
    border-radius: 6px;
  }

  .theme-badge-pill {
    border-radius: 9999px;
  }

  .theme-badge-square {
    border-radius: 0;
  }

  /* Dot */
  .theme-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .theme-badge-sm .theme-badge-dot {
    width: 4px;
    height: 4px;
  }

  .theme-badge-lg .theme-badge-dot {
    width: 8px;
    height: 8px;
  }

  .theme-badge-xl .theme-badge-dot {
    width: 10px;
    height: 10px;
  }

  /* Content */
  .theme-badge-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-badge-sm {
      padding: 1px 4px;
      font-size: 9px;
      min-height: 14px;
    }

    .theme-badge-md {
      padding: 3px 6px;
      font-size: 11px;
      min-height: 18px;
    }

    .theme-badge-lg {
      padding: 4px 10px;
      font-size: 13px;
      min-height: 22px;
    }

    .theme-badge-xl {
      padding: 6px 14px;
      font-size: 15px;
      min-height: 26px;
    }
  }
</style>
