<script lang="ts">
	import ThemeProgress from './ThemeProgress.svelte';
	import ThemeBadge from './ThemeBadge.svelte';

	interface Props {
		title: string;
		value: number;
		max?: number;
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		showPercentage?: boolean;
		animated?: boolean;
		label?: string;
		description?: string;
		class?: string;
	}

	let {
		title,
		value,
		max = 100,
		variant = 'default',
		showPercentage = true,
		animated = false,
		label = '',
		description = '',
		class: className = '',
		...restProps
	}: Props = $props();

	const percentage = Math.round((value / max) * 100);
	
	// 자동으로 variant 결정
	const autoVariant = percentage > 80 ? 'warning' : percentage > 60 ? 'info' : 'success';
	const finalVariant = variant === 'default' ? autoVariant : variant;
</script>

<div class="space-y-4 {className}" {...restProps}>
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium" style="color: var(--color-text-secondary);">{title}</h3>
		{#if showPercentage}
			<ThemeBadge variant={finalVariant}>{percentage}%</ThemeBadge>
		{/if}
	</div>
	
	<ThemeProgress 
		value={value}
		max={max}
		variant={finalVariant}
		size="lg" 
		animated={animated}
	/>
	
	{#if label || description}
		<div class="flex justify-between text-xs" style="color: var(--color-text-secondary);">
			{#if label}
				<span>{label}</span>
			{/if}
			{#if description}
				<span>{description}</span>
			{/if}
		</div>
	{/if}
</div>
