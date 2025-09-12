<script lang="ts">
	// Props
	interface Props {
		checked?: boolean;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (checked: boolean) => void;
		children?: any;
	}

	let {
		checked = false,
		disabled = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Get switch classes
	function getSwitchClasses(): string {
		const baseClasses = 'theme-switch';
		const sizeClass = `theme-switch-${size}`;
		const variantClass = `theme-switch-${variant}`;
		const stateClass = checked ? 'theme-switch-checked' : 'theme-switch-unchecked';
		const disabledClass = disabled ? 'theme-switch-disabled' : '';

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
	class={getSwitchClasses()}
	onclick={handleToggle}
	onkeydown={handleKeydown}
	{disabled}
	role="switch"
	aria-checked={checked}
	aria-disabled={disabled}
	{...restProps}
>
	<div class="theme-switch-track" style="background: {checked ? getColor() : 'var(--color-border)'};">
		<div class="theme-switch-thumb" style="transform: {checked ? 'translateX(100%)' : 'translateX(0)'};">
			{#if children}
				<div class="theme-switch-content">
					{@render children?.()}
				</div>
			{/if}
		</div>
	</div>
</button>

<style>
	.theme-switch {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		display: inline-block;
	}

	.theme-switch:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-switch-track {
		position: relative;
		border-radius: 9999px;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.theme-switch-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		background: white;
		border-radius: 50%;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.theme-switch-content {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 10px;
		color: var(--color-text-secondary);
	}

	/* Sizes */
	.theme-switch-sm .theme-switch-track {
		width: 32px;
		height: 18px;
	}

	.theme-switch-sm .theme-switch-thumb {
		width: 14px;
		height: 14px;
	}

	.theme-switch-md .theme-switch-track {
		width: 40px;
		height: 22px;
	}

	.theme-switch-md .theme-switch-thumb {
		width: 18px;
		height: 18px;
	}

	.theme-switch-lg .theme-switch-track {
		width: 48px;
		height: 26px;
	}

	.theme-switch-lg .theme-switch-thumb {
		width: 22px;
		height: 22px;
	}

	.theme-switch-xl .theme-switch-track {
		width: 56px;
		height: 30px;
	}

	.theme-switch-xl .theme-switch-thumb {
		width: 26px;
		height: 26px;
	}

	/* States */
	.theme-switch-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-switch-disabled .theme-switch-track {
		background: var(--color-border-light) !important;
	}

	.theme-switch-disabled .theme-switch-thumb {
		background: var(--color-text-muted);
	}

	/* Hover effects */
	.theme-switch:not(.theme-switch-disabled):hover .theme-switch-track {
		box-shadow: 0 0 0 2px var(--color-primary-light);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-switch-sm .theme-switch-track {
			width: 28px;
			height: 16px;
		}

		.theme-switch-sm .theme-switch-thumb {
			width: 12px;
			height: 12px;
		}

		.theme-switch-md .theme-switch-track {
			width: 36px;
			height: 20px;
		}

		.theme-switch-md .theme-switch-thumb {
			width: 16px;
			height: 16px;
		}

		.theme-switch-lg .theme-switch-track {
			width: 44px;
			height: 24px;
		}

		.theme-switch-lg .theme-switch-thumb {
			width: 20px;
			height: 20px;
		}

		.theme-switch-xl .theme-switch-track {
			width: 52px;
			height: 28px;
		}

		.theme-switch-xl .theme-switch-thumb {
			width: 24px;
			height: 24px;
		}
	}
</style>
