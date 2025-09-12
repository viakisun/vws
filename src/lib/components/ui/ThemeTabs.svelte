<script lang="ts">
	// Props
	interface Props {
		activeTab?: string;
		variant?: 'default' | 'pills' | 'underline' | 'cards';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		orientation?: 'horizontal' | 'vertical';
		class?: string;
		onchange?: (activeTab: string) => void;
		children?: any;
	}

	let {
		activeTab = '',
		variant = 'default',
		size = 'md',
		orientation = 'horizontal',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Get tabs classes
	function getTabsClasses(): string {
		const baseClasses = 'theme-tabs';
		const variantClass = `theme-tabs-${variant}`;
		const sizeClass = `theme-tabs-${size}`;
		const orientationClass = `theme-tabs-${orientation}`;

		return [baseClasses, variantClass, sizeClass, orientationClass, className].filter(Boolean).join(' ');
	}

	// Get tab classes
	function getTabClasses(tabId: string): string {
		const baseClasses = 'theme-tab';
		const variantClass = `theme-tab-${variant}`;
		const sizeClass = `theme-tab-${size}`;
		const activeClass = activeTab === tabId ? 'theme-tab-active' : '';

		return [baseClasses, variantClass, sizeClass, activeClass].filter(Boolean).join(' ');
	}

	// Get panel classes
	function getPanelClasses(tabId: string): string {
		const baseClasses = 'theme-tab-panel';
		const activeClass = activeTab === tabId ? 'theme-tab-panel-active' : '';

		return [baseClasses, activeClass].filter(Boolean).join(' ');
	}

	// Handle tab click
	function handleTabClick(tabId: string) {
		activeTab = tabId;
		if (onchange) {
			onchange(tabId);
		}
	}

	// Handle keydown
	function handleKeydown(event: KeyboardEvent, tabId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleTabClick(tabId);
		}
	}
</script>

<div class={getTabsClasses()} {...restProps}>
	<div class="theme-tabs-list" role="tablist">
		<slot name="tabs" />
	</div>

	<div class="theme-tabs-content">
		<slot name="panels" />
	</div>
</div>

<style>
	.theme-tabs {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.theme-tabs-list {
		display: flex;
		gap: 8px;
		border-bottom: 1px solid var(--color-border);
	}

	.theme-tab {
		background: transparent;
		border: none;
		padding: 12px 16px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
		color: var(--color-text-secondary);
		position: relative;
		border-radius: 8px 8px 0 0;
	}

	.theme-tab:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-tab:hover {
		color: var(--color-text);
		background: var(--color-surface);
	}

	.theme-tab-active {
		color: var(--color-primary);
		background: var(--color-surface);
	}

	.theme-tab-panel {
		display: none;
		padding: 20px;
		background: var(--color-surface);
		border-radius: 0 0 12px 12px;
	}

	.theme-tab-panel-active {
		display: block;
	}

	/* Variants */
	.theme-tabs-default {
		/* Default styling is handled by base classes */
	}

	.theme-tabs-pills .theme-tabs-list {
		border-bottom: none;
		gap: 4px;
	}

	.theme-tabs-pills .theme-tab {
		border-radius: 8px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.theme-tabs-pills .theme-tab-active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.theme-tabs-underline .theme-tabs-list {
		border-bottom: 2px solid var(--color-border);
	}

	.theme-tabs-underline .theme-tab {
		border-radius: 0;
		border-bottom: 2px solid transparent;
	}

	.theme-tabs-underline .theme-tab-active {
		border-bottom-color: var(--color-primary);
		background: transparent;
	}

	.theme-tabs-cards .theme-tabs-list {
		border-bottom: none;
		gap: 8px;
	}

	.theme-tabs-cards .theme-tab {
		border-radius: 12px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: 0 2px 4px var(--color-shadow-light);
	}

	.theme-tabs-cards .theme-tab-active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
		box-shadow: 0 4px 8px var(--color-shadow);
	}

	/* Sizes */
	.theme-tab-sm {
		padding: 8px 12px;
		font-size: 12px;
	}

	.theme-tab-md {
		padding: 12px 16px;
		font-size: 14px;
	}

	.theme-tab-lg {
		padding: 16px 20px;
		font-size: 16px;
	}

	.theme-tab-xl {
		padding: 20px 24px;
		font-size: 18px;
	}

	/* Orientation */
	.theme-tabs-vertical {
		flex-direction: row;
		gap: 24px;
	}

	.theme-tabs-vertical .theme-tabs-list {
		flex-direction: column;
		border-bottom: none;
		border-right: 1px solid var(--color-border);
		width: 200px;
	}

	.theme-tabs-vertical .theme-tab {
		border-radius: 8px 0 0 8px;
		text-align: left;
	}

	.theme-tabs-vertical .theme-tab-panel {
		flex: 1;
		border-radius: 0 12px 12px 0;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-tabs-list {
			flex-wrap: wrap;
			gap: 4px;
		}

		.theme-tab-sm {
			padding: 6px 10px;
			font-size: 11px;
		}

		.theme-tab-md {
			padding: 10px 14px;
			font-size: 13px;
		}

		.theme-tab-lg {
			padding: 14px 18px;
			font-size: 15px;
		}

		.theme-tab-xl {
			padding: 18px 22px;
			font-size: 17px;
		}

		.theme-tab-panel {
			padding: 16px;
		}

		.theme-tabs-vertical {
			flex-direction: column;
		}

		.theme-tabs-vertical .theme-tabs-list {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}

		.theme-tabs-vertical .theme-tab {
			border-radius: 8px;
		}

		.theme-tabs-vertical .theme-tab-panel {
			border-radius: 0 0 12px 12px;
		}
	}
</style>
