<script lang="ts">
  import Badge from './Badge.svelte'

  interface Props {
    title: string
    count?: number
    children?: import('svelte').Snippet
  }

  let { title, count, children }: Props = $props()
</script>

<div class="flex items-center justify-between mb-4">
  <div class="flex items-center gap-2">
    <h3 class="text-xl font-light" style:color="var(--color-text-primary)">{title}</h3>
    {#if count !== undefined}
      <Badge useTheme>{count}</Badge>
    {/if}
  </div>
  {#if children}
    <div>
      {@render children()}
    </div>
  {/if}
</div>
