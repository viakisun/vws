<script lang="ts">
  interface Props {
    title: string
    subtitle?: string
    class?: string
  }

  let { title, subtitle = '', class: className = '', ...restProps }: Props = $props()
</script>

<div class="mb-8 {className}" {...restProps}>
  <h1 class="text-3xl font-bold" style="color: var(--color-text);">{title}</h1>
  {#if subtitle}
    <p class="text-sm mt-2" style="color: var(--color-text-secondary);">{subtitle}</p>
  {/if}
</div>
