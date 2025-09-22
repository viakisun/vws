<script lang="ts">
  // Props
  interface Props {
    variant?: 'text' | 'rectangular' | 'circular' | 'rounded'
    width?: string | number
    height?: string | number
    animation?: 'pulse' | 'wave' | 'none'
    class?: string
    children?: any
  }

  let {
    variant = 'text',
    width = '100%',
    height = '1em',
    animation = 'pulse',
    class: className = '',
    children,
    ...restProps
  }: Props = $props()

  // Get skeleton classes
  function getSkeletonClasses(): string {
    const baseClasses = 'theme-skeleton'
    const variantClass = `theme-skeleton-${variant}`
    const animationClass = `theme-skeleton-${animation}`

    return [baseClasses, variantClass, animationClass, className].filter(Boolean).join(' ')
  }

  // Get skeleton styles
  function getSkeletonStyles(): string {
    const styles = []

    if (width) {
      styles.push(`width: ${typeof width === 'number' ? width + 'px' : width}`)
    }

    if (height) {
      styles.push(`height: ${typeof height === 'number' ? height + 'px' : height}`)
    }

    return styles.join('; ')
  }
</script>

<div class={getSkeletonClasses()} style={getSkeletonStyles()} {...restProps}>
  {@render children?.()}
</div>

<style>
  .theme-skeleton {
    background: var(--color-border);
    border-radius: 4px;
    display: inline-block;
    position: relative;
    overflow: hidden;
  }

  /* Variants */
  .theme-skeleton-text {
    border-radius: 4px;
  }

  .theme-skeleton-rectangular {
    border-radius: 0;
  }

  .theme-skeleton-circular {
    border-radius: 50%;
  }

  .theme-skeleton-rounded {
    border-radius: 8px;
  }

  /* Animations */
  .theme-skeleton-pulse {
    animation: skeletonPulse 1.5s ease-in-out infinite;
  }

  .theme-skeleton-wave {
    animation: skeletonWave 1.6s ease-in-out infinite;
  }

  .theme-skeleton-wave::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: skeletonWaveMove 1.6s ease-in-out infinite;
  }

  .theme-skeleton-none {
    /* No animation */
  }

  /* Keyframes */
  @keyframes skeletonPulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes skeletonWave {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes skeletonWaveMove {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  /* Dark theme adjustments */
  [data-theme='dark'] .theme-skeleton {
    background: var(--color-border);
  }

  [data-theme='dark'] .theme-skeleton-wave::before {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-skeleton {
      border-radius: 3px;
    }

    .theme-skeleton-rounded {
      border-radius: 6px;
    }
  }
</style>
