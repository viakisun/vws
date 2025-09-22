<script lang="ts">
  let {
    class: className = '',
    header = '',
    children
  } = $props<{ class?: string; header?: string; children?: () => unknown }>()
</script>

<section class={`card ${className}`}>
  {#if header}
    <header class="mb-3">
      <h3 class="text-base font-semibold text-gray-800">{header}</h3>
    </header>
  {/if}
  <div class="contents">
    {@render children?.()}
  </div>
</section>
