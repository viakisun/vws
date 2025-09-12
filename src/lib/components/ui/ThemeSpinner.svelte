<script lang="ts">
	// Props
	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
		speed?: 'slow' | 'normal' | 'fast';
		class?: string;
		children?: any;
	}

	let {
		size = 'md',
		variant = 'default',
		speed = 'normal',
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	// Get spinner classes
	function getSpinnerClasses(): string {
		const baseClasses = 'theme-spinner';
		const sizeClass = `theme-spinner-${size}`;
		const variantClass = `theme-spinner-${variant}`;
		const speedClass = `theme-spinner-${speed}`;

		return [baseClasses, sizeClass, variantClass, speedClass, className].filter(Boolean).join(' ');
	}

	// Get color for variant
	function getColor(): string {
		switch (variant) {
			case 'primary': return 'var(--color-primary)';
			case 'success': return 'var(--color-success)';
			case 'warning': return 'var(--color-warning)';
			case 'error': return 'var(--color-error)';
			case 'info': return 'var(--color-info)';
			default: return 'var(--color-text-secondary)';
		}
	}

	// Get animation duration
	function getAnimationDuration(): string {
		switch (speed) {
			case 'slow': return '2s';
			case 'fast': return '0.5s';
			default: return '1s';
		}
	}
</script>

<div class={getSpinnerClasses()} {...restProps}>
	<svg class="theme-spinner-svg" viewBox="0 0 24 24" fill="none">
		<circle
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-dasharray="60"
			stroke-dashoffset="60"
			style="color: {getColor()}; animation-duration: {getAnimationDuration()};"
		>
			<animate
				attributeName="stroke-dasharray"
				dur={getAnimationDuration()}
				values="0 60;60 0;0 60"
				repeatCount="indefinite"
			/>
			<animate
				attributeName="stroke-dashoffset"
				dur={getAnimationDuration()}
				values="0;-60;-60"
				repeatCount="indefinite"
			/>
		</circle>
	</svg>
	
	{#if children}
		<div class="theme-spinner-content">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.theme-spinner-svg {
		display: block;
	}

	/* Sizes */
	.theme-spinner-sm {
		width: 16px;
		height: 16px;
	}

	.theme-spinner-md {
		width: 24px;
		height: 24px;
	}

	.theme-spinner-lg {
		width: 32px;
		height: 32px;
	}

	.theme-spinner-xl {
		width: 40px;
		height: 40px;
	}

	.theme-spinner-2xl {
		width: 48px;
		height: 48px;
	}

	.theme-spinner-3xl {
		width: 56px;
		height: 56px;
	}

	.theme-spinner-4xl {
		width: 64px;
		height: 64px;
	}

	.theme-spinner-5xl {
		width: 72px;
		height: 72px;
	}

	/* Content */
	.theme-spinner-content {
		margin-left: 8px;
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-spinner-sm {
			width: 14px;
			height: 14px;
		}

		.theme-spinner-md {
			width: 20px;
			height: 20px;
		}

		.theme-spinner-lg {
			width: 28px;
			height: 28px;
		}

		.theme-spinner-xl {
			width: 36px;
			height: 36px;
		}

		.theme-spinner-2xl {
			width: 44px;
			height: 44px;
		}

		.theme-spinner-3xl {
			width: 52px;
			height: 52px;
		}

		.theme-spinner-4xl {
			width: 60px;
			height: 60px;
		}

		.theme-spinner-5xl {
			width: 68px;
			height: 68px;
		}

		.theme-spinner-content {
			font-size: 13px;
		}
	}
</style>
