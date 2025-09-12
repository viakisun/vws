<script lang="ts">
	// Props
	interface Props {
		src?: string;
		alt?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl' | '10xl';
		shape?: 'circle' | 'square' | 'rounded';
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
		fallback?: string;
		class?: string;
		children?: any;
	}

	let {
		src = '',
		alt = '',
		size = 'md',
		shape = 'circle',
		variant = 'default',
		fallback = '',
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	// Get avatar classes
	function getAvatarClasses(): string {
		const baseClasses = 'theme-avatar';
		const sizeClass = `theme-avatar-${size}`;
		const shapeClass = `theme-avatar-${shape}`;
		const variantClass = `theme-avatar-${variant}`;

		return [baseClasses, sizeClass, shapeClass, variantClass, className].filter(Boolean).join(' ');
	}

	// Get fallback text
	function getFallbackText(): string {
		if (fallback) return fallback;
		if (alt) return alt.charAt(0).toUpperCase();
		return '?';
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
</script>

<div class={getAvatarClasses()} {...restProps}>
	{#if src}
		<img
			src={src}
			alt={alt}
			class="theme-avatar-image"
			onerror={(e) => {
				const target = e.currentTarget as HTMLImageElement;
				const fallback = target.nextElementSibling as HTMLElement;
				target.style.display = 'none';
				if (fallback) {
					fallback.style.display = 'flex';
				}
			}}
		/>
	{/if}
	
	<div class="theme-avatar-fallback" style="background: {getColor()}; color: white;">
		{getFallbackText()}
	</div>

	{#if children}
		<div class="theme-avatar-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	/* Sizes */
	.theme-avatar-sm {
		width: 24px;
		height: 24px;
		font-size: 10px;
	}

	.theme-avatar-md {
		width: 32px;
		height: 32px;
		font-size: 12px;
	}

	.theme-avatar-lg {
		width: 40px;
		height: 40px;
		font-size: 14px;
	}

	.theme-avatar-xl {
		width: 48px;
		height: 48px;
		font-size: 16px;
	}

	.theme-avatar-2xl {
		width: 56px;
		height: 56px;
		font-size: 18px;
	}

	.theme-avatar-3xl {
		width: 64px;
		height: 64px;
		font-size: 20px;
	}

	.theme-avatar-4xl {
		width: 72px;
		height: 72px;
		font-size: 22px;
	}

	.theme-avatar-5xl {
		width: 80px;
		height: 80px;
		font-size: 24px;
	}

	.theme-avatar-6xl {
		width: 88px;
		height: 88px;
		font-size: 26px;
	}

	.theme-avatar-7xl {
		width: 96px;
		height: 96px;
		font-size: 28px;
	}

	.theme-avatar-8xl {
		width: 104px;
		height: 104px;
		font-size: 30px;
	}

	.theme-avatar-9xl {
		width: 112px;
		height: 112px;
		font-size: 32px;
	}

	.theme-avatar-10xl {
		width: 120px;
		height: 120px;
		font-size: 34px;
	}

	/* Shapes */
	.theme-avatar-circle {
		border-radius: 50%;
	}

	.theme-avatar-square {
		border-radius: 0;
	}

	.theme-avatar-rounded {
		border-radius: 8px;
	}

	/* Image */
	.theme-avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Fallback */
	.theme-avatar-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Children (badges, status indicators, etc.) */
	.theme-avatar-children {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.theme-avatar-children :global(*) {
		pointer-events: auto;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-avatar-sm {
			width: 20px;
			height: 20px;
			font-size: 9px;
		}

		.theme-avatar-md {
			width: 28px;
			height: 28px;
			font-size: 11px;
		}

		.theme-avatar-lg {
			width: 36px;
			height: 36px;
			font-size: 13px;
		}

		.theme-avatar-xl {
			width: 44px;
			height: 44px;
			font-size: 15px;
		}

		.theme-avatar-2xl {
			width: 52px;
			height: 52px;
			font-size: 17px;
		}

		.theme-avatar-3xl {
			width: 60px;
			height: 60px;
			font-size: 19px;
		}

		.theme-avatar-4xl {
			width: 68px;
			height: 68px;
			font-size: 21px;
		}

		.theme-avatar-5xl {
			width: 76px;
			height: 76px;
			font-size: 23px;
		}

		.theme-avatar-6xl {
			width: 84px;
			height: 84px;
			font-size: 25px;
		}

		.theme-avatar-7xl {
			width: 92px;
			height: 92px;
			font-size: 27px;
		}

		.theme-avatar-8xl {
			width: 100px;
			height: 100px;
			font-size: 29px;
		}

		.theme-avatar-9xl {
			width: 108px;
			height: 108px;
			font-size: 31px;
		}

		.theme-avatar-10xl {
			width: 116px;
			height: 116px;
			font-size: 33px;
		}
	}
</style>
