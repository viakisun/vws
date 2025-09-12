<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Props
	interface Props {
		open?: boolean;
		trigger?: 'hover' | 'click' | 'focus';
		position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		closable?: boolean;
		class?: string;
		onchange?: (open: boolean) => void;
		children?: any;
		triggerElement?: HTMLElement;
	}

	let {
		open = false,
		trigger = 'click',
		position = 'bottom-left',
		size = 'md',
		closable = true,
		class: className = '',
		onchange,
		children,
		triggerElement: externalTrigger,
		...restProps
	}: Props = $props();

	// State
	let dropdownElement: HTMLElement;
	let triggerElement: HTMLElement = externalTrigger || ({} as HTMLElement);
	let isVisible = $state(false);

	// Get dropdown classes
	function getDropdownClasses(): string {
		const baseClasses = 'theme-dropdown';
		const positionClass = `theme-dropdown-${position}`;
		const sizeClass = `theme-dropdown-${size}`;
		const stateClass = isVisible ? 'theme-dropdown-open' : 'theme-dropdown-closed';

		return [baseClasses, positionClass, sizeClass, stateClass, className].filter(Boolean).join(' ');
	}

	// Handle trigger click
	function handleTriggerClick() {
		if (trigger === 'click') {
			toggleDropdown();
		}
	}

	// Handle trigger hover
	function handleTriggerHover() {
		if (trigger === 'hover') {
			showDropdown();
		}
	}

	// Handle trigger leave
	function handleTriggerLeave() {
		if (trigger === 'hover') {
			hideDropdown();
		}
	}

	// Handle trigger focus
	function handleTriggerFocus() {
		if (trigger === 'focus') {
			showDropdown();
		}
	}

	// Handle trigger blur
	function handleTriggerBlur() {
		if (trigger === 'focus') {
			hideDropdown();
		}
	}

	// Toggle dropdown
	function toggleDropdown() {
		if (isVisible) {
			hideDropdown();
		} else {
			showDropdown();
		}
	}

	// Show dropdown
	function showDropdown() {
		isVisible = true;
		if (onchange) {
			onchange(true);
		}
	}

	// Hide dropdown
	function hideDropdown() {
		isVisible = false;
		if (onchange) {
			onchange(false);
		}
	}

	// Handle click outside
	function handleClickOutside(event: MouseEvent) {
		if (closable && !dropdownElement?.contains(event.target as Node)) {
			hideDropdown();
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closable) {
			hideDropdown();
		}
	}

	// Update dropdown position
	function updatePosition() {
		if (!dropdownElement || !triggerElement || !isVisible) return;

		const triggerRect = triggerElement.getBoundingClientRect();
		const dropdownRect = dropdownElement.getBoundingClientRect();
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		let top = 0;
		let left = 0;

		switch (position) {
			case 'bottom-left':
				top = triggerRect.bottom + 8;
				left = triggerRect.left;
				break;
			case 'bottom-right':
				top = triggerRect.bottom + 8;
				left = triggerRect.right - dropdownRect.width;
				break;
			case 'top-left':
				top = triggerRect.top - dropdownRect.height - 8;
				left = triggerRect.left;
				break;
			case 'top-right':
				top = triggerRect.top - dropdownRect.height - 8;
				left = triggerRect.right - dropdownRect.width;
				break;
			case 'left-top':
				top = triggerRect.top;
				left = triggerRect.left - dropdownRect.width - 8;
				break;
			case 'left-bottom':
				top = triggerRect.bottom - dropdownRect.height;
				left = triggerRect.left - dropdownRect.width - 8;
				break;
			case 'right-top':
				top = triggerRect.top;
				left = triggerRect.right + 8;
				break;
			case 'right-bottom':
				top = triggerRect.bottom - dropdownRect.height;
				left = triggerRect.right + 8;
				break;
		}

		// Keep dropdown within viewport
		if (left < 8) left = 8;
		if (left + dropdownRect.width > viewport.width - 8) {
			left = viewport.width - dropdownRect.width - 8;
		}
		if (top < 8) top = 8;
		if (top + dropdownRect.height > viewport.height - 8) {
			top = viewport.height - dropdownRect.height - 8;
		}

		dropdownElement.style.top = `${top}px`;
		dropdownElement.style.left = `${left}px`;
	}

	// Update position when dropdown becomes visible
	$effect(() => {
		if (isVisible) {
			updatePosition();
		}
	});

	// Add event listeners
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if externalTrigger}
	<!-- External trigger mode - just render the dropdown -->
	{#if isVisible}
		<div
			class={getDropdownClasses()}
			bind:this={dropdownElement}
			role="menu"
			aria-hidden={!isVisible}
		>
			{@render children?.()}
		</div>
	{/if}
{:else}
	<!-- Internal trigger mode -->
	<div class="theme-dropdown-container" {...restProps}>
		<div
			class="theme-dropdown-trigger"
			bind:this={triggerElement}
			onclick={handleTriggerClick}
			onmouseenter={handleTriggerHover}
			onmouseleave={handleTriggerLeave}
			onfocus={handleTriggerFocus}
			onblur={handleTriggerBlur}
		>
			{@render children?.()}
		</div>

		{#if isVisible}
			<div
				class={getDropdownClasses()}
				bind:this={dropdownElement}
				role="menu"
				aria-hidden={!isVisible}
			>
				{@render children?.()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.theme-dropdown-container {
		position: relative;
		display: inline-block;
	}

	.theme-dropdown-trigger {
		cursor: pointer;
	}

	.theme-dropdown {
		position: fixed;
		z-index: 1000;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 10px 25px var(--color-shadow);
		opacity: 0;
		visibility: hidden;
		transform: scale(0.95);
		transition: all 0.2s ease;
		pointer-events: none;
	}

	.theme-dropdown-open {
		opacity: 1;
		visibility: visible;
		transform: scale(1);
		pointer-events: auto;
	}

	.theme-dropdown-closed {
		opacity: 0;
		visibility: hidden;
		transform: scale(0.95);
		pointer-events: none;
	}

	.theme-dropdown-content {
		padding: 8px;
		min-width: 120px;
	}

	/* Sizes */
	.theme-dropdown-sm {
		min-width: 100px;
	}

	.theme-dropdown-md {
		min-width: 150px;
	}

	.theme-dropdown-lg {
		min-width: 200px;
	}

	.theme-dropdown-xl {
		min-width: 250px;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-dropdown {
			position: fixed;
			top: 50% !important;
			left: 50% !important;
			transform: translate(-50%, -50%) scale(0.95);
			width: 90vw;
			max-width: 300px;
		}

		.theme-dropdown-open {
			transform: translate(-50%, -50%) scale(1);
		}

		.theme-dropdown-closed {
			transform: translate(-50%, -50%) scale(0.95);
		}

		.theme-dropdown-content {
			padding: 12px;
		}
	}

	/* Dark theme specific adjustments */
	[data-theme="dark"] .theme-dropdown {
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	}
</style>
