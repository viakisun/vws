<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title?: string
    subtitle?: string
    class?: string
    children?: Snippet
  }

  let { title = '', subtitle = '', class: className = '', children }: Props = $props()
</script>

<div class="mb-6 {className}">
  {#if title}
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      {title}
    </h1>
  {/if}

  {#if subtitle}
    <p class="text-gray-600 dark:text-gray-300 mb-4">
      {subtitle}
    </p>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</div>
