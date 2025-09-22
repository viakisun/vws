<script lang="ts">
  import { onMount } from 'svelte'

  export let data: Array<{ x: string | number; y: number; label?: string }> = []
  export let width: number = 400
  export let height: number = 200
  export let color: string = '#3B82F6'
  export let showGrid: boolean = true
  export let showDots: boolean = true
  export let showArea: boolean = false
  export let strokeWidth: number = 2
  export let animated: boolean = true
  export let duration: number = 1000

  let svgElement: SVGSVGElement
  let pathElement: SVGPathElement
  let areaElement: SVGPathElement
  let dotsGroup: SVGGElement

  // Calculate chart dimensions and scales
  let chartWidth: number
  let chartHeight: number
  let xScale: (value: string | number) => number
  let yScale: (value: number) => number
  let minY: number
  let maxY: number

  // Animation state
  let animationProgress = $state(0)

  // Calculate chart properties
  function calculateChartProperties() {
    if (!data || data.length === 0) return

    chartWidth = width - 60 // Account for margins
    chartHeight = height - 40

    // Find min/max values
    minY = Math.min(...data.map(d => d.y))
    maxY = Math.max(...data.map(d => d.y))

    // Add padding to Y range
    const yPadding = (maxY - minY) * 0.1
    minY = Math.max(0, minY - yPadding)
    maxY = maxY + yPadding

    // Create scales
    xScale = (value: string | number) => {
      const index = data.findIndex(d => d.x === value)
      return (index / (data.length - 1)) * chartWidth
    }

    yScale = (value: number) => {
      return chartHeight - ((value - minY) / (maxY - minY)) * chartHeight
    }
  }

  // Generate SVG path for line
  function generateLinePath(): string {
    if (!data || data.length === 0) return ''

    const points = data.map(d => `${xScale(d.x)},${yScale(d.y)}`)
    return `M ${points.join(' L ')}`
  }

  // Generate SVG path for area
  function generateAreaPath(): string {
    if (!data || data.length === 0) return ''

    const linePath = generateLinePath()
    const firstX = xScale(data[0].x)
    const lastX = xScale(data[data.length - 1].x)

    return `${linePath} L ${lastX},${chartHeight} L ${firstX},${chartHeight} Z`
  }

  // Animate the chart
  function animateChart() {
    if (!animated) {
      animationProgress = 1
      return
    }

    animationProgress = 0
    const startTime = Date.now()

    function updateAnimation() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      animationProgress = 1 - Math.pow(1 - progress, 3)

      if (progress < 1) {
        requestAnimationFrame(updateAnimation)
      }
    }

    requestAnimationFrame(updateAnimation)
  }

  // Update chart when data changes
  $effect(() => {
    calculateChartProperties()
    animateChart()
  })

  onMount(() => {
    calculateChartProperties()
    animateChart()
  })

  // Chart properties calculated in onMount

  // Format Y-axis labels
  function formatYLabel(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  // Get animated path
  function getAnimatedPath(): string {
    if (!data || data.length === 0) return ''

    const totalPoints = data.length
    const visiblePoints = Math.ceil(totalPoints * animationProgress)
    const visibleData = data.slice(0, visiblePoints)

    if (visibleData.length === 0) return ''

    const points = visibleData.map(d => `${xScale(d.x)},${yScale(d.y)}`)
    return `M ${points.join(' L ')}`
  }

  // Get animated area path
  function getAnimatedAreaPath(): string {
    if (!data || data.length === 0) return ''

    const linePath = getAnimatedPath()
    if (!linePath) return ''

    const visiblePoints = Math.ceil(data.length * animationProgress)
    if (visiblePoints === 0) return ''

    const firstX = xScale(data[0].x)
    const lastX = xScale(data[visiblePoints - 1].x)

    return `${linePath} L ${lastX},${chartHeight} L ${firstX},${chartHeight} Z`
  }
</script>

<div class="line-chart-container" style="width: {width}px; height: {height}px;">
  <svg bind:this={svgElement} {width} {height} viewBox="0 0 {width} {height}" class="line-chart">
    <!-- Grid lines -->
    {#if showGrid}
      <g class="grid">
        <!-- Horizontal grid lines -->
        {#each Array(5) as _, i}
          {@const y = (chartHeight / 4) * i}
          <line
            x1="30"
            y1={y + 20}
            x2={width - 30}
            y2={y + 20}
            stroke="#E5E7EB"
            stroke-width="1"
            opacity="0.5"
          ></line>
        {/each}

        <!-- Vertical grid lines -->
        {#each data as _, i}
          {@const x = xScale(data[i].x) + 30}
          <line
            x1={x}
            y1="20"
            x2={x}
            y2={height - 20}
            stroke="#E5E7EB"
            stroke-width="1"
            opacity="0.3"
          ></line>
        {/each}
      </g>
    {/if}

    <!-- Area fill -->
    {#if showArea && data.length > 0}
      <path
        bind:this={areaElement}
        d={getAnimatedAreaPath()}
        fill={color}
        fill-opacity="0.1"
        class="area"
      ></path>
    {/if}

    <!-- Line -->
    {#if data.length > 0}
      <path
        bind:this={pathElement}
        d={getAnimatedPath()}
        fill="none"
        stroke={color}
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
        class="line"
      ></path>
    {/if}

    <!-- Data points -->
    {#if showDots && data.length > 0}
      <g bind:this={dotsGroup} class="dots">
        {#each data as point, i}
          {@const visible = i < Math.ceil(data.length * animationProgress)}
          {#if visible}
            <circle
              cx={xScale(point.x) + 30}
              cy={yScale(point.y) + 20}
              r="4"
              fill={color}
              stroke="white"
              stroke-width="2"
              class="dot"
              style="opacity: {animationProgress}"
            >
              <title>{point.label || `${point.x}: ${point.y}`}</title>
            </circle>
          {/if}
        {/each}
      </g>
    {/if}

    <!-- Y-axis labels -->
    <g class="y-axis">
      {#each Array(5) as _, i}
        {@const value = minY + ((maxY - minY) / 4) * (4 - i)}
        <text
          x="25"
          y={(chartHeight / 4) * i + 25}
          text-anchor="end"
          dominant-baseline="middle"
          class="y-label"
          fill="#6B7280"
          font-size="12"
        >
          {formatYLabel(value)}
        </text>
      {/each}
    </g>

    <!-- X-axis labels -->
    <g class="x-axis">
      {#each data as point, i}
        {@const x = xScale(point.x) + 30}
        <text {x} y={height - 5} text-anchor="middle" class="x-label" fill="#6B7280" font-size="12">
          {point.x}
        </text>
      {/each}
    </g>
  </svg>
</div>

<style>
  .line-chart-container {
    position: relative;
    overflow: visible;
  }

  .line-chart {
    overflow: visible;
  }

  .line {
    transition: all 0.3s ease;
  }

  .area {
    transition: all 0.3s ease;
  }

  .dot {
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .dot:hover {
    r: 6;
    opacity: 0.8;
  }

  .y-label,
  .x-label {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    user-select: none;
  }

  .grid line {
    transition: opacity 0.3s ease;
  }

  .line-chart:hover .grid line {
    opacity: 0.7;
  }
</style>
