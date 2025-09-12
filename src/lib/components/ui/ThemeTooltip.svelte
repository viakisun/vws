<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Props
	interface Props {
		content?: string;
		position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
		trigger?: 'hover' | 'click' | 'focus';
		delay?: number;
		disabled?: boolean;
		class?: string;
		children?: any;
	}

	let {
		content = '',
		position = 'top',
		trigger = 'hover',
		delay = 200,
		disabled = false,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	// State
	let isVisible = $state(false);
	let tooltipElement: HTMLElement;
	let triggerElement: HTMLElement;
	let showTimeout: number;
	let hideTimeout: number;

	// Get tooltip classes
	function getTooltipClasses(): string {
		const baseClasses = 'theme-tooltip';
		const positionClass = `theme-tooltip-${position}`;
		const stateClass = isVisible ? 'theme-tooltip-visible' : 'theme-tooltip-hidden';

		return [baseClasses, positionClass, stateClass, className].filter(Boolean).join(' ');
	}

	// Show tooltip
	function showTooltip() {
		if (disabled || !content) return;

		clearTimeout(hideTimeout);
		showTimeout = setTimeout(() => {
			isVisible = true;
		}, delay);
	}

	// Hide tooltip
	function hideTooltip() {
		clearTimeout(showTimeout);
		hideTimeout = setTimeout(() => {
			isVisible = false;
		}, 100);
	}

	// Handle mouse enter
	function handleMouseEnter() {
		if (trigger === 'hover') {
			showTooltip();
		}
	}

	// Handle mouse leave
	function handleMouseLeave() {
		if (trigger === 'hover') {
			hideTooltip();
		}
	}

	// Handle click
	function handleClick() {
		if (trigger === 'click') {
			if (isVisible) {
				hideTooltip();
			} else {
				showTooltip();
			}
		}
	}

	// Handle focus
	function handleFocus() {
		if (trigger === 'focus') {
			showTooltip();
		}
	}

	// Handle blur
	function handleBlur() {
		if (trigger === 'focus') {
			hideTooltip();
		}
	}

	// Handle click outside
	function handleClickOutside(event: MouseEvent) {
		if (trigger === 'click' && !triggerElement?.contains(event.target as Node)) {
			hideTooltip();
		}
	}

	// Update tooltip position
	function updatePosition() {
		if (!tooltipElement || !triggerElement || !isVisible) return;

		const triggerRect = triggerElement.getBoundingClientRect();
		const tooltipRect = tooltipElement.getBoundingClientRect();
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				top = triggerRect.top - tooltipRect.height - 8;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'bottom':
				top = triggerRect.bottom + 8;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'left':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.left - tooltipRect.width - 8;
				break;
			case 'right':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.right + 8;
				break;
			case 'top-left':
				top = triggerRect.top - tooltipRect.height - 8;
				left = triggerRect.left;
				break;
			case 'top-right':
				top = triggerRect.top - tooltipRect.height - 8;
				left = triggerRect.right - tooltipRect.width;
				break;
			case 'bottom-left':
				top = triggerRect.bottom + 8;
				left = triggerRect.left;
				break;
			case 'bottom-right':
				top = triggerRect.bottom + 8;
				left = triggerRect.right - tooltipRect.width;
				break;
		}

		// Keep tooltip within viewport
		if (left < 8) left = 8;
		if (left + tooltipRect.width > viewport.width - 8) {
			left = viewport.width - tooltipRect.width - 8;
		}
		if (top < 8) top = 8;
		if (top + tooltipRect.height > viewport.height - 8) {
			top = viewport.height - tooltipRect.height - 8;
		}

		tooltipElement.style.top = `${top}px`;
		tooltipElement.style.left = `${left}px`;
	}

	// Update position when tooltip becomes visible
	$effect(() => {
		if (isVisible) {
			updatePosition();
		}
	});

	// Add event listeners
	onMount(() => {
		if (trigger === 'click') {
			document.addEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
			clearTimeout(showTimeout);
			clearTimeout(hideTimeout);
		};
	});
</script>

<div
	class="theme-tooltip-trigger"
	bind:this={triggerElement}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleClick}
	onfocus={handleFocus}
	onblur={handleBlur}
	{...restProps}
>
	{@render children?.()}
</div>

{#if content && !disabled}
	<div
		class={getTooltipClasses()}
		bind:this={tooltipElement}
		role="tooltip"
		aria-hidden={!isVisible}
	>
		<div class="theme-tooltip-content">
			{content}
		</div>
		<div class="theme-tooltip-arrow"></div>
	</div>
{/if}

<style>
	.theme-tooltip-trigger {
		display: inline-block;
		position: relative;
	}

	.theme-tooltip {
		position: fixed;
		z-index: 1000;
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		pointer-events: none;
	}

	.theme-tooltip-visible {
		opacity: 1;
		visibility: visible;
	}

	.theme-tooltip-hidden {
		opacity: 0;
		visibility: hidden;
	}

	.theme-tooltip-content {
		background: var(--color-surface-elevated);
		color: var(--color-text);
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 500;
		line-height: 1.4;
		box-shadow: 0 4px 12px var(--color-shadow);
		border: 1px solid var(--color-border);
		max-width: 200px;
		word-wrap: break-word;
	}

	.theme-tooltip-arrow {
		position: absolute;
		width: 0;
		height: 0;
		border: 4px solid transparent;
	}

	/* Arrow positions */
	.theme-tooltip-top .theme-tooltip-arrow {
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		border-top-color: var(--color-border);
	}

	.theme-tooltip-bottom .theme-tooltip-arrow {
		top: -8px;
		left: 50%;
		transform: translateX(-50%);
		border-bottom-color: var(--color-border);
	}

	.theme-tooltip-left .theme-tooltip-arrow {
		right: -8px;
		top: 50%;
		transform: translateY(-50%);
		border-left-color: var(--color-border);
	}

	.theme-tooltip-right .theme-tooltip-arrow {
		left: -8px;
		top: 50%;
		transform: translateY(-50%);
		border-right-color: var(--color-border);
	}

	.theme-tooltip-top-left .theme-tooltip-arrow {
		bottom: -8px;
		left: 12px;
		border-top-color: var(--color-border);
	}

	.theme-tooltip-top-right .theme-tooltip-arrow {
		bottom: -8px;
		right: 12px;
		border-top-color: var(--color-border);
	}

	.theme-tooltip-bottom-left .theme-tooltip-arrow {
		top: -8px;
		left: 12px;
		border-bottom-color: var(--color-border);
	}

	.theme-tooltip-bottom-right .theme-tooltip-arrow {
		top: -8px;
		right: 12px;
		border-bottom-color: var(--color-border);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-tooltip-content {
			font-size: 11px;
			padding: 6px 10px;
			max-width: 150px;
		}

		.theme-tooltip-arrow {
			border-width: 3px;
		}

		.theme-tooltip-top .theme-tooltip-arrow {
			bottom: -6px;
		}

		.theme-tooltip-bottom .theme-tooltip-arrow {
			top: -6px;
		}

		.theme-tooltip-left .theme-tooltip-arrow {
			right: -6px;
		}

		.theme-tooltip-right .theme-tooltip-arrow {
			left: -6px;
		}

		.theme-tooltip-top-left .theme-tooltip-arrow,
		.theme-tooltip-top-right .theme-tooltip-arrow {
			bottom: -6px;
		}

		.theme-tooltip-bottom-left .theme-tooltip-arrow,
		.theme-tooltip-bottom-right .theme-tooltip-arrow {
			top: -6px;
		}
	}

	/* Dark theme specific adjustments */
	[data-theme="dark"] .theme-tooltip-content {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
</style>
