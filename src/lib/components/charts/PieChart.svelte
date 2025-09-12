<script lang="ts">
	import { onMount } from 'svelte';

	export let data: Array<{ label: string; value: number; color?: string }> = [];
	export let width: number = 300;
	export let height: number = 300;
	export let showLabels: boolean = true;
	export let showValues: boolean = true;
	export let showPercentages: boolean = true;
	export let animated: boolean = true;
	export let duration: number = 1000;
	export let innerRadius: number = 0; // For donut chart
	export let strokeWidth: number = 2;
	export let strokeColor: string = '#ffffff';

	let svgElement: SVGSVGElement;
	let pathsGroup: SVGGElement;
	let labelsGroup: SVGGElement;

	// Chart properties
	let centerX: number;
	let centerY: number;
	let radius: number;
	let totalValue: number;
	let segments: Array<{
		label: string;
		value: number;
		percentage: number;
		color: string;
		startAngle: number;
		endAngle: number;
		largeArcFlag: number;
	}> = [];

	// Animation state
	let animationProgress = $state(0);

	// Default colors
	const defaultColors = [
		'#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
		'#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
	];

	// Calculate chart properties
	function calculateChartProperties() {
		if (!data || data.length === 0) return;

		centerX = width / 2;
		centerY = height / 2;
		radius = Math.min(centerX, centerY) - 20;
		
		totalValue = data.reduce((sum, item) => sum + item.value, 0);
		
		// Calculate segments
		segments = [];
		let currentAngle = -Math.PI / 2; // Start from top
		
		data.forEach((item, index) => {
			const percentage = (item.value / totalValue) * 100;
			const angle = (item.value / totalValue) * 2 * Math.PI;
			const endAngle = currentAngle + angle;
			
			segments.push({
				label: item.label,
				value: item.value,
				percentage,
				color: item.color || defaultColors[index % defaultColors.length],
				startAngle: currentAngle,
				endAngle,
				largeArcFlag: angle > Math.PI ? 1 : 0
			});
			
			currentAngle = endAngle;
		});
	}

	// Generate SVG path for a segment
	function generateSegmentPath(segment: typeof segments[0]): string {
		const startX = centerX + radius * Math.cos(segment.startAngle);
		const startY = centerY + radius * Math.sin(segment.startAngle);
		const endX = centerX + radius * Math.cos(segment.endAngle);
		const endY = centerY + radius * Math.sin(segment.endAngle);
		
		const innerStartX = centerX + innerRadius * Math.cos(segment.startAngle);
		const innerStartY = centerY + innerRadius * Math.sin(segment.startAngle);
		const innerEndX = centerX + innerRadius * Math.cos(segment.endAngle);
		const innerEndY = centerY + innerRadius * Math.sin(segment.endAngle);
		
		if (innerRadius > 0) {
			// Donut chart
			return `M ${startX} ${startY} A ${radius} ${radius} 0 ${segment.largeArcFlag} 1 ${endX} ${endY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${segment.largeArcFlag} 0 ${innerStartX} ${innerStartY} Z`;
		} else {
			// Pie chart
			return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${segment.largeArcFlag} 1 ${endX} ${endY} Z`;
		}
	}

	// Get label position
	function getLabelPosition(segment: typeof segments[0]): { x: number; y: number } {
		const midAngle = (segment.startAngle + segment.endAngle) / 2;
		const labelRadius = radius * 0.7;
		const x = centerX + labelRadius * Math.cos(midAngle);
		const y = centerY + labelRadius * Math.sin(midAngle);
		return { x, y };
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

	// Get animated segment
	function getAnimatedSegment(segment: typeof segments[0]) {
		const animatedAngle = segment.startAngle + (segment.endAngle - segment.startAngle) * animationProgress;
		const animatedSegment = {
			...segment,
			endAngle: animatedAngle,
			largeArcFlag: (animatedAngle - segment.startAngle) > Math.PI ? 1 : 0
		};
		return animatedSegment;
	}
</script>

<div class="pie-chart-container" style="width: {width}px; height: {height}px;">
	<svg
		bind:this={svgElement}
		width={width}
		height={height}
		viewBox="0 0 {width} {height}"
		class="pie-chart"
	>
		<!-- Segments -->
		{#if segments.length > 0}
			<g bind:this={pathsGroup} class="segments">
				{#each segments as segment, i}
					{@const animatedSegment = getAnimatedSegment(segment)}
					<path
						d={generateSegmentPath(animatedSegment)}
						fill={segment.color}
						stroke={strokeColor}
						stroke-width={strokeWidth}
						class="segment"
						style="opacity: {animationProgress}"
					>
						<title>{segment.label}: {formatValue(segment.value)} ({segment.percentage.toFixed(1)}%)</title>
					</path>
				{/each}
			</g>
		{/if}

		<!-- Labels -->
		{#if showLabels && segments.length > 0}
			<g bind:this={labelsGroup} class="labels">
				{#each segments as segment, i}
					{@const labelPos = getLabelPosition(segment)}
					{@const visible = animationProgress > 0.5}
					{#if visible}
						<text
							x={labelPos.x}
							y={labelPos.y}
							text-anchor="middle"
							dominant-baseline="middle"
							class="label"
							fill="white"
							font-size="12"
							font-weight="500"
							style="opacity: {(animationProgress - 0.5) * 2}"
						>
							{#if showPercentages}
								{segment.percentage.toFixed(0)}%
							{:else if showValues}
								{formatValue(segment.value)}
							{:else}
								{segment.label}
							{/if}
						</text>
					{/if}
				{/each}
			</g>
		{/if}
	</svg>

	<!-- Legend -->
	{#if segments.length > 0}
		<div class="legend">
			{#each segments as segment}
				<div class="legend-item">
					<div 
						class="legend-color" 
						style="background-color: {segment.color}"
					></div>
					<span class="legend-label">{segment.label}</span>
					{#if showValues}
						<span class="legend-value">{formatValue(segment.value)}</span>
					{/if}
					{#if showPercentages}
						<span class="legend-percentage">({segment.percentage.toFixed(1)}%)</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pie-chart-container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.pie-chart {
		overflow: visible;
	}

	.segment {
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.segment:hover {
		opacity: 0.8;
		transform: scale(1.05);
		transform-origin: center;
	}

	.label {
		font-family: system-ui, -apple-system, sans-serif;
		user-select: none;
		pointer-events: none;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	.legend {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 20px;
		max-width: 200px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.legend-label {
		flex: 1;
		color: #374151;
		font-weight: 500;
	}

	.legend-value {
		color: #6B7280;
		font-size: 12px;
	}

	.legend-percentage {
		color: #6B7280;
		font-size: 12px;
	}

	/* Responsive legend */
	@media (max-width: 640px) {
		.legend {
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: center;
			max-width: 100%;
		}
		
		.legend-item {
			flex-direction: column;
			text-align: center;
			gap: 4px;
		}
	}
</style>
