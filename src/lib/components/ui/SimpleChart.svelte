<script lang="ts">
  interface Props {
    data?: Array<{ label: string; value: number; color?: string }>
    type?: 'bar' | 'pie'
    height?: number
  }

  let { data = [], type = 'bar', height = 200 }: Props = $props()

  const maxValue = $derived(Math.max(...data.map(d => d.value)))
  const totalValue = $derived(data.reduce((sum, d) => sum + d.value, 0))

  const defaultColors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16'
  ]

  function getColor(index: number, customColor?: string) {
    return customColor || defaultColors[index % defaultColors.length]
  }
</script>

{#if type === 'bar'}
  <div class="chart-container" style="height: {height}px;">
    <div class="flex items-end justify-between h-full space-x-2">
      {#each data as item, index}
        <div class="flex flex-col items-center flex-1">
          <div class="w-full bg-gray-200 rounded-t" style="height: {height - 40}px;">
            <div
              class="w-full rounded-t transition-all duration-500"
              style="
								height: {maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0}px;
								background-color: {getColor(index, item.color)};
							"
            ></div>
          </div>
          <div class="text-xs text-gray-600 mt-2 text-center">
            <div class="font-medium">{item.label}</div>
            <div class="text-gray-500">{item.value.toLocaleString()}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else if type === 'pie'}
  <div class="chart-container flex items-center justify-center" style="height: {height}px;">
    <div class="relative w-32 h-32">
      <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
        {#each data as item, index}
          {@const startAngle =
            (data.slice(0, index).reduce((sum, d) => sum + d.value, 0) / totalValue) * 360}
          {@const endAngle =
            (data.slice(0, index + 1).reduce((sum, d) => sum + d.value, 0) / totalValue) * 360}
          {@const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0}
          {@const x1 = 16 + 14 * Math.cos((startAngle * Math.PI) / 180)}
          {@const y1 = 16 + 14 * Math.sin((startAngle * Math.PI) / 180)}
          {@const x2 = 16 + 14 * Math.cos((endAngle * Math.PI) / 180)}
          {@const y2 = 16 + 14 * Math.sin((endAngle * Math.PI) / 180)}
          <path
            d="M 16 16 L {x1} {y1} A 14 14 0 {largeArcFlag} 1 {x2} {y2} Z"
            fill={getColor(index, item.color)}
            class="transition-all duration-500"
          ></path>
        {/each}
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-lg font-bold">{totalValue.toLocaleString()}</div>
          <div class="text-xs text-gray-500">총계</div>
        </div>
      </div>
    </div>
  </div>
  <div class="mt-4 space-y-2">
    {#each data as item, index}
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          style="background-color: {getColor(index, item.color)}"
        ></div>
        <span class="text-sm text-gray-700">{item.label}</span>
        <span class="text-sm text-gray-500 ml-auto">
          {((item.value / totalValue) * 100).toFixed(1)}%
        </span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .chart-container {
    position: relative;
  }
</style>
