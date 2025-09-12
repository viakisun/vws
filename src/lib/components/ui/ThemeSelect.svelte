<script lang="ts">
	// Props
	interface Props {
		variant?: 'default' | 'filled' | 'outlined' | 'underlined';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		error?: boolean;
		success?: boolean;
		label?: string;
		helper?: string;
		errorMessage?: string;
		successMessage?: string;
		id?: string;
		class?: string;
		onchange?: (event: Event) => void;
		onfocus?: (event: Event) => void;
		onblur?: (event: Event) => void;
		children?: any;
	}

	let {
		variant = 'default',
		size = 'md',
		placeholder = '',
		value = '',
		disabled = false,
		readonly = false,
		required = false,
		error = false,
		success = false,
		label = '',
		helper = '',
		errorMessage = '',
		successMessage = '',
		id = '',
		class: className = '',
		onchange,
		onfocus,
		onblur,
		children,
		...restProps
	}: Props = $props();

	// Get select classes
	function getSelectClasses(): string {
		const baseClasses = 'theme-select';
		const variantClass = `theme-select-${variant}`;
		const sizeClass = `theme-select-${size}`;
		const stateClasses = [
			error ? 'theme-select-error' : '',
			success ? 'theme-select-success' : '',
			disabled ? 'theme-select-disabled' : '',
			readonly ? 'theme-select-readonly' : ''
		].filter(Boolean).join(' ');

		return [baseClasses, variantClass, sizeClass, stateClasses, className].filter(Boolean).join(' ');
	}

	// Get container classes
	function getContainerClasses(): string {
		const baseClasses = 'theme-select-container';
		const stateClasses = [
			error ? 'theme-select-container-error' : '',
			success ? 'theme-select-container-success' : '',
			disabled ? 'theme-select-container-disabled' : ''
		].filter(Boolean).join(' ');

		return [baseClasses, ...stateClasses].filter(Boolean).join(' ');
	}

	// Get message classes
	function getMessageClasses(): string {
		const baseClasses = 'theme-select-message';
		const stateClasses = [
			error ? 'theme-select-message-error' : '',
			success ? 'theme-select-message-success' : ''
		].filter(Boolean).join(' ');

		return [baseClasses, ...stateClasses].filter(Boolean).join(' ');
	}

	// Get message text
	function getMessageText(): string {
		if (error && errorMessage) return errorMessage;
		if (success && successMessage) return successMessage;
		if (helper) return helper;
		return '';
	}

	// Get message icon
	function getMessageIcon(): string {
		if (error) return '⚠️';
		if (success) return '✅';
		return '';
	}
</script>

<div class={getContainerClasses()}>
	{#if label}
		<label class="theme-select-label" for={id}>
			{label}
			{#if required}
				<span class="theme-select-required">*</span>
			{/if}
		</label>
	{/if}

	<div class="theme-select-wrapper">
		<select
			id={id}
			class={getSelectClasses()}
			{value}
			{disabled}
			{required}
			onchange={onchange}
			onfocus={onfocus}
			onblur={onblur}
			{...restProps}
		>
			{#if placeholder}
				<option value="" disabled>{placeholder}</option>
			{/if}
			{@render children?.()}
		</select>

		<div class="theme-select-arrow">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M6 9l6 6 6-6"/>
			</svg>
		</div>
	</div>

	{#if getMessageText()}
		<div class={getMessageClasses()}>
			{#if getMessageIcon()}
				<span class="theme-select-message-icon">{getMessageIcon()}</span>
			{/if}
			<span class="theme-select-message-text">{getMessageText()}</span>
		</div>
	{/if}
</div>

<style>
	.theme-select-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.theme-select-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.theme-select-required {
		color: var(--color-error);
		font-weight: 600;
	}

	.theme-select-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.theme-select {
		width: 100%;
		background: var(--color-input-background);
		border: 1px solid var(--color-input-border);
		border-radius: 8px;
		font-size: 14px;
		color: var(--color-text);
		transition: all 0.2s ease;
		font-family: inherit;
		cursor: pointer;
		appearance: none;
		background-image: none;
	}

	.theme-select:focus {
		outline: none;
		border-color: var(--color-input-focus);
		box-shadow: 0 0 0 2px var(--color-primary-light);
	}

	.theme-select option {
		background: var(--color-surface);
		color: var(--color-text);
		padding: 8px 12px;
	}

	/* Variants */
	.theme-select-default {
		background: var(--color-input-background);
		border: 1px solid var(--color-input-border);
	}

	.theme-select-filled {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.theme-select-outlined {
		background: transparent;
		border: 2px solid var(--color-input-border);
	}

	.theme-select-underlined {
		background: transparent;
		border: none;
		border-bottom: 2px solid var(--color-input-border);
		border-radius: 0;
	}

	/* Sizes */
	.theme-select-sm {
		padding: 8px 32px 8px 12px;
		font-size: 12px;
		min-height: 32px;
	}

	.theme-select-md {
		padding: 10px 36px 10px 14px;
		font-size: 14px;
		min-height: 40px;
	}

	.theme-select-lg {
		padding: 12px 40px 12px 16px;
		font-size: 16px;
		min-height: 48px;
	}

	.theme-select-xl {
		padding: 14px 44px 14px 18px;
		font-size: 18px;
		min-height: 56px;
	}

	/* States */
	.theme-select-error {
		border-color: var(--color-error);
	}

	.theme-select-error:focus {
		border-color: var(--color-error);
		box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
	}

	.theme-select-success {
		border-color: var(--color-success);
	}

	.theme-select-success:focus {
		border-color: var(--color-success);
		box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
	}

	.theme-select-disabled {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-select-readonly {
		background: var(--color-border-light);
		cursor: default;
	}

	/* Arrow */
	.theme-select-arrow {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-text-secondary);
		transition: color 0.2s ease;
	}

	.theme-select-arrow svg {
		width: 16px;
		height: 16px;
	}

	.theme-select:focus + .theme-select-arrow {
		color: var(--color-primary);
	}

	/* Container states */
	.theme-select-container-error .theme-select-label {
		color: var(--color-error);
	}

	.theme-select-container-success .theme-select-label {
		color: var(--color-success);
	}

	.theme-select-container-disabled .theme-select-label {
		color: var(--color-text-muted);
	}

	/* Message */
	.theme-select-message {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		margin-top: 4px;
	}

	.theme-select-message-error {
		color: var(--color-error);
	}

	.theme-select-message-success {
		color: var(--color-success);
	}

	.theme-select-message:not(.theme-select-message-error):not(.theme-select-message-success) {
		color: var(--color-text-secondary);
	}

	.theme-select-message-icon {
		font-size: 14px;
		line-height: 1;
	}

	.theme-select-message-text {
		flex: 1;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-select-sm {
			padding: 6px 28px 6px 10px;
			font-size: 11px;
			min-height: 28px;
		}

		.theme-select-md {
			padding: 8px 32px 8px 12px;
			font-size: 13px;
			min-height: 36px;
		}

		.theme-select-lg {
			padding: 10px 36px 10px 14px;
			font-size: 15px;
			min-height: 44px;
		}

		.theme-select-xl {
			padding: 12px 40px 12px 16px;
			font-size: 17px;
			min-height: 52px;
		}

		.theme-select-arrow {
			right: 10px;
		}

		.theme-select-arrow svg {
			width: 14px;
			height: 14px;
		}
	}
</style>
