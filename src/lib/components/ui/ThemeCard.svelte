<script lang="ts">
  // Props
  interface Props {
    variant?: 'default' | 'elevated' | 'outlined' | 'filled'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    hover?: boolean
    clickable?: boolean
    class?: string
    children?: any
  }

  const {
    variant = 'default',
    size = 'md',
    hover = false,
    clickable = false,
    class: className = '',
    children,
    ...restProps
  }: Props = $props()

  // Get card classes
  function getCardClasses(): string {
    const baseClasses = 'theme-card'
    const variantClass = `theme-card-${variant}`
    const sizeClass = `theme-card-${size}`
    const stateClasses = [hover ? 'theme-card-hover' : '', clickable ? 'theme-card-clickable' : '']
      .filter(Boolean)
      .join(' ')

    return [baseClasses, variantClass, sizeClass, stateClasses, className].filter(Boolean).join(' ')
  }
</script>

<div class={getCardClasses()} {...restProps}>
  {@render children?.()}
</div>

<style>
  .theme-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  /* Variants */
  .theme-card-default {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .theme-card-elevated {
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    box-shadow: 0 4px 12px var(--color-shadow-light);
  }

  .theme-card-outlined {
    background: transparent;
    border: 2px solid var(--color-border);
  }

  .theme-card-filled {
    background: var(--color-primary-light);
    border: 1px solid var(--color-primary);
  }

  /* Sizes */
  .theme-card-sm {
    padding: 12px;
  }

  .theme-card-md {
    padding: 16px;
  }

  .theme-card-lg {
    padding: 20px;
  }

  .theme-card-xl {
    padding: 24px;
  }

  /* States */
  .theme-card-hover:hover {
    background: var(--color-surface-elevated);
    box-shadow: 0 4px 12px var(--color-shadow-light);
    transform: translateY(-2px);
  }

  .theme-card-clickable {
    cursor: pointer;
  }

  .theme-card-clickable:hover {
    background: var(--color-surface-elevated);
    box-shadow: 0 4px 12px var(--color-shadow-light);
    transform: translateY(-2px);
  }

  .theme-card-clickable:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px var(--color-shadow-light);
  }

  /* Focus styles for accessibility */
  .theme-card-clickable:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-card-sm {
      padding: 10px;
    }

    .theme-card-md {
      padding: 14px;
    }

    .theme-card-lg {
      padding: 18px;
    }

    .theme-card-xl {
      padding: 22px;
    }
  }
</style>
