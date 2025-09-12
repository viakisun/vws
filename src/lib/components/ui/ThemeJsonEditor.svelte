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
	let isValidJson = $state(true);
	let jsonError = $state('');

	// Get JSON editor classes
	function getJsonEditorClasses(): string {
		const baseClasses = 'theme-jsoneditor';
		const sizeClass = `theme-jsoneditor-${size}`;
		const variantClass = `theme-jsoneditor-${variant}`;
		const disabledClass = disabled ? 'theme-jsoneditor-disabled' : '';
		const errorClass = !isValidJson ? 'theme-jsoneditor-error' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass, errorClass, className].filter(Boolean).join(' ');
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

	// Validate JSON
	function validateJson(jsonString: string): boolean {
		try {
			JSON.parse(jsonString);
			return true;
		} catch (error) {
			return false;
		}
	}

	// Format JSON
	function formatJson(jsonString: string): string {
		try {
			const parsed = JSON.parse(jsonString);
			return JSON.stringify(parsed, null, 2);
		} catch (error) {
			return jsonString;
		}
	}

	// Handle input change
	function handleInputChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const newValue = target.value;
		
		value = newValue;
		isValidJson = validateJson(newValue);
		
		if (!isValidJson) {
			try {
				JSON.parse(newValue);
			} catch (error) {
				jsonError = error instanceof Error ? error.message : 'Invalid JSON';
			}
		} else {
			jsonError = '';
		}
		
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

	// Format JSON
	function formatJsonAction() {
		if (disabled) return;
		
		const formatted = formatJson(value);
		value = formatted;
		isValidJson = true;
		jsonError = '';
		
		if (onchange) {
			onchange(formatted);
		}
	}

	// Get JSON preview
	function getJsonPreview(): string {
		if (!value) return 'No content';
		
		if (isValidJson) {
			try {
				const parsed = JSON.parse(value);
				return JSON.stringify(parsed, null, 2);
			} catch (error) {
				return value;
			}
		} else {
			return value;
		}
	}
</script>

<div class={getJsonEditorClasses()} {...restProps}>
	<div class="theme-jsoneditor-header">
		<div class="theme-jsoneditor-title">
			JSON Editor
		</div>
		
		<div class="theme-jsoneditor-actions">
			<button
				class="theme-jsoneditor-format"
				onclick={formatJsonAction}
				{disabled}
				aria-label="Format JSON"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
					<polyline points="22,6 12,13 2,6"/>
				</svg>
			</button>
			
			<button
				class="theme-jsoneditor-toggle"
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
				class="theme-jsoneditor-copy"
				onclick={() => navigator.clipboard?.writeText(value)}
				{disabled}
				aria-label="Copy JSON"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
				</svg>
			</button>
		</div>
	</div>

	{#if !isValidJson && !isPreview}
		<div class="theme-jsoneditor-error-message">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<line x1="15" y1="9" x2="9" y2="15"/>
				<line x1="9" y1="9" x2="15" y2="15"/>
			</svg>
			<span>Invalid JSON: {jsonError}</span>
		</div>
	{/if}

	<div class="theme-jsoneditor-content">
		{#if isPreview}
			<div class="theme-jsoneditor-preview">
				<pre><code>{getJsonPreview()}</code></pre>
			</div>
		{:else}
			<textarea
				bind:this={textareaElement}
				class="theme-jsoneditor-textarea"
				{value}
				{disabled}
				oninput={handleInputChange}
				onkeydown={handleKeydown}
				placeholder="Enter your JSON here..."
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
			></textarea>
		{/if}
	</div>

	{#if children}
		<div class="theme-jsoneditor-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-jsoneditor {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}

	.theme-jsoneditor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--color-surface-elevated);
		border-bottom: 1px solid var(--color-border);
	}

	.theme-jsoneditor-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-jsoneditor-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.theme-jsoneditor-format,
	.theme-jsoneditor-toggle,
	.theme-jsoneditor-copy {
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

	.theme-jsoneditor-format:hover:not(:disabled),
	.theme-jsoneditor-toggle:hover:not(:disabled),
	.theme-jsoneditor-copy:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-jsoneditor-format:focus,
	.theme-jsoneditor-toggle:focus,
	.theme-jsoneditor-copy:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-jsoneditor-format:disabled,
	.theme-jsoneditor-toggle:disabled,
	.theme-jsoneditor-copy:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-jsoneditor-format svg,
	.theme-jsoneditor-toggle svg,
	.theme-jsoneditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-jsoneditor-error-message {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: var(--color-error-light);
		border-bottom: 1px solid var(--color-error);
		color: var(--color-error);
		font-size: 12px;
		font-weight: 500;
	}

	.theme-jsoneditor-error-message svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.theme-jsoneditor-content {
		position: relative;
	}

	.theme-jsoneditor-textarea {
		width: 100%;
		background: var(--color-code-background);
		border: none;
		padding: 16px;
		font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-text);
		resize: vertical;
		min-height: 200px;
		transition: all 0.2s ease;
	}

	.theme-jsoneditor-textarea:focus {
		outline: none;
		background: var(--color-surface);
	}

	.theme-jsoneditor-textarea::placeholder {
		color: var(--color-text-muted);
	}

	.theme-jsoneditor-preview {
		padding: 16px;
		background: var(--color-code-background);
		min-height: 200px;
		overflow-x: auto;
	}

	.theme-jsoneditor-preview pre {
		margin: 0;
		font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-text);
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.theme-jsoneditor-preview code {
		background: none;
		border: none;
		padding: 0;
		font-size: 14px;
	}

	.theme-jsoneditor-children {
		padding: 16px;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
	}

	/* Sizes */
	.theme-jsoneditor-sm .theme-jsoneditor-textarea,
	.theme-jsoneditor-sm .theme-jsoneditor-preview {
		font-size: 12px;
		padding: 12px;
		min-height: 150px;
	}

	.theme-jsoneditor-sm .theme-jsoneditor-header {
		padding: 8px 12px;
	}

	.theme-jsoneditor-sm .theme-jsoneditor-title {
		font-size: 12px;
	}

	.theme-jsoneditor-sm .theme-jsoneditor-format,
	.theme-jsoneditor-sm .theme-jsoneditor-toggle,
	.theme-jsoneditor-sm .theme-jsoneditor-copy {
		width: 20px;
		height: 20px;
	}

	.theme-jsoneditor-sm .theme-jsoneditor-format svg,
	.theme-jsoneditor-sm .theme-jsoneditor-toggle svg,
	.theme-jsoneditor-sm .theme-jsoneditor-copy svg {
		width: 12px;
		height: 12px;
	}

	.theme-jsoneditor-md .theme-jsoneditor-textarea,
	.theme-jsoneditor-md .theme-jsoneditor-preview {
		font-size: 14px;
		padding: 16px;
		min-height: 200px;
	}

	.theme-jsoneditor-md .theme-jsoneditor-header {
		padding: 12px 16px;
	}

	.theme-jsoneditor-md .theme-jsoneditor-title {
		font-size: 14px;
	}

	.theme-jsoneditor-md .theme-jsoneditor-format,
	.theme-jsoneditor-md .theme-jsoneditor-toggle,
	.theme-jsoneditor-md .theme-jsoneditor-copy {
		width: 24px;
		height: 24px;
	}

	.theme-jsoneditor-md .theme-jsoneditor-format svg,
	.theme-jsoneditor-md .theme-jsoneditor-toggle svg,
	.theme-jsoneditor-md .theme-jsoneditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-jsoneditor-lg .theme-jsoneditor-textarea,
	.theme-jsoneditor-lg .theme-jsoneditor-preview {
		font-size: 16px;
		padding: 20px;
		min-height: 250px;
	}

	.theme-jsoneditor-lg .theme-jsoneditor-header {
		padding: 16px 20px;
	}

	.theme-jsoneditor-lg .theme-jsoneditor-title {
		font-size: 16px;
	}

	.theme-jsoneditor-lg .theme-jsoneditor-format,
	.theme-jsoneditor-lg .theme-jsoneditor-toggle,
	.theme-jsoneditor-lg .theme-jsoneditor-copy {
		width: 28px;
		height: 28px;
	}

	.theme-jsoneditor-lg .theme-jsoneditor-format svg,
	.theme-jsoneditor-lg .theme-jsoneditor-toggle svg,
	.theme-jsoneditor-lg .theme-jsoneditor-copy svg {
		width: 16px;
		height: 16px;
	}

	.theme-jsoneditor-xl .theme-jsoneditor-textarea,
	.theme-jsoneditor-xl .theme-jsoneditor-preview {
		font-size: 18px;
		padding: 24px;
		min-height: 300px;
	}

	.theme-jsoneditor-xl .theme-jsoneditor-header {
		padding: 20px 24px;
	}

	.theme-jsoneditor-xl .theme-jsoneditor-title {
		font-size: 18px;
	}

	.theme-jsoneditor-xl .theme-jsoneditor-format,
	.theme-jsoneditor-xl .theme-jsoneditor-toggle,
	.theme-jsoneditor-xl .theme-jsoneditor-copy {
		width: 32px;
		height: 32px;
	}

	.theme-jsoneditor-xl .theme-jsoneditor-format svg,
	.theme-jsoneditor-xl .theme-jsoneditor-toggle svg,
	.theme-jsoneditor-xl .theme-jsoneditor-copy svg {
		width: 18px;
		height: 18px;
	}

	/* States */
	.theme-jsoneditor-disabled .theme-jsoneditor-textarea {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-jsoneditor-disabled .theme-jsoneditor-format,
	.theme-jsoneditor-disabled .theme-jsoneditor-toggle,
	.theme-jsoneditor-disabled .theme-jsoneditor-copy {
		cursor: not-allowed;
	}

	.theme-jsoneditor-error {
		border-color: var(--color-error);
	}

	.theme-jsoneditor-error .theme-jsoneditor-textarea {
		border-color: var(--color-error);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-jsoneditor-textarea,
		.theme-jsoneditor-preview {
			font-size: 13px;
			padding: 12px;
			min-height: 150px;
		}

		.theme-jsoneditor-header {
			padding: 8px 12px;
		}

		.theme-jsoneditor-title {
			font-size: 13px;
		}

		.theme-jsoneditor-format,
		.theme-jsoneditor-toggle,
		.theme-jsoneditor-copy {
			width: 20px;
			height: 20px;
		}

		.theme-jsoneditor-format svg,
		.theme-jsoneditor-toggle svg,
		.theme-jsoneditor-copy svg {
			width: 12px;
			height: 12px;
		}

		.theme-jsoneditor-sm .theme-jsoneditor-textarea,
		.theme-jsoneditor-sm .theme-jsoneditor-preview {
			font-size: 11px;
			padding: 8px;
			min-height: 120px;
		}

		.theme-jsoneditor-sm .theme-jsoneditor-header {
			padding: 6px 8px;
		}

		.theme-jsoneditor-sm .theme-jsoneditor-title {
			font-size: 11px;
		}

		.theme-jsoneditor-sm .theme-jsoneditor-format,
		.theme-jsoneditor-sm .theme-jsoneditor-toggle,
		.theme-jsoneditor-sm .theme-jsoneditor-copy {
			width: 18px;
			height: 18px;
		}

		.theme-jsoneditor-sm .theme-jsoneditor-format svg,
		.theme-jsoneditor-sm .theme-jsoneditor-toggle svg,
		.theme-jsoneditor-sm .theme-jsoneditor-copy svg {
			width: 10px;
			height: 10px;
		}

		.theme-jsoneditor-lg .theme-jsoneditor-textarea,
		.theme-jsoneditor-lg .theme-jsoneditor-preview {
			font-size: 15px;
			padding: 16px;
			min-height: 200px;
		}

		.theme-jsoneditor-lg .theme-jsoneditor-header {
			padding: 12px 16px;
		}

		.theme-jsoneditor-lg .theme-jsoneditor-title {
			font-size: 15px;
		}

		.theme-jsoneditor-lg .theme-jsoneditor-format,
		.theme-jsoneditor-lg .theme-jsoneditor-toggle,
		.theme-jsoneditor-lg .theme-jsoneditor-copy {
			width: 24px;
			height: 24px;
		}

		.theme-jsoneditor-lg .theme-jsoneditor-format svg,
		.theme-jsoneditor-lg .theme-jsoneditor-toggle svg,
		.theme-jsoneditor-lg .theme-jsoneditor-copy svg {
			width: 14px;
			height: 14px;
		}

		.theme-jsoneditor-xl .theme-jsoneditor-textarea,
		.theme-jsoneditor-xl .theme-jsoneditor-preview {
			font-size: 17px;
			padding: 20px;
			min-height: 250px;
		}

		.theme-jsoneditor-xl .theme-jsoneditor-header {
			padding: 16px 20px;
		}

		.theme-jsoneditor-xl .theme-jsoneditor-title {
			font-size: 17px;
		}

		.theme-jsoneditor-xl .theme-jsoneditor-format,
		.theme-jsoneditor-xl .theme-jsoneditor-toggle,
		.theme-jsoneditor-xl .theme-jsoneditor-copy {
			width: 28px;
			height: 28px;
		}

		.theme-jsoneditor-xl .theme-jsoneditor-format svg,
		.theme-jsoneditor-xl .theme-jsoneditor-toggle svg,
		.theme-jsoneditor-xl .theme-jsoneditor-copy svg {
			width: 16px;
			height: 16px;
		}
	}
</style>
