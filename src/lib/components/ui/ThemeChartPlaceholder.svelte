<script lang="ts">
  interface Props {
    title: string
    value?: string
    icon?: any
    class?: string
  }

  let { title, value = '', icon, class: className = '', ...restProps }: Props = $props()
</script>

<div class="space-y-4 {className}" {...restProps}>
  <h3 class="text-sm font-medium" style:color="var(--color-text-secondary)">
    {title}
  </h3>
  <div
    class="h-24 rounded-xl flex items-center justify-center transition-colors"
    style:background="var(--color-surface)"
    style:border="1px solid var(--color-border)"
  >
    <div class="text-center">
      {#if icon}
        <icon class="w-8 h-8 mx-auto mb-2" style:color="var(--color-primary)"></icon>
      {/if}
      <span class="text-sm" style:color="var(--color-text-secondary)">차트 영역</span>
    </div>
  </div>
  {#if value}
    <div class="text-xs" style:color="var(--color-text-secondary)">
      {value}
    </div>
  {/if}
</div>
