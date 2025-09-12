<script lang="ts">
	// Props
	interface Props {
		variant?: 'default' | 'striped' | 'bordered' | 'hover';
		size?: 'sm' | 'md' | 'lg';
		responsive?: boolean;
		class?: string;
		children?: any;
	}

	let {
		variant = 'default',
		size = 'md',
		responsive = true,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	// Get table classes
	function getTableClasses(): string {
		const baseClasses = 'theme-table';
		const variantClass = `theme-table-${variant}`;
		const sizeClass = `theme-table-${size}`;
		const responsiveClass = responsive ? 'theme-table-responsive' : '';

		return [baseClasses, variantClass, sizeClass, responsiveClass, className].filter(Boolean).join(' ');
	}
</script>

<div class="theme-table-container">
	<table class={getTableClasses()} {...restProps}>
		{@render children?.()}
	</table>
</div>

<style>
	.theme-table-container {
		width: 100%;
		overflow-x: auto;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}

	.theme-table {
		width: 100%;
		border-collapse: collapse;
		background: var(--color-surface);
	}

	/* Variants */
	.theme-table-default {
		/* Default styling is handled by base classes */
	}

	.theme-table-striped tbody tr:nth-child(even) {
		background: var(--color-table-row-hover);
	}

	.theme-table-bordered {
		border: 1px solid var(--color-border);
	}

	.theme-table-bordered th,
	.theme-table-bordered td {
		border: 1px solid var(--color-border);
	}

	.theme-table-hover tbody tr:hover {
		background: var(--color-table-row-hover);
	}

	/* Sizes */
	.theme-table-sm th,
	.theme-table-sm td {
		padding: 8px 12px;
		font-size: 12px;
	}

	.theme-table-md th,
	.theme-table-md td {
		padding: 12px 16px;
		font-size: 14px;
	}

	.theme-table-lg th,
	.theme-table-lg td {
		padding: 16px 20px;
		font-size: 16px;
	}

	/* Base table styles */
	.theme-table th {
		background: var(--color-table-header);
		font-weight: 600;
		color: var(--color-text);
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.theme-table td {
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border);
	}

	.theme-table tbody tr:last-child td {
		border-bottom: none;
	}

	/* Responsive */
	.theme-table-responsive {
		/* Responsive behavior is handled by the container */
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-table-sm th,
		.theme-table-sm td {
			padding: 6px 8px;
			font-size: 11px;
		}

		.theme-table-md th,
		.theme-table-md td {
			padding: 8px 12px;
			font-size: 13px;
		}

		.theme-table-lg th,
		.theme-table-lg td {
			padding: 12px 16px;
			font-size: 15px;
		}
	}
</style>
