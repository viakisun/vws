<script lang="ts">
  let { value = 0, class: className = '' } = $props<{ value?: number; class?: string }>()
  const clamped = Math.max(0, Math.min(100, value))
</script>

<div
  class={`h-2 w-full rounded-full bg-gray-200 overflow-hidden ${className}`}
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={clamped}
>
  <div class="h-full bg-primary transition-all duration-300" style={`width: ${clamped}%`}></div>
</div>
