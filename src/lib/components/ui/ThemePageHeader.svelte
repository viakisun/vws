<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title?: string
    subtitle?: string
    class?: string
    children?: Snippet
  }

  const { title = '', subtitle = '', class: className = '', children }: Props = $props()
</script>

<div class="mb-6 {className}">
  {#if title}
    <h1 class="text-2xl font-bold text-gray-900 mb-2">
      {title}
    </h1>
  {/if}

  {#if subtitle}
    <p class="text-gray-600 mb-4">
      {subtitle}
    </p>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</div>
