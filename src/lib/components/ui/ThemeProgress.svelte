<script lang="ts">
  // Props
  interface Props {
    value?: number
    max?: number
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showLabel?: boolean
    showPercentage?: boolean
    animated?: boolean
    striped?: boolean
    class?: string
    children?: any
  }

  let {
    value = 0,
    max = 100,
    variant = 'default',
    size = 'md',
    showLabel = false,
    showPercentage = false,
    animated = false,
    striped = false,
    class: className = '',
    children,
    ...restProps
  }: Props = $props()

  // Get progress classes
  function getProgressClasses(): string {
    const baseClasses = 'theme-progress'
    const variantClass = `theme-progress-${variant}`
    const sizeClass = `theme-progress-${size}`
    const stateClasses = [
      animated ? 'theme-progress-animated' : '',
      striped ? 'theme-progress-striped' : ''
    ]
      .filter(Boolean)
      .join(' ')

    return [baseClasses, variantClass, sizeClass, stateClasses, className].filter(Boolean).join(' ')
  }

  // Get bar classes
  function getBarClasses(): string {
    const baseClasses = 'theme-progress-bar'
    const variantClass = `theme-progress-bar-${variant}`
    const stateClasses = [
      animated ? 'theme-progress-bar-animated' : '',
      striped ? 'theme-progress-bar-striped' : ''
    ]
      .filter(Boolean)
      .join(' ')

    return [baseClasses, variantClass, ...stateClasses].filter(Boolean).join(' ')
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
    return Math.min(Math.max((value / max) * 100, 0), 100)
  }

  // Get label text
  function getLabelText(): string {
    if (showPercentage) {
      return `${Math.round(getPercentage())}%`
    }
    return `${value} / ${max}`
  }
</script>

<div class="theme-progress-container">
  {#if showLabel}
    <div class="theme-progress-label">
      <span class="theme-progress-label-text">
        {@render children?.()}
      </span>
      {#if showPercentage || showLabel}
        <span class="theme-progress-label-value">{getLabelText()}</span>
      {/if}
    </div>
  {/if}

  <div class={getProgressClasses()} {...restProps}>
    <div
      class={getBarClasses()}
      style="width: {getPercentage()}%; background: {getColor()};"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax={max}
      aria-label="Progress: {getPercentage()}%"
    ></div>
  </div>
</div>

<style>
  .theme-progress-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
  }

  .theme-progress-label-text {
    flex: 1;
  }

  .theme-progress-label-value {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .theme-progress {
    width: 100%;
    background: var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .theme-progress-bar {
    height: 100%;
    background: var(--color-primary);
    border-radius: 8px;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  /* Variants */
  .theme-progress-default {
    /* Default styling is handled by base classes */
  }

  .theme-progress-success .theme-progress-bar {
    background: var(--color-success);
  }

  .theme-progress-warning .theme-progress-bar {
    background: var(--color-warning);
  }

  .theme-progress-error .theme-progress-bar {
    background: var(--color-error);
  }

  .theme-progress-info .theme-progress-bar {
    background: var(--color-info);
  }

  /* Sizes */
  .theme-progress-sm {
    height: 4px;
  }

  .theme-progress-md {
    height: 8px;
  }

  .theme-progress-lg {
    height: 12px;
  }

  .theme-progress-xl {
    height: 16px;
  }

  /* Animated */
  .theme-progress-animated .theme-progress-bar {
    animation: progressPulse 2s ease-in-out infinite;
  }

  @keyframes progressPulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  /* Striped */
  .theme-progress-striped .theme-progress-bar {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 20px 20px;
  }

  .theme-progress-striped.theme-progress-animated .theme-progress-bar {
    animation: progressStripes 1s linear infinite;
  }

  @keyframes progressStripes {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 20px 0;
    }
  }

  /* Bar variants */
  .theme-progress-bar-success {
    background: var(--color-success) !important;
  }

  .theme-progress-bar-warning {
    background: var(--color-warning) !important;
  }

  .theme-progress-bar-error {
    background: var(--color-error) !important;
  }

  .theme-progress-bar-info {
    background: var(--color-info) !important;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-progress-label {
      font-size: 13px;
    }

    .theme-progress-label-value {
      font-size: 11px;
    }

    .theme-progress-sm {
      height: 3px;
    }

    .theme-progress-md {
      height: 6px;
    }

    .theme-progress-lg {
      height: 10px;
    }

    .theme-progress-xl {
      height: 14px;
    }
  }
</style>
