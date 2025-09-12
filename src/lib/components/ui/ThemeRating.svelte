<script lang="ts">
	// Props
	interface Props {
		value?: number;
		max?: number;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		readonly?: boolean;
		class?: string;
		onchange?: (value: number) => void;
		children?: any;
	}

	let {
		value = 0,
		max = 5,
		size = 'md',
		variant = 'default',
		readonly = false,
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Get rating classes
	function getRatingClasses(): string {
		const baseClasses = 'theme-rating';
		const sizeClass = `theme-rating-${size}`;
		const variantClass = `theme-rating-${variant}`;
		const readonlyClass = readonly ? 'theme-rating-readonly' : '';

		return [baseClasses, sizeClass, variantClass, readonlyClass, className].filter(Boolean).join(' ');
	}

	// Get star classes
	function getStarClasses(index: number): string {
		const baseClasses = 'theme-rating-star';
		const sizeClass = `theme-rating-star-${size}`;
		const variantClass = `theme-rating-star-${variant}`;
		const activeClass = index < value ? 'theme-rating-star-active' : '';

		return [baseClasses, sizeClass, variantClass, activeClass].filter(Boolean).join(' ');
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

	// Handle star click
	function handleStarClick(index: number) {
		if (readonly) return;
		
		value = index + 1;
		if (onchange) {
			onchange(value);
		}
	}

	// Handle star hover
	function handleStarHover(index: number) {
		if (readonly) return;
		// You can add hover effects here if needed
	}

	// Handle star leave
	function handleStarLeave() {
		if (readonly) return;
		// You can add leave effects here if needed
	}

	// Generate stars
	function generateStars(): number[] {
		return Array.from({ length: max }, (_, i) => i);
	}
</script>

<div class={getRatingClasses()} {...restProps}>
	{#each generateStars() as index}
		<button
			class={getStarClasses(index)}
			onclick={() => handleStarClick(index)}
			onmouseenter={() => handleStarHover(index)}
			onmouseleave={handleStarLeave}
			disabled={readonly}
			aria-label="Rate {index + 1} star{index + 1 === 1 ? '' : 's'}"
			aria-pressed={index < value}
		>
			<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1">
				<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
			</svg>
		</button>
	{/each}

	{#if children}
		<div class="theme-rating-content">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-rating {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.theme-rating-star {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-rating-star:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-rating-star:hover {
		transform: scale(1.1);
	}

	.theme-rating-star-active {
		color: var(--color-primary);
	}

	.theme-rating-content {
		margin-left: 8px;
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	/* Sizes */
	.theme-rating-sm .theme-rating-star {
		width: 16px;
		height: 16px;
	}

	.theme-rating-sm .theme-rating-star svg {
		width: 16px;
		height: 16px;
	}

	.theme-rating-sm .theme-rating-content {
		font-size: 12px;
	}

	.theme-rating-md .theme-rating-star {
		width: 20px;
		height: 20px;
	}

	.theme-rating-md .theme-rating-star svg {
		width: 20px;
		height: 20px;
	}

	.theme-rating-md .theme-rating-content {
		font-size: 14px;
	}

	.theme-rating-lg .theme-rating-star {
		width: 24px;
		height: 24px;
	}

	.theme-rating-lg .theme-rating-star svg {
		width: 24px;
		height: 24px;
	}

	.theme-rating-lg .theme-rating-content {
		font-size: 16px;
	}

	.theme-rating-xl .theme-rating-star {
		width: 28px;
		height: 28px;
	}

	.theme-rating-xl .theme-rating-star svg {
		width: 28px;
		height: 28px;
	}

	.theme-rating-xl .theme-rating-content {
		font-size: 18px;
	}

	/* Variants */
	.theme-rating-star-success.theme-rating-star-active {
		color: var(--color-success);
	}

	.theme-rating-star-warning.theme-rating-star-active {
		color: var(--color-warning);
	}

	.theme-rating-star-error.theme-rating-star-active {
		color: var(--color-error);
	}

	.theme-rating-star-info.theme-rating-star-active {
		color: var(--color-info);
	}

	/* Readonly state */
	.theme-rating-readonly .theme-rating-star {
		cursor: default;
	}

	.theme-rating-readonly .theme-rating-star:hover {
		transform: none;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-rating {
			gap: 2px;
		}

		.theme-rating-sm .theme-rating-star {
			width: 14px;
			height: 14px;
		}

		.theme-rating-sm .theme-rating-star svg {
			width: 14px;
			height: 14px;
		}

		.theme-rating-sm .theme-rating-content {
			font-size: 11px;
		}

		.theme-rating-md .theme-rating-star {
			width: 18px;
			height: 18px;
		}

		.theme-rating-md .theme-rating-star svg {
			width: 18px;
			height: 18px;
		}

		.theme-rating-md .theme-rating-content {
			font-size: 13px;
		}

		.theme-rating-lg .theme-rating-star {
			width: 22px;
			height: 22px;
		}

		.theme-rating-lg .theme-rating-star svg {
			width: 22px;
			height: 22px;
		}

		.theme-rating-lg .theme-rating-content {
			font-size: 15px;
		}

		.theme-rating-xl .theme-rating-star {
			width: 26px;
			height: 26px;
		}

		.theme-rating-xl .theme-rating-star svg {
			width: 26px;
			height: 26px;
		}

		.theme-rating-xl .theme-rating-content {
			font-size: 17px;
		}
	}
</style>
