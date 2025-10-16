<script lang="ts">
  const {
    src,
    alt = '',
    size = 'md',
    fallback = '?',
    class: className = '',
  }: {
    src?: string
    alt?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    fallback?: string
    class?: string
  } = $props()

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  }
</script>

<div
  class="rounded-full bg-gray-200 flex items-center justify-center overflow-hidden {sizeClasses[
    size
  ]} {className}"
  role="img"
  aria-label={alt}
>
  {#if src}
    <img {src} {alt} class="w-full h-full object-cover" />
  {:else}
    <span class="font-medium text-gray-600">
      {fallback}
    </span>
  {/if}
</div>
