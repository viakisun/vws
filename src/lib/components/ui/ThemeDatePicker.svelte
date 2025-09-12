<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import ThemeCalendar from './ThemeCalendar.svelte';

	// Props
	interface Props {
		value?: Date;
		min?: Date;
		max?: Date;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		placeholder?: string;
		format?: string;
		class?: string;
		onchange?: (date: Date) => void;
		children?: any;
	}

	let {
		value = new Date(),
		min,
		max,
		disabled = false,
		size = 'md',
		variant = 'default',
		placeholder = 'Select date',
		format = 'MM/dd/yyyy',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// State
	let isOpen = $state(false);
	let inputValue = $state('');
	let inputElement: HTMLInputElement;

	// Get date picker classes
	function getDatePickerClasses(): string {
		const baseClasses = 'theme-datepicker';
		const sizeClass = `theme-datepicker-${size}`;
		const variantClass = `theme-datepicker-${variant}`;
		const disabledClass = disabled ? 'theme-datepicker-disabled' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass, className].filter(Boolean).join(' ');
	}

	// Get input classes
	function getInputClasses(): string {
		const baseClasses = 'theme-datepicker-input';
		const sizeClass = `theme-datepicker-input-${size}`;
		const variantClass = `theme-datepicker-input-${variant}`;
		const disabledClass = disabled ? 'theme-datepicker-input-disabled' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass].filter(Boolean).join(' ');
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

	// Format date
	function formatDate(date: Date): string {
		if (!date) return '';
		
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		
		return format
			.replace('MM', month)
			.replace('dd', day)
			.replace('yyyy', year.toString());
	}

	// Parse date
	function parseDate(dateString: string): Date | null {
		if (!dateString) return null;
		
		// Simple parsing for MM/dd/yyyy format
		const parts = dateString.split('/');
		if (parts.length === 3) {
			const month = parseInt(parts[0]) - 1;
			const day = parseInt(parts[1]);
			const year = parseInt(parts[2]);
			
			if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
				return new Date(year, month, day);
			}
		}
		
		return null;
	}

	// Handle input change
	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;
		
		const parsedDate = parseDate(inputValue);
		if (parsedDate) {
			value = parsedDate;
			if (onchange) {
				onchange(parsedDate);
			}
		}
	}

	// Handle input focus
	function handleInputFocus() {
		if (!disabled) {
			isOpen = true;
		}
	}

	// Handle input blur
	function handleInputBlur() {
		// Delay closing to allow calendar clicks
		setTimeout(() => {
			isOpen = false;
		}, 200);
	}

	// Handle calendar change
	function handleCalendarChange(date: Date) {
		value = date;
		inputValue = formatDate(date);
		isOpen = false;
		
		if (onchange) {
			onchange(date);
		}
	}

	// Handle click outside
	function handleClickOutside(event: MouseEvent) {
		if (!inputElement?.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	// Update input value when value changes
	$effect(() => {
		if (value) {
			inputValue = formatDate(value);
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

<div class={getDatePickerClasses()} {...restProps}>
	<div class="theme-datepicker-input-container">
		<input
			bind:this={inputElement}
			type="text"
			class={getInputClasses()}
			{placeholder}
			{disabled}
			value={inputValue}
			oninput={handleInputChange}
			onfocus={handleInputFocus}
			onblur={handleInputBlur}
			readonly
		/>
		
		<button
			class="theme-datepicker-button"
			onclick={() => isOpen = !isOpen}
			{disabled}
			aria-label="Open calendar"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
				<line x1="16" y1="2" x2="16" y2="6"/>
				<line x1="8" y1="2" x2="8" y2="6"/>
				<line x1="3" y1="10" x2="21" y2="10"/>
			</svg>
		</button>
	</div>

	{#if isOpen}
		<div class="theme-datepicker-dropdown">
			<ThemeCalendar
				{value}
				{min}
				{max}
				{disabled}
				{size}
				{variant}
				onchange={handleCalendarChange}
			/>
		</div>
	{/if}

	{#if children}
		<div class="theme-datepicker-content">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-datepicker {
		position: relative;
		display: inline-block;
		width: 100%;
	}

	.theme-datepicker-input-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.theme-datepicker-input {
		width: 100%;
		padding: 10px 40px 10px 12px;
		background: var(--color-input-background);
		border: 1px solid var(--color-input-border);
		border-radius: 8px;
		font-size: 14px;
		color: var(--color-text);
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.theme-datepicker-input:focus {
		outline: none;
		border-color: var(--color-input-focus);
		box-shadow: 0 0 0 2px var(--color-primary-light);
	}

	.theme-datepicker-input::placeholder {
		color: var(--color-text-muted);
	}

	.theme-datepicker-button {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
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
		color: var(--color-text-secondary);
	}

	.theme-datepicker-button:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-datepicker-button:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-datepicker-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-datepicker-button svg {
		width: 16px;
		height: 16px;
	}

	.theme-datepicker-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 8px;
		z-index: 1000;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 10px 25px var(--color-shadow);
		animation: dropdownFadeIn 0.2s ease;
	}

	.theme-datepicker-content {
		margin-top: 8px;
	}

	/* Sizes */
	.theme-datepicker-sm .theme-datepicker-input {
		padding: 8px 32px 8px 10px;
		font-size: 12px;
	}

	.theme-datepicker-sm .theme-datepicker-button {
		width: 20px;
		height: 20px;
		right: 6px;
	}

	.theme-datepicker-sm .theme-datepicker-button svg {
		width: 14px;
		height: 14px;
	}

	.theme-datepicker-md .theme-datepicker-input {
		padding: 10px 40px 10px 12px;
		font-size: 14px;
	}

	.theme-datepicker-lg .theme-datepicker-input {
		padding: 12px 48px 12px 14px;
		font-size: 16px;
	}

	.theme-datepicker-lg .theme-datepicker-button {
		width: 28px;
		height: 28px;
		right: 10px;
	}

	.theme-datepicker-lg .theme-datepicker-button svg {
		width: 18px;
		height: 18px;
	}

	.theme-datepicker-xl .theme-datepicker-input {
		padding: 14px 56px 14px 16px;
		font-size: 18px;
	}

	.theme-datepicker-xl .theme-datepicker-button {
		width: 32px;
		height: 32px;
		right: 12px;
	}

	.theme-datepicker-xl .theme-datepicker-button svg {
		width: 20px;
		height: 20px;
	}

	/* States */
	.theme-datepicker-disabled .theme-datepicker-input {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-datepicker-disabled .theme-datepicker-button {
		cursor: not-allowed;
	}

	/* Animations */
	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-datepicker-dropdown {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 90vw;
			max-width: 320px;
		}

		.theme-datepicker-sm .theme-datepicker-input {
			padding: 6px 28px 6px 8px;
			font-size: 11px;
		}

		.theme-datepicker-sm .theme-datepicker-button {
			width: 18px;
			height: 18px;
			right: 4px;
		}

		.theme-datepicker-sm .theme-datepicker-button svg {
			width: 12px;
			height: 12px;
		}

		.theme-datepicker-md .theme-datepicker-input {
			padding: 8px 36px 8px 10px;
			font-size: 13px;
		}

		.theme-datepicker-lg .theme-datepicker-input {
			padding: 10px 44px 10px 12px;
			font-size: 15px;
		}

		.theme-datepicker-xl .theme-datepicker-input {
			padding: 12px 52px 12px 14px;
			font-size: 17px;
		}
	}

	/* Dark theme specific adjustments */
	[data-theme="dark"] .theme-datepicker-dropdown {
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	}
</style>
