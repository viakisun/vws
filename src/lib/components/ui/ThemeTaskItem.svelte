<script lang="ts">
	import ThemeButton from './ThemeButton.svelte';
	import ThemeBadge from './ThemeBadge.svelte';

	interface Props {
		title: string;
		priority?: 'high' | 'medium' | 'low';
		icon?: any;
		href?: string;
		onAction?: () => void;
		class?: string;
	}

	let {
		title,
		priority = 'medium',
		icon,
		href,
		onAction,
		class: className = '',
		...restProps
	}: Props = $props();

	const priorityConfig = {
		high: { variant: 'error' as const, label: '긴급' },
		medium: { variant: 'warning' as const, label: '보통' },
		low: { variant: 'info' as const, label: '낮음' }
	};

	function handleAction() {
		if (onAction) {
			onAction();
		} else if (href) {
			window.location.href = href;
		}
	}
</script>

<div class="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] {className}" style="background: var(--color-surface); border: 1px solid var(--color-border);" {...restProps}>
	<div class="flex items-center space-x-3 flex-1 min-w-0">
		{#if icon}
			<div class="h-8 w-8 rounded-lg flex items-center justify-center" style="background: var(--color-primary-light);">
				<icon class="h-4 w-4" style="color: var(--color-primary);" />
			</div>
		{/if}
		<div class="flex-1 min-w-0">
			<p class="text-sm font-medium truncate" style="color: var(--color-text);">{title}</p>
			<ThemeBadge variant={priorityConfig[priority].variant} size="sm">
				{priorityConfig[priority].label}
			</ThemeBadge>
		</div>
	</div>
	<ThemeButton variant="primary" size="sm" onclick={handleAction}>
		처리
	</ThemeButton>
</div>
