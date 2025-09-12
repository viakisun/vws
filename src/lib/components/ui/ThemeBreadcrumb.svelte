<script lang="ts">
	// Props
	interface Props {
		separator?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'pills' | 'outlined' | 'ghost';
		class?: string;
		children?: any;
	}

	let {
		separator = '/',
		size = 'md',
		variant = 'default',
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	// Get breadcrumb classes
	function getBreadcrumbClasses(): string {
		const baseClasses = 'theme-breadcrumb';
		const sizeClass = `theme-breadcrumb-${size}`;
		const variantClass = `theme-breadcrumb-${variant}`;

		return [baseClasses, sizeClass, variantClass, className].filter(Boolean).join(' ');
	}

	// Get item classes
	function getItemClasses(isActive: boolean = false): string {
		const baseClasses = 'theme-breadcrumb-item';
		const sizeClass = `theme-breadcrumb-item-${size}`;
		const variantClass = `theme-breadcrumb-item-${variant}`;
		const activeClass = isActive ? 'theme-breadcrumb-item-active' : '';

		return [baseClasses, sizeClass, variantClass, activeClass].filter(Boolean).join(' ');
	}

	// Get separator classes
	function getSeparatorClasses(): string {
		const baseClasses = 'theme-breadcrumb-separator';
		const sizeClass = `theme-breadcrumb-separator-${size}`;

		return [baseClasses, sizeClass].filter(Boolean).join(' ');
	}
</script>

<nav class={getBreadcrumbClasses()} aria-label="Breadcrumb" {...restProps}>
	<ol class="theme-breadcrumb-list">
		<slot name="items" />
	</ol>
</nav>

<style>
	.theme-breadcrumb {
		display: flex;
		align-items: center;
	}

	.theme-breadcrumb-list {
		display: flex;
		align-items: center;
		gap: 8px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.theme-breadcrumb-item {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.theme-breadcrumb-item:hover {
		color: var(--color-text);
	}

	.theme-breadcrumb-item-active {
		color: var(--color-text);
		cursor: default;
	}

	.theme-breadcrumb-item-active:hover {
		color: var(--color-text);
	}

	.theme-breadcrumb-separator {
		color: var(--color-text-muted);
		user-select: none;
	}

	/* Variants */
	.theme-breadcrumb-default {
		/* Default styling is handled by base classes */
	}

	.theme-breadcrumb-pills .theme-breadcrumb-item {
		padding: 4px 8px;
		border-radius: 6px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.theme-breadcrumb-pills .theme-breadcrumb-item:hover {
		background: var(--color-border);
	}

	.theme-breadcrumb-pills .theme-breadcrumb-item-active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.theme-breadcrumb-outlined .theme-breadcrumb-item {
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: transparent;
	}

	.theme-breadcrumb-outlined .theme-breadcrumb-item:hover {
		background: var(--color-surface);
	}

	.theme-breadcrumb-outlined .theme-breadcrumb-item-active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.theme-breadcrumb-ghost .theme-breadcrumb-item {
		padding: 4px 8px;
		border-radius: 6px;
		background: transparent;
		border: none;
	}

	.theme-breadcrumb-ghost .theme-breadcrumb-item:hover {
		background: var(--color-border);
	}

	.theme-breadcrumb-ghost .theme-breadcrumb-item-active {
		background: var(--color-primary);
		color: white;
	}

	/* Sizes */
	.theme-breadcrumb-sm .theme-breadcrumb-item {
		font-size: 12px;
		padding: 2px 6px;
	}

	.theme-breadcrumb-md .theme-breadcrumb-item {
		font-size: 14px;
		padding: 4px 8px;
	}

	.theme-breadcrumb-lg .theme-breadcrumb-item {
		font-size: 16px;
		padding: 6px 10px;
	}

	.theme-breadcrumb-xl .theme-breadcrumb-item {
		font-size: 18px;
		padding: 8px 12px;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-breadcrumb-list {
			gap: 4px;
		}

		.theme-breadcrumb-sm .theme-breadcrumb-item {
			font-size: 11px;
			padding: 1px 4px;
		}

		.theme-breadcrumb-md .theme-breadcrumb-item {
			font-size: 13px;
			padding: 3px 6px;
		}

		.theme-breadcrumb-lg .theme-breadcrumb-item {
			font-size: 15px;
			padding: 5px 8px;
		}

		.theme-breadcrumb-xl .theme-breadcrumb-item {
			font-size: 17px;
			padding: 7px 10px;
		}
	}
</style>
