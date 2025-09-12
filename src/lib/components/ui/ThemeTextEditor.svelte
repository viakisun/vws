<script lang="ts">
	// Props
	interface Props {
		value?: string;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (value: string) => void;
		children?: any;
	}

	let {
		value = '',
		disabled = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// State
	let isPreview = $state(false);
	let textareaElement: HTMLTextAreaElement;

	// Get text editor classes
	function getTextEditorClasses(): string {
		const baseClasses = 'theme-texteditor';
		const sizeClass = `theme-texteditor-${size}`;
		const variantClass = `theme-texteditor-${variant}`;
		const disabledClass = disabled ? 'theme-texteditor-disabled' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass, className].filter(Boolean).join(' ');
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

	// Handle input change
	function handleInputChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const newValue = target.value;
		
		value = newValue;
		if (onchange) {
			onchange(newValue);
		}
	}

	// Handle keydown
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Tab') {
			event.preventDefault();
			const target = event.target as HTMLTextAreaElement;
			const start = target.selectionStart;
			const end = target.selectionEnd;
			const newValue = value.substring(0, start) + '  ' + value.substring(end);
			
			value = newValue;
			if (onchange) {
				onchange(newValue);
			}
			
			// Set cursor position after the inserted spaces
			setTimeout(() => {
				target.selectionStart = target.selectionEnd = start + 2;
			}, 0);
		}
	}

	// Toggle preview
	function togglePreview() {
		isPreview = !isPreview;
	}

	// Get text preview
	function getTextPreview(): string {
		return value || 'No content';
	}
</script>

<div class={getTextEditorClasses()} {...restProps}>
	<div class="theme-texteditor-header">
		<div class="theme-texteditor-title">
			Text Editor
		</div>
		
		<div class="theme-texteditor-actions">
			<button
				class="theme-texteditor-toggle"
				onclick={togglePreview}
				{disabled}
				aria-label={isPreview ? 'Edit mode' : 'Preview mode'}
			>
				{#if isPreview}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
						<circle cx="12" cy="12" r="3"/>
					</svg>
				{/if}
			</button>
			
			<button
				class="theme-texteditor-copy"
				onclick={() => navigator.clipboard?.writeText(value)}
				{disabled}
				aria-label="Copy text"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
				</svg>
			</button>
		</div>
	</div>

	<div class="theme-texteditor-content">
		{#if isPreview}
			<div class="theme-texteditor-preview">
				{getTextPreview()}
			</div>
		{:else}
			<textarea
				bind:this={textareaElement}
				class="theme-texteditor-textarea"
				{value}
				{disabled}
				oninput={handleInputChange}
				onkeydown={handleKeydown}
				placeholder="Enter your text here..."
				spellcheck="true"
				autocomplete="off"
				autocapitalize="on"
			></textarea>
		{/if}
	</div>

	{#if children}
		<div class="theme-texteditor-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-texteditor {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}

	.theme-texteditor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--color-surface-elevated);
		border-bottom: 1px solid var(--color-border);
	}

	.theme-texteditor-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-texteditor-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.theme-texteditor-toggle,
	.theme-texteditor-copy {
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

	.theme-texteditor-toggle:hover:not(:disabled),
	.theme-texteditor-copy:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-texteditor-toggle:focus,
	.theme-texteditor-copy:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-texteditor-toggle:disabled,
	.theme-texteditor-copy:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-texteditor-toggle svg,
	.theme-texteditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-texteditor-content {
		position: relative;
	}

	.theme-texteditor-textarea {
		width: 100%;
		background: var(--color-surface);
		border: none;
		padding: 16px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		font-size: 14px;
		line-height: 1.6;
		color: var(--color-text);
		resize: vertical;
		min-height: 200px;
		transition: all 0.2s ease;
	}

	.theme-texteditor-textarea:focus {
		outline: none;
		background: var(--color-surface);
	}

	.theme-texteditor-textarea::placeholder {
		color: var(--color-text-muted);
	}

	.theme-texteditor-preview {
		padding: 16px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		font-size: 14px;
		line-height: 1.6;
		color: var(--color-text);
		min-height: 200px;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.theme-texteditor-children {
		padding: 16px;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
	}

	/* Sizes */
	.theme-texteditor-sm .theme-texteditor-textarea,
	.theme-texteditor-sm .theme-texteditor-preview {
		font-size: 12px;
		padding: 12px;
		min-height: 150px;
	}

	.theme-texteditor-sm .theme-texteditor-header {
		padding: 8px 12px;
	}

	.theme-texteditor-sm .theme-texteditor-title {
		font-size: 12px;
	}

	.theme-texteditor-sm .theme-texteditor-toggle,
	.theme-texteditor-sm .theme-texteditor-copy {
		width: 20px;
		height: 20px;
	}

	.theme-texteditor-sm .theme-texteditor-toggle svg,
	.theme-texteditor-sm .theme-texteditor-copy svg {
		width: 12px;
		height: 12px;
	}

	.theme-texteditor-md .theme-texteditor-textarea,
	.theme-texteditor-md .theme-texteditor-preview {
		font-size: 14px;
		padding: 16px;
		min-height: 200px;
	}

	.theme-texteditor-md .theme-texteditor-header {
		padding: 12px 16px;
	}

	.theme-texteditor-md .theme-texteditor-title {
		font-size: 14px;
	}

	.theme-texteditor-md .theme-texteditor-toggle,
	.theme-texteditor-md .theme-texteditor-copy {
		width: 24px;
		height: 24px;
	}

	.theme-texteditor-md .theme-texteditor-toggle svg,
	.theme-texteditor-md .theme-texteditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-texteditor-lg .theme-texteditor-textarea,
	.theme-texteditor-lg .theme-texteditor-preview {
		font-size: 16px;
		padding: 20px;
		min-height: 250px;
	}

	.theme-texteditor-lg .theme-texteditor-header {
		padding: 16px 20px;
	}

	.theme-texteditor-lg .theme-texteditor-title {
		font-size: 16px;
	}

	.theme-texteditor-lg .theme-texteditor-toggle,
	.theme-texteditor-lg .theme-texteditor-copy {
		width: 28px;
		height: 28px;
	}

	.theme-texteditor-lg .theme-texteditor-toggle svg,
	.theme-texteditor-lg .theme-texteditor-copy svg {
		width: 16px;
		height: 16px;
	}

	.theme-texteditor-xl .theme-texteditor-textarea,
	.theme-texteditor-xl .theme-texteditor-preview {
		font-size: 18px;
		padding: 24px;
		min-height: 300px;
	}

	.theme-texteditor-xl .theme-texteditor-header {
		padding: 20px 24px;
	}

	.theme-texteditor-xl .theme-texteditor-title {
		font-size: 18px;
	}

	.theme-texteditor-xl .theme-texteditor-toggle,
	.theme-texteditor-xl .theme-texteditor-copy {
		width: 32px;
		height: 32px;
	}

	.theme-texteditor-xl .theme-texteditor-toggle svg,
	.theme-texteditor-xl .theme-texteditor-copy svg {
		width: 18px;
		height: 18px;
	}

	/* States */
	.theme-texteditor-disabled .theme-texteditor-textarea {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-texteditor-disabled .theme-texteditor-toggle,
	.theme-texteditor-disabled .theme-texteditor-copy {
		cursor: not-allowed;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-texteditor-textarea,
		.theme-texteditor-preview {
			font-size: 13px;
			padding: 12px;
			min-height: 150px;
		}

		.theme-texteditor-header {
			padding: 8px 12px;
		}

		.theme-texteditor-title {
			font-size: 13px;
		}

		.theme-texteditor-toggle,
		.theme-texteditor-copy {
			width: 20px;
			height: 20px;
		}

		.theme-texteditor-toggle svg,
		.theme-texteditor-copy svg {
			width: 12px;
			height: 12px;
		}

		.theme-texteditor-sm .theme-texteditor-textarea,
		.theme-texteditor-sm .theme-texteditor-preview {
			font-size: 11px;
			padding: 8px;
			min-height: 120px;
		}

		.theme-texteditor-sm .theme-texteditor-header {
			padding: 6px 8px;
		}

		.theme-texteditor-sm .theme-texteditor-title {
			font-size: 11px;
		}

		.theme-texteditor-sm .theme-texteditor-toggle,
		.theme-texteditor-sm .theme-texteditor-copy {
			width: 18px;
			height: 18px;
		}

		.theme-texteditor-sm .theme-texteditor-toggle svg,
		.theme-texteditor-sm .theme-texteditor-copy svg {
			width: 10px;
			height: 10px;
		}

		.theme-texteditor-lg .theme-texteditor-textarea,
		.theme-texteditor-lg .theme-texteditor-preview {
			font-size: 15px;
			padding: 16px;
			min-height: 200px;
		}

		.theme-texteditor-lg .theme-texteditor-header {
			padding: 12px 16px;
		}

		.theme-texteditor-lg .theme-texteditor-title {
			font-size: 15px;
		}

		.theme-texteditor-lg .theme-texteditor-toggle,
		.theme-texteditor-lg .theme-texteditor-copy {
			width: 24px;
			height: 24px;
		}

		.theme-texteditor-lg .theme-texteditor-toggle svg,
		.theme-texteditor-lg .theme-texteditor-copy svg {
			width: 14px;
			height: 14px;
		}

		.theme-texteditor-xl .theme-texteditor-textarea,
		.theme-texteditor-xl .theme-texteditor-preview {
			font-size: 17px;
			padding: 20px;
			min-height: 250px;
		}

		.theme-texteditor-xl .theme-texteditor-header {
			padding: 16px 20px;
		}

		.theme-texteditor-xl .theme-texteditor-title {
			font-size: 17px;
		}

		.theme-texteditor-xl .theme-texteditor-toggle,
		.theme-texteditor-xl .theme-texteditor-copy {
			width: 28px;
			height: 28px;
		}

		.theme-texteditor-xl .theme-texteditor-toggle svg,
		.theme-texteditor-xl .theme-texteditor-copy svg {
			width: 16px;
			height: 16px;
		}
	}
</style>
