<script lang="ts">
	// Props
	interface Props {
		open?: boolean;
		disabled?: boolean;
		variant?: 'default' | 'bordered' | 'filled' | 'ghost';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
		onchange?: (open: boolean) => void;
		children?: any;
	}

	let {
		open = false,
		disabled = false,
		variant = 'default',
		size = 'md',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Get accordion classes
	function getAccordionClasses(): string {
		const baseClasses = 'theme-accordion';
		const variantClass = `theme-accordion-${variant}`;
		const sizeClass = `theme-accordion-${size}`;
		const stateClass = open ? 'theme-accordion-open' : 'theme-accordion-closed';
		const disabledClass = disabled ? 'theme-accordion-disabled' : '';

		return [baseClasses, variantClass, sizeClass, stateClass, disabledClass, className].filter(Boolean).join(' ');
	}

	// Handle toggle
	function handleToggle() {
		if (disabled) return;
		
		open = !open;
		if (onchange) {
			onchange(open);
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

<div class={getAccordionClasses()} {...restProps}>
	<button
		class="theme-accordion-trigger"
		onclick={handleToggle}
		onkeydown={handleKeydown}
		{disabled}
		aria-expanded={open}
		aria-disabled={disabled}
	>
		<div class="theme-accordion-trigger-content">
			{@render children?.()}
		</div>
		
		<div class="theme-accordion-arrow">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M6 9l6 6 6-6"/>
			</svg>
		</div>
	</button>

	<div class="theme-accordion-content" style="display: {open ? 'block' : 'none'};">
		<div class="theme-accordion-content-inner">
			<slot name="content" />
		</div>
	</div>
</div>

<style>
	.theme-accordion {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.theme-accordion-trigger {
		width: 100%;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		transition: all 0.2s ease;
	}

	.theme-accordion-trigger:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-accordion-trigger-content {
		flex: 1;
		text-align: left;
	}

	.theme-accordion-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
		color: var(--color-text-secondary);
	}

	.theme-accordion-open .theme-accordion-arrow {
		transform: rotate(180deg);
	}

	.theme-accordion-arrow svg {
		width: 16px;
		height: 16px;
	}

	.theme-accordion-content {
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.theme-accordion-content-inner {
		padding: 16px;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
	}

	/* Variants */
	.theme-accordion-default {
		/* Default styling is handled by base classes */
	}

	.theme-accordion-bordered {
		border: 2px solid var(--color-border);
	}

	.theme-accordion-filled {
		background: var(--color-surface-elevated);
	}

	.theme-accordion-ghost {
		background: transparent;
		border: none;
	}

	.theme-accordion-ghost .theme-accordion-content-inner {
		background: transparent;
		border-top: none;
	}

	/* Sizes */
	.theme-accordion-sm .theme-accordion-trigger {
		padding: 12px 16px;
	}

	.theme-accordion-sm .theme-accordion-content-inner {
		padding: 12px 16px;
	}

	.theme-accordion-md .theme-accordion-trigger {
		padding: 16px 20px;
	}

	.theme-accordion-md .theme-accordion-content-inner {
		padding: 16px 20px;
	}

	.theme-accordion-lg .theme-accordion-trigger {
		padding: 20px 24px;
	}

	.theme-accordion-lg .theme-accordion-content-inner {
		padding: 20px 24px;
	}

	.theme-accordion-xl .theme-accordion-trigger {
		padding: 24px 28px;
	}

	.theme-accordion-xl .theme-accordion-content-inner {
		padding: 24px 28px;
	}

	/* States */
	.theme-accordion-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-accordion-disabled .theme-accordion-trigger {
		cursor: not-allowed;
	}

	.theme-accordion-disabled .theme-accordion-arrow {
		color: var(--color-text-muted);
	}

	/* Hover effects */
	.theme-accordion:not(.theme-accordion-disabled):hover {
		background: var(--color-surface-elevated);
	}

	.theme-accordion:not(.theme-accordion-disabled):hover .theme-accordion-arrow {
		color: var(--color-text);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-accordion-sm .theme-accordion-trigger {
			padding: 10px 14px;
		}

		.theme-accordion-sm .theme-accordion-content-inner {
			padding: 10px 14px;
		}

		.theme-accordion-md .theme-accordion-trigger {
			padding: 14px 18px;
		}

		.theme-accordion-md .theme-accordion-content-inner {
			padding: 14px 18px;
		}

		.theme-accordion-lg .theme-accordion-trigger {
			padding: 18px 22px;
		}

		.theme-accordion-lg .theme-accordion-content-inner {
			padding: 18px 22px;
		}

		.theme-accordion-xl .theme-accordion-trigger {
			padding: 22px 26px;
		}

		.theme-accordion-xl .theme-accordion-content-inner {
			padding: 22px 26px;
		}

		.theme-accordion-arrow svg {
			width: 14px;
			height: 14px;
		}
	}
</style>
