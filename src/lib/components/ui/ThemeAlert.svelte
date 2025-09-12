<script lang="ts">
	// Props
	interface Props {
		type?: 'success' | 'error' | 'warning' | 'info';
		variant?: 'default' | 'filled' | 'outlined' | 'ghost';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		closable?: boolean;
		class?: string;
		onclose?: () => void;
		children?: any;
	}

	let {
		type = 'info',
		variant = 'default',
		size = 'md',
		closable = false,
		class: className = '',
		onclose,
		children,
		...restProps
	}: Props = $props();

	// Get alert classes
	function getAlertClasses(): string {
		const baseClasses = 'theme-alert';
		const typeClass = `theme-alert-${type}`;
		const variantClass = `theme-alert-${variant}`;
		const sizeClass = `theme-alert-${size}`;

		return [baseClasses, typeClass, variantClass, sizeClass, className].filter(Boolean).join(' ');
	}

	// Get icon for type
	function getIcon(): string {
		switch (type) {
			case 'success': return '✅';
			case 'error': return '❌';
			case 'warning': return '⚠️';
			case 'info': return 'ℹ️';
			default: return 'ℹ️';
		}
	}

	// Get color for type
	function getColor(): string {
		switch (type) {
			case 'success': return 'var(--color-success)';
			case 'error': return 'var(--color-error)';
			case 'warning': return 'var(--color-warning)';
			case 'info': return 'var(--color-info)';
			default: return 'var(--color-info)';
		}
	}

	// Handle close
	function handleClose() {
		if (onclose) {
			onclose();
		}
	}
</script>

<div class={getAlertClasses()} {...restProps}>
	<div class="theme-alert-content">
		<div class="theme-alert-icon" style="color: {getColor()};">
			{getIcon()}
		</div>
		
		<div class="theme-alert-body">
			{@render children?.()}
		</div>

		{#if closable}
			<button class="theme-alert-close" onclick={handleClose} aria-label="Close alert">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.theme-alert {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border-radius: 12px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		position: relative;
		overflow: hidden;
	}

	.theme-alert-content {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
	}

	.theme-alert-icon {
		font-size: 20px;
		line-height: 1;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.theme-alert-body {
		flex: 1;
		min-width: 0;
	}

	.theme-alert-close {
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.theme-alert-close:hover {
		background: var(--color-border);
	}

	.theme-alert-close:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-alert-close svg {
		width: 14px;
		height: 14px;
		color: var(--color-text-secondary);
	}

	.theme-alert-close:hover svg {
		color: var(--color-text);
	}

	/* Types */
	.theme-alert-success {
		border-color: var(--color-success);
		background: var(--color-success);
		color: white;
	}

	.theme-alert-error {
		border-color: var(--color-error);
		background: var(--color-error);
		color: white;
	}

	.theme-alert-warning {
		border-color: var(--color-warning);
		background: var(--color-warning);
		color: #212529;
	}

	.theme-alert-info {
		border-color: var(--color-info);
		background: var(--color-info);
		color: white;
	}

	/* Variants */
	.theme-alert-default {
		/* Default styling is handled by base classes */
	}

	.theme-alert-filled {
		/* Filled styling is handled by type classes */
	}

	.theme-alert-outlined {
		background: transparent;
	}

	.theme-alert-outlined.theme-alert-success {
		background: transparent;
		color: var(--color-success);
	}

	.theme-alert-outlined.theme-alert-error {
		background: transparent;
		color: var(--color-error);
	}

	.theme-alert-outlined.theme-alert-warning {
		background: transparent;
		color: var(--color-warning);
	}

	.theme-alert-outlined.theme-alert-info {
		background: transparent;
		color: var(--color-info);
	}

	.theme-alert-ghost {
		background: transparent;
		border: none;
	}

	.theme-alert-ghost.theme-alert-success {
		background: rgba(40, 167, 69, 0.1);
		color: var(--color-success);
	}

	.theme-alert-ghost.theme-alert-error {
		background: rgba(220, 53, 69, 0.1);
		color: var(--color-error);
	}

	.theme-alert-ghost.theme-alert-warning {
		background: rgba(255, 193, 7, 0.1);
		color: var(--color-warning);
	}

	.theme-alert-ghost.theme-alert-info {
		background: rgba(23, 162, 184, 0.1);
		color: var(--color-info);
	}

	/* Sizes */
	.theme-alert-sm {
		padding: 12px;
	}

	.theme-alert-sm .theme-alert-icon {
		font-size: 16px;
	}

	.theme-alert-sm .theme-alert-close {
		width: 20px;
		height: 20px;
	}

	.theme-alert-sm .theme-alert-close svg {
		width: 12px;
		height: 12px;
	}

	.theme-alert-md {
		padding: 16px;
	}

	.theme-alert-lg {
		padding: 20px;
	}

	.theme-alert-lg .theme-alert-icon {
		font-size: 24px;
	}

	.theme-alert-lg .theme-alert-close {
		width: 28px;
		height: 28px;
	}

	.theme-alert-lg .theme-alert-close svg {
		width: 16px;
		height: 16px;
	}

	.theme-alert-xl {
		padding: 24px;
	}

	.theme-alert-xl .theme-alert-icon {
		font-size: 28px;
	}

	.theme-alert-xl .theme-alert-close {
		width: 32px;
		height: 32px;
	}

	.theme-alert-xl .theme-alert-close svg {
		width: 18px;
		height: 18px;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-alert {
			padding: 14px;
		}

		.theme-alert-content {
			gap: 10px;
		}

		.theme-alert-icon {
			font-size: 18px;
		}

		.theme-alert-close {
			width: 22px;
			height: 22px;
		}

		.theme-alert-close svg {
			width: 13px;
			height: 13px;
		}

		.theme-alert-sm {
			padding: 10px;
		}

		.theme-alert-sm .theme-alert-icon {
			font-size: 14px;
		}

		.theme-alert-lg {
			padding: 18px;
		}

		.theme-alert-lg .theme-alert-icon {
			font-size: 22px;
		}

		.theme-alert-xl {
			padding: 22px;
		}

		.theme-alert-xl .theme-alert-icon {
			font-size: 26px;
		}
	}
</style>
