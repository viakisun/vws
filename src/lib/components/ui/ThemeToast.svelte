<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Props
	interface Props {
		type?: 'success' | 'error' | 'warning' | 'info';
		title?: string;
		message?: string;
		duration?: number;
		closable?: boolean;
		position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
		class?: string;
		onclose?: () => void;
		children?: any;
	}

	let {
		type = 'info',
		title = '',
		message = '',
		duration = 5000,
		closable = true,
		position = 'top-right',
		class: className = '',
		onclose,
		children,
		...restProps
	}: Props = $props();

	// Get toast classes
	function getToastClasses(): string {
		const baseClasses = 'theme-toast';
		const typeClass = `theme-toast-${type}`;
		const positionClass = `theme-toast-${position}`;

		return [baseClasses, typeClass, positionClass, className].filter(Boolean).join(' ');
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

	// Auto close after duration
	onMount(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				handleClose();
			}, duration);

			return () => {
				clearTimeout(timer);
			};
		}
	});
</script>

<div class={getToastClasses()} {...restProps}>
	<div class="theme-toast-content">
		<div class="theme-toast-icon" style="color: {getColor()};">
			{getIcon()}
		</div>
		
		<div class="theme-toast-body">
			{#if title}
				<div class="theme-toast-title">{title}</div>
			{/if}
			{#if message}
				<div class="theme-toast-message">{message}</div>
			{/if}
			{#if children}
				<div class="theme-toast-children">
					{@render children?.()}
				</div>
			{/if}
		</div>

		{#if closable}
			<button class="theme-toast-close" onclick={handleClose} aria-label="Close toast">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Progress bar -->
	{#if duration > 0}
		<div class="theme-toast-progress">
			<div class="theme-toast-progress-bar" style="animation-duration: {duration}ms; background: {getColor()};"></div>
		</div>
	{/if}
</div>

<style>
	.theme-toast {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 10px 25px var(--color-shadow);
		margin-bottom: 12px;
		overflow: hidden;
		position: relative;
		transform: translateX(100%);
		opacity: 0;
		animation: toastSlideIn 0.3s ease forwards;
	}

	.theme-toast-content {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
	}

	.theme-toast-icon {
		font-size: 20px;
		line-height: 1;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.theme-toast-body {
		flex: 1;
		min-width: 0;
	}

	.theme-toast-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 4px;
		line-height: 1.4;
	}

	.theme-toast-message {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.theme-toast-children {
		margin-top: 8px;
	}

	.theme-toast-close {
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

	.theme-toast-close:hover {
		background: var(--color-border);
	}

	.theme-toast-close:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-toast-close svg {
		width: 14px;
		height: 14px;
		color: var(--color-text-secondary);
	}

	.theme-toast-close:hover svg {
		color: var(--color-text);
	}

	/* Progress bar */
	.theme-toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-border);
		overflow: hidden;
	}

	.theme-toast-progress-bar {
		height: 100%;
		width: 100%;
		transform-origin: left;
		animation: toastProgress linear forwards;
	}

	/* Animations */
	@keyframes toastSlideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes toastProgress {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	/* Positions */
	.theme-toast-top-left {
		transform: translateX(-100%);
	}

	.theme-toast-top-center {
		transform: translateY(-100%);
	}

	.theme-toast-top-right {
		transform: translateX(100%);
	}

	.theme-toast-bottom-left {
		transform: translateX(-100%);
	}

	.theme-toast-bottom-center {
		transform: translateY(100%);
	}

	.theme-toast-bottom-right {
		transform: translateX(100%);
	}

	/* Position-specific animations */
	.theme-toast-top-left {
		animation: toastSlideInLeft 0.3s ease forwards;
	}

	.theme-toast-top-center {
		animation: toastSlideInTop 0.3s ease forwards;
	}

	.theme-toast-top-right {
		animation: toastSlideInRight 0.3s ease forwards;
	}

	.theme-toast-bottom-left {
		animation: toastSlideInLeft 0.3s ease forwards;
	}

	.theme-toast-bottom-center {
		animation: toastSlideInBottom 0.3s ease forwards;
	}

	.theme-toast-bottom-right {
		animation: toastSlideInRight 0.3s ease forwards;
	}

	@keyframes toastSlideInLeft {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes toastSlideInTop {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes toastSlideInRight {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes toastSlideInBottom {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-toast {
			margin: 0 16px 12px 16px;
		}

		.theme-toast-content {
			padding: 14px;
			gap: 10px;
		}

		.theme-toast-icon {
			font-size: 18px;
		}

		.theme-toast-title {
			font-size: 13px;
		}

		.theme-toast-message {
			font-size: 12px;
		}

		.theme-toast-close {
			width: 20px;
			height: 20px;
		}

		.theme-toast-close svg {
			width: 12px;
			height: 12px;
		}
	}

	/* Dark theme specific adjustments */
	[data-theme="dark"] .theme-toast {
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	}
</style>
