<script lang="ts">
	// Props
	interface Props {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (checked: boolean) => void;
		children?: any;
	}

	let {
		checked = false,
		indeterminate = false,
		disabled = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Get checkbox classes
	function getCheckboxClasses(): string {
		const baseClasses = 'theme-checkbox';
		const sizeClass = `theme-checkbox-${size}`;
		const variantClass = `theme-checkbox-${variant}`;
		const stateClass = checked ? 'theme-checkbox-checked' : 'theme-checkbox-unchecked';
		const disabledClass = disabled ? 'theme-checkbox-disabled' : '';

		return [baseClasses, sizeClass, variantClass, stateClass, disabledClass, className].filter(Boolean).join(' ');
	}

	// Get color for variant
	function getColor(): string {
		switch (variant) {
			case 'success': return 'var(--color-success)';
			case 'warning': return 'var(--color-warning)';
			case 'error': return 'var(--color-error)';
			case 'info': return 'var(--color-info)';
			default: return 'var(--color-primary)';
		}
	}

	// Handle toggle
	function handleToggle() {
		if (disabled) return;
		
		checked = !checked;
		if (onchange) {
			onchange(checked);
		}
	}

	// Handle keydown
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleToggle();
		}
	}
</script>

<button
	class={getCheckboxClasses()}
	onclick={handleToggle}
	onkeydown={handleKeydown}
	{disabled}
	role="checkbox"
	aria-checked={checked}
	aria-disabled={disabled}
	{...restProps}
>
	<div class="theme-checkbox-input" style="border-color: {checked || indeterminate ? getColor() : 'var(--color-border)'}; background: {checked || indeterminate ? getColor() : 'transparent'};">
		{#if checked}
			<svg class="theme-checkbox-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M20 6L9 17l-5-5"/>
			</svg>
		{:else if indeterminate}
			<svg class="theme-checkbox-indeterminate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M5 12h14"/>
			</svg>
		{/if}
	</div>
	
	{#if children}
		<div class="theme-checkbox-label">
			{@render children?.()}
		</div>
	{/if}
</button>

<style>
	.theme-checkbox {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.theme-checkbox:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-checkbox-input {
		position: relative;
		border: 2px solid var(--color-border);
		border-radius: 4px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.theme-checkbox-check,
	.theme-checkbox-indeterminate {
		color: white;
		stroke-width: 2;
	}

	.theme-checkbox-label {
		font-size: 14px;
		color: var(--color-text);
		user-select: none;
	}

	/* Sizes */
	.theme-checkbox-sm .theme-checkbox-input {
		width: 16px;
		height: 16px;
	}

	.theme-checkbox-sm .theme-checkbox-check,
	.theme-checkbox-sm .theme-checkbox-indeterminate {
		width: 10px;
		height: 10px;
	}

	.theme-checkbox-sm .theme-checkbox-label {
		font-size: 12px;
	}

	.theme-checkbox-md .theme-checkbox-input {
		width: 20px;
		height: 20px;
	}

	.theme-checkbox-md .theme-checkbox-check,
	.theme-checkbox-md .theme-checkbox-indeterminate {
		width: 12px;
		height: 12px;
	}

	.theme-checkbox-md .theme-checkbox-label {
		font-size: 14px;
	}

	.theme-checkbox-lg .theme-checkbox-input {
		width: 24px;
		height: 24px;
	}

	.theme-checkbox-lg .theme-checkbox-check,
	.theme-checkbox-lg .theme-checkbox-indeterminate {
		width: 14px;
		height: 14px;
	}

	.theme-checkbox-lg .theme-checkbox-label {
		font-size: 16px;
	}

	.theme-checkbox-xl .theme-checkbox-input {
		width: 28px;
		height: 28px;
	}

	.theme-checkbox-xl .theme-checkbox-check,
	.theme-checkbox-xl .theme-checkbox-indeterminate {
		width: 16px;
		height: 16px;
	}

	.theme-checkbox-xl .theme-checkbox-label {
		font-size: 18px;
	}

	/* States */
	.theme-checkbox-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-checkbox-disabled .theme-checkbox-input {
		background: var(--color-border-light) !important;
		border-color: var(--color-border-light) !important;
	}

	.theme-checkbox-disabled .theme-checkbox-check,
	.theme-checkbox-disabled .theme-checkbox-indeterminate {
		color: var(--color-text-muted);
	}

	.theme-checkbox-disabled .theme-checkbox-label {
		color: var(--color-text-muted);
	}

	/* Hover effects */
	.theme-checkbox:not(.theme-checkbox-disabled):hover .theme-checkbox-input {
		box-shadow: 0 0 0 2px var(--color-primary-light);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-checkbox-sm .theme-checkbox-input {
			width: 14px;
			height: 14px;
		}

		.theme-checkbox-sm .theme-checkbox-check,
		.theme-checkbox-sm .theme-checkbox-indeterminate {
			width: 8px;
			height: 8px;
		}

		.theme-checkbox-sm .theme-checkbox-label {
			font-size: 11px;
		}

		.theme-checkbox-md .theme-checkbox-input {
			width: 18px;
			height: 18px;
		}

		.theme-checkbox-md .theme-checkbox-check,
		.theme-checkbox-md .theme-checkbox-indeterminate {
			width: 10px;
			height: 10px;
		}

		.theme-checkbox-md .theme-checkbox-label {
			font-size: 13px;
		}

		.theme-checkbox-lg .theme-checkbox-input {
			width: 22px;
			height: 22px;
		}

		.theme-checkbox-lg .theme-checkbox-check,
		.theme-checkbox-lg .theme-checkbox-indeterminate {
			width: 12px;
			height: 12px;
		}

		.theme-checkbox-lg .theme-checkbox-label {
			font-size: 15px;
		}

		.theme-checkbox-xl .theme-checkbox-input {
			width: 26px;
			height: 26px;
		}

		.theme-checkbox-xl .theme-checkbox-check,
		.theme-checkbox-xl .theme-checkbox-indeterminate {
			width: 14px;
			height: 14px;
		}

		.theme-checkbox-xl .theme-checkbox-label {
			font-size: 17px;
		}
	}
</style>
