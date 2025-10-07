<script lang="ts">
  import { ArrowRightIcon } from '@lucide/svelte'

  interface Props {
    title: string
    description?: string
    href?: string
    class?: string
  }

  const { title, description, href, class: className = '', ...restProps }: Props = $props()
</script>

<div class="flex items-center justify-between mb-6 {className}" {...restProps}>
  <div>
    <h2 class="text-xl font-semibold" style:color="var(--color-text)">{title}</h2>
    {#if description}
      <p class="text-sm mt-1" style:color="var(--color-text-secondary)">{description}</p>
    {/if}
  </div>
  {#if href}
    <a {href} class="text-sm font-medium transition-colors" style:color="var(--color-primary)">
      상세 보기
      <ArrowRightIcon class="inline-block w-4 h-4 ml-1" />
    </a>
  {/if}
</div>
