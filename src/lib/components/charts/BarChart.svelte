<script lang="ts">
	import { onMount } from 'svelte';

	export let data: Array<{ label: string; value: number; color?: string }> = [];
	export let width: number = 400;
	export let height: number = 200;
	export let color: string = '#3B82F6';
	export let showGrid: boolean = true;
	export let showValues: boolean = true;
	export let horizontal: boolean = false;
	export let animated: boolean = true;
	export let duration: number = 1000;
	export let barSpacing: number = 0.1; // 0-1, percentage of bar width for spacing

	let svgElement: SVGSVGElement;
	let barsGroup: SVGGElement;

	// Calculate chart dimensions and scales
	let chartWidth: number;
	let chartHeight: number;
	let xScale: (value: number) => number;
	let yScale: (value: number) => number;
	let minValue: number;
	let maxValue: number;
	let barWidth: number;

	// Animation state
	let animationProgress = $state(0);

	// Calculate chart properties
	function calculateChartProperties() {
		if (!data || data.length === 0) return;

		chartWidth = width - 80; // Account for margins
		chartHeight = height - 60;

		// Find min/max values
		minValue = Math.min(...data.map(d => d.value));
		maxValue = Math.max(...data.map(d => d.value));
		
		// Add padding to max value
		maxValue = maxValue * 1.1;

		// Calculate bar width
		const totalSpacing = (data.length - 1) * barSpacing;
		barWidth = (chartWidth - totalSpacing) / data.length;

		// Create scales
		if (horizontal) {
			xScale = (value: number) => (value / maxValue) * chartWidth;
			yScale = (index: number) => index * (barWidth + barWidth * barSpacing);
		} else {
			xScale = (index: number) => index * (barWidth + barWidth * barSpacing);
			yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight;
		}
	}

	// Animate the chart
	function animateChart() {
		if (!animated) {
			animationProgress = 1;
			return;
		}

		animationProgress = 0;
		const startTime = Date.now();

		function updateAnimation() {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Easing function (ease-out)
			animationProgress = 1 - Math.pow(1 - progress, 3);

			if (progress < 1) {
				requestAnimationFrame(updateAnimation);
			}
		}

		requestAnimationFrame(updateAnimation);
	}

	// Update chart when data changes
	$effect(() => {
		calculateChartProperties();
		animateChart();
	});

	onMount(() => {
		calculateChartProperties();
		animateChart();
	});

	// Chart properties calculated in onMount

	// Format value labels
	function formatValue(value: number): string {
		if (value >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`;
		} else if (value >= 1000) {
			return `${(value / 1000).toFixed(1)}K`;
		}
		return value.toString();
	}

	// Get animated bar height/width
	function getAnimatedValue(value: number): number {
		return value * animationProgress;
	}
</script>

<div class="bar-chart-container" style="width: {width}px; height: {height}px;">
	<svg
		bind:this={svgElement}
		width={width}
		height={height}
		viewBox="0 0 {width} {height}"
		class="bar-chart"
	>
		<!-- Grid lines -->
		{#if showGrid}
			<g class="grid">
				{#if horizontal}
					<!-- Horizontal grid lines for horizontal bars -->
					{#each Array(5) as _, i}
						{@const x = (chartWidth / 4) * i + 40}
						<line
							x1={x}
							y1="20"
							x2={x}
							y2={height - 40}
							stroke="#E5E7EB"
							stroke-width="1"
							opacity="0.5"
						/>
					{/each}
				{:else}
					<!-- Horizontal grid lines for vertical bars -->
					{#each Array(5) as _, i}
						{@const y = (chartHeight / 4) * i + 30}
						<line
							x1="40"
							y1={y}
							x2={width - 40}
							y2={y}
							stroke="#E5E7EB"
							stroke-width="1"
							opacity="0.5"
						/>
					{/each}
				{/if}
			</g>
		{/if}

		<!-- Bars -->
		{#if data.length > 0}
			<g bind:this={barsGroup} class="bars">
				{#each data as item, i}
					{@const animatedValue = getAnimatedValue(item.value)}
					{@const barColor = item.color || color}
					
					{#if horizontal}
						<!-- Horizontal bars -->
						{@const barHeight = barWidth}
						{@const barX = 40}
						{@const barY = yScale(i)}
						{@const barWidth_animated = xScale(animatedValue)}
						
						<rect
							x={barX}
							y={barY}
							width={barWidth_animated}
							height={barHeight}
							fill={barColor}
							class="bar"
							style="opacity: {animationProgress}"
						>
							<title>{item.label}: {item.value}</title>
						</rect>
						
						<!-- Value label for horizontal bars -->
						{#if showValues}
							<text
								x={barX + barWidth_animated + 5}
								y={barY + barHeight / 2}
								dominant-baseline="middle"
								class="value-label"
								fill="#374151"
								font-size="12"
								style="opacity: {animationProgress}"
							>
								{formatValue(item.value)}
							</text>
						{/if}
						
						<!-- Category label for horizontal bars -->
						<text
							x="35"
							y={barY + barHeight / 2}
							text-anchor="end"
							dominant-baseline="middle"
							class="category-label"
							fill="#6B7280"
							font-size="12"
						>
							{item.label}
						</text>
					{:else}
						<!-- Vertical bars -->
						{@const barX = xScale(i) + 40}
						{@const barY = yScale(animatedValue)}
						{@const barHeight = chartHeight - barY}
						
						<rect
							x={barX}
							y={barY}
							width={barWidth}
							height={barHeight}
							fill={barColor}
							class="bar"
							style="opacity: {animationProgress}"
						>
							<title>{item.label}: {item.value}</title>
						</rect>
						
						<!-- Value label for vertical bars -->
						{#if showValues}
							<text
								x={barX + barWidth / 2}
								y={barY - 5}
								text-anchor="middle"
								class="value-label"
								fill="#374151"
								font-size="12"
								style="opacity: {animationProgress}"
							>
								{formatValue(item.value)}
							</text>
						{/if}
						
						<!-- Category label for vertical bars -->
						<text
							x={barX + barWidth / 2}
							y={height - 15}
							text-anchor="middle"
							class="category-label"
							fill="#6B7280"
							font-size="12"
						>
							{item.label}
						</text>
					{/if}
				{/each}
			</g>
		{/if}

		<!-- Axis labels -->
		{#if !horizontal}
			<!-- Y-axis labels for vertical bars -->
			<g class="y-axis">
				{#each Array(5) as _, i}
					{@const value = (maxValue / 4) * (4 - i)}
					<text
						x="35"
						y={(chartHeight / 4) * i + 35}
						text-anchor="end"
						dominant-baseline="middle"
						class="axis-label"
						fill="#6B7280"
						font-size="12"
					>
						{formatValue(value)}
					</text>
				{/each}
			</g>
		{:else}
			<!-- X-axis labels for horizontal bars -->
			<g class="x-axis">
				{#each Array(5) as _, i}
					{@const value = (maxValue / 4) * i}
					<text
						x={(chartWidth / 4) * i + 45}
						y={height - 25}
						text-anchor="middle"
						class="axis-label"
						fill="#6B7280"
						font-size="12"
					>
						{formatValue(value)}
					</text>
				{/each}
			</g>
		{/if}
	</svg>
</div>

<style>
	.bar-chart-container {
		position: relative;
		overflow: visible;
	}

	.bar-chart {
		overflow: visible;
	}

	.bar {
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.bar:hover {
		opacity: 0.8;
		transform: scale(1.02);
		transform-origin: center;
	}

	.value-label,
	.category-label,
	.axis-label {
		font-family: system-ui, -apple-system, sans-serif;
		user-select: none;
	}

	.grid line {
		transition: opacity 0.3s ease;
	}

	.bar-chart:hover .grid line {
		opacity: 0.7;
	}

	/* Animation keyframes */
	@keyframes barGrow {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	.bar {
		transform-origin: bottom;
	}
</style>
