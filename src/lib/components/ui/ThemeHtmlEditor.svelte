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
	let textareaElement = $state<HTMLTextAreaElement>();
	let isValidHtml = $state(true);
	let htmlError = $state('');
	let selectedFiles = $state<FileList | null>(null);

	// Get HTML editor classes
	function getHtmlEditorClasses(): string {
		const baseClasses = 'theme-htmleditor';
		const sizeClass = `theme-htmleditor-${size}`;
		const variantClass = `theme-htmleditor-${variant}`;
		const disabledClass = disabled ? 'theme-htmleditor-disabled' : '';
		const errorClass = !isValidHtml ? 'theme-htmleditor-error' : '';

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

	// Validate HTML
	function validateHtml(htmlString: string): boolean {
		try {
			if (!htmlString.trim()) return true;
			
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlString, 'text/html');
			const parserError = doc.querySelector('parsererror');
			return !parserError;
		} catch (error) {
			return false;
		}
	}

	// Format HTML
	function formatHtml(htmlString: string): string {
		try {
			if (!htmlString.trim()) return htmlString;
			
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlString, 'text/html');
			const parserError = doc.querySelector('parsererror');
			
			if (parserError) {
				return htmlString;
			}
			
			// Simple HTML formatting
			let formatted = htmlString
				.replace(/>\s+</g, '><')
				.replace(/></g, '>\n<')
				.trim();
			
			// Add proper indentation
			const lines = formatted.split('\n');
			const formattedLines: string[] = [];
			let indentLevel = 0;
			
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) {
					formattedLines.push('');
					continue;
				}
				
				// Decrease indent for closing tags
				if (trimmed.startsWith('</')) {
					indentLevel = Math.max(0, indentLevel - 1);
				}
				
				const indent = '  '.repeat(indentLevel);
				formattedLines.push(indent + trimmed);
				
				// Increase indent for opening tags (but not self-closing tags)
				if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
					indentLevel++;
				}
			}
			
			return formattedLines.join('\n');
		} catch (error) {
			return htmlString;
		}
	}

	// Handle input change
	function handleInputChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const newValue = target.value;
		
		value = newValue;
		isValidHtml = validateHtml(newValue);
		
		if (!isValidHtml) {
			try {
				const parser = new DOMParser();
				const doc = parser.parseFromString(newValue, 'text/html');
				const parserError = doc.querySelector('parsererror');
				if (parserError) {
					htmlError = parserError.textContent || 'Invalid HTML';
				} else {
					htmlError = 'Invalid HTML';
				}
			} catch (error) {
				htmlError = error instanceof Error ? error.message : 'Invalid HTML';
			}
		} else {
			htmlError = '';
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

	// Format HTML
	function formatHtmlAction() {
		if (disabled) return;
		
		const formatted = formatHtml(value);
		value = formatted;
		isValidHtml = true;
		htmlError = '';
		
		if (onchange) {
			onchange(formatted);
		}
	}

	// Get HTML preview
	function getHtmlPreview(): string {
		if (!value) return 'No content';
		
		if (isValidHtml) {
			return formatHtml(value);
		} else {
			return value;
		}
	}

	// Get HTML render preview
	function getHtmlRenderPreview(): string {
		if (!value) return '<p>No content</p>';
		
		if (isValidHtml) {
			return value;
		} else {
			return '<p>Invalid HTML</p>';
		}
	}
</script>

<div class={getHtmlEditorClasses()} {...restProps}>
	<div class="theme-htmleditor-header">
		<div class="theme-htmleditor-title">
			HTML Editor
		</div>
		
		<div class="theme-htmleditor-actions">
			<button
				class="theme-htmleditor-format"
				onclick={formatHtmlAction}
				{disabled}
				aria-label="Format HTML"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
					<polyline points="22,6 12,13 2,6"/>
				</svg>
			</button>
			
			<button
				class="theme-htmleditor-toggle"
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
				class="theme-htmleditor-copy"
				onclick={() => navigator.clipboard?.writeText(value)}
				{disabled}
				aria-label="Copy HTML"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
				</svg>
			</button>
		</div>
	</div>

	{#if !isValidHtml && !isPreview}
		<div class="theme-htmleditor-error-message">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<line x1="15" y1="9" x2="9" y2="15"/>
				<line x1="9" y1="9" x2="15" y2="15"/>
			</svg>
			<span>Invalid HTML: {htmlError}</span>
		</div>
	{/if}

	<div class="theme-htmleditor-content">
		{#if isPreview}
			<div class="theme-htmleditor-preview">
				{#if isValidHtml}
					<div class="html-render-preview">
						{@html getHtmlRenderPreview()}
					</div>
				{:else}
					<pre><code>{getHtmlPreview()}</code></pre>
				{/if}
			</div>
		{:else}
			<textarea
				bind:this={textareaElement}
				class="theme-htmleditor-textarea"
				{value}
				{disabled}
				oninput={handleInputChange}
				onkeydown={handleKeydown}
				placeholder="Enter your HTML here..."
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
			></textarea>
		{/if}
	</div>

	{#if children}
		<div class="theme-htmleditor-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-htmleditor {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}

	.theme-htmleditor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--color-surface-elevated);
		border-bottom: 1px solid var(--color-border);
	}

	.theme-htmleditor-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-htmleditor-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.theme-htmleditor-format,
	.theme-htmleditor-toggle,
	.theme-htmleditor-copy {
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

	.theme-htmleditor-format:hover:not(:disabled),
	.theme-htmleditor-toggle:hover:not(:disabled),
	.theme-htmleditor-copy:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-htmleditor-format:focus,
	.theme-htmleditor-toggle:focus,
	.theme-htmleditor-copy:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-htmleditor-format:disabled,
	.theme-htmleditor-toggle:disabled,
	.theme-htmleditor-copy:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-htmleditor-format svg,
	.theme-htmleditor-toggle svg,
	.theme-htmleditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-htmleditor-error-message {
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

	.theme-htmleditor-error-message svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.theme-htmleditor-content {
		position: relative;
	}

	.theme-htmleditor-textarea {
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

	.theme-htmleditor-textarea:focus {
		outline: none;
		background: var(--color-surface);
	}

	.theme-htmleditor-textarea::placeholder {
		color: var(--color-text-muted);
	}

	.theme-htmleditor-preview {
		padding: 16px;
		background: var(--color-code-background);
		min-height: 200px;
		overflow-x: auto;
	}

	.theme-htmleditor-preview pre {
		margin: 0;
		font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-text);
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.theme-htmleditor-preview code {
		background: none;
		border: none;
		padding: 0;
		font-size: 14px;
	}

	.html-render-preview {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		font-size: 14px;
		line-height: 1.6;
		color: var(--color-text);
	}

	/* HTML 미리보기 스타일은 동적으로 생성되는 컨텐츠에만 적용 */

	.html-render-preview h2 {
		font-size: 20px;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 4px;
	}

	.html-render-preview h3 {
		font-size: 18px;
	}

	.html-render-preview h4 {
		font-size: 16px;
	}

	.html-render-preview h5 {
		font-size: 14px;
	}

	.html-render-preview h6 {
		font-size: 12px;
	}

	.html-render-preview p {
		margin: 8px 0;
	}

	.html-render-preview strong {
		font-weight: 600;
		color: var(--color-text);
	}

	.html-render-preview em {
		font-style: italic;
		color: var(--color-text-secondary);
	}

	.html-render-preview u {
		text-decoration: underline;
	}

	.html-render-preview s {
		text-decoration: line-through;
	}

	.html-render-preview a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.html-render-preview a:hover {
		text-decoration: underline;
	}

	.html-render-preview img {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 8px 0;
	}

	.html-render-preview ul,
	.html-render-preview ol {
		margin: 8px 0;
		padding-left: 24px;
	}

	.html-render-preview li {
		margin: 4px 0;
	}

	.html-render-preview blockquote {
		margin: 16px 0;
		padding: 12px 16px;
		background: var(--color-surface-elevated);
		border-left: 4px solid var(--color-primary);
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: var(--color-text-secondary);
	}

	.html-render-preview table {
		width: 100%;
		border-collapse: collapse;
		margin: 16px 0;
		background: var(--color-surface);
		border-radius: 8px;
		overflow: hidden;
	}

	.html-render-preview th,
	.html-render-preview td {
		padding: 8px 12px;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.html-render-preview th {
		background: var(--color-surface-elevated);
		font-weight: 600;
		color: var(--color-text);
		border-bottom: 2px solid var(--color-border);
	}

	.html-render-preview td {
		color: var(--color-text);
	}

	.html-render-preview tbody tr:hover {
		background: var(--color-surface-elevated);
	}

	.theme-htmleditor-children {
		padding: 16px;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
	}

	/* Sizes */
	.theme-htmleditor-sm .theme-htmleditor-textarea,
	.theme-htmleditor-sm .theme-htmleditor-preview {
		font-size: 12px;
		padding: 12px;
		min-height: 150px;
	}

	.theme-htmleditor-sm .theme-htmleditor-header {
		padding: 8px 12px;
	}

	.theme-htmleditor-sm .theme-htmleditor-title {
		font-size: 12px;
	}

	.theme-htmleditor-sm .theme-htmleditor-format,
	.theme-htmleditor-sm .theme-htmleditor-toggle,
	.theme-htmleditor-sm .theme-htmleditor-copy {
		width: 20px;
		height: 20px;
	}

	.theme-htmleditor-sm .theme-htmleditor-format svg,
	.theme-htmleditor-sm .theme-htmleditor-toggle svg,
	.theme-htmleditor-sm .theme-htmleditor-copy svg {
		width: 12px;
		height: 12px;
	}

	.theme-htmleditor-sm .html-render-preview {
		font-size: 12px;
	}

	.theme-htmleditor-md .theme-htmleditor-textarea,
	.theme-htmleditor-md .theme-htmleditor-preview {
		font-size: 14px;
		padding: 16px;
		min-height: 200px;
	}

	.theme-htmleditor-md .theme-htmleditor-header {
		padding: 12px 16px;
	}

	.theme-htmleditor-md .theme-htmleditor-title {
		font-size: 14px;
	}

	.theme-htmleditor-md .theme-htmleditor-format,
	.theme-htmleditor-md .theme-htmleditor-toggle,
	.theme-htmleditor-md .theme-htmleditor-copy {
		width: 24px;
		height: 24px;
	}

	.theme-htmleditor-md .theme-htmleditor-format svg,
	.theme-htmleditor-md .theme-htmleditor-toggle svg,
	.theme-htmleditor-md .theme-htmleditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-htmleditor-md .html-render-preview {
		font-size: 14px;
	}

	.theme-htmleditor-lg .theme-htmleditor-textarea,
	.theme-htmleditor-lg .theme-htmleditor-preview {
		font-size: 16px;
		padding: 20px;
		min-height: 250px;
	}

	.theme-htmleditor-lg .theme-htmleditor-header {
		padding: 16px 20px;
	}

	.theme-htmleditor-lg .theme-htmleditor-title {
		font-size: 16px;
	}

	.theme-htmleditor-lg .theme-htmleditor-format,
	.theme-htmleditor-lg .theme-htmleditor-toggle,
	.theme-htmleditor-lg .theme-htmleditor-copy {
		width: 28px;
		height: 28px;
	}

	.theme-htmleditor-lg .theme-htmleditor-format svg,
	.theme-htmleditor-lg .theme-htmleditor-toggle svg,
	.theme-htmleditor-lg .theme-htmleditor-copy svg {
		width: 16px;
		height: 16px;
	}

	.theme-htmleditor-lg .html-render-preview {
		font-size: 16px;
	}

	.theme-htmleditor-xl .theme-htmleditor-textarea,
	.theme-htmleditor-xl .theme-htmleditor-preview {
		font-size: 18px;
		padding: 24px;
		min-height: 300px;
	}

	.theme-htmleditor-xl .theme-htmleditor-header {
		padding: 20px 24px;
	}

	.theme-htmleditor-xl .theme-htmleditor-title {
		font-size: 18px;
	}

	.theme-htmleditor-xl .theme-htmleditor-format,
	.theme-htmleditor-xl .theme-htmleditor-toggle,
	.theme-htmleditor-xl .theme-htmleditor-copy {
		width: 32px;
		height: 32px;
	}

	.theme-htmleditor-xl .theme-htmleditor-format svg,
	.theme-htmleditor-xl .theme-htmleditor-toggle svg,
	.theme-htmleditor-xl .theme-htmleditor-copy svg {
		width: 18px;
		height: 18px;
	}

	.theme-htmleditor-xl .html-render-preview {
		font-size: 18px;
	}

	/* States */
	.theme-htmleditor-disabled .theme-htmleditor-textarea {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-htmleditor-disabled .theme-htmleditor-format,
	.theme-htmleditor-disabled .theme-htmleditor-toggle,
	.theme-htmleditor-disabled .theme-htmleditor-copy {
		cursor: not-allowed;
	}

	.theme-htmleditor-error {
		border-color: var(--color-error);
	}

	.theme-htmleditor-error .theme-htmleditor-textarea {
		border-color: var(--color-error);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-htmleditor-textarea,
		.theme-htmleditor-preview {
			font-size: 13px;
			padding: 12px;
			min-height: 150px;
		}

		.theme-htmleditor-header {
			padding: 8px 12px;
		}

		.theme-htmleditor-title {
			font-size: 13px;
		}

		.theme-htmleditor-format,
		.theme-htmleditor-toggle,
		.theme-htmleditor-copy {
			width: 20px;
			height: 20px;
		}

		.theme-htmleditor-format svg,
		.theme-htmleditor-toggle svg,
		.theme-htmleditor-copy svg {
			width: 12px;
			height: 12px;
		}

		.html-render-preview {
			font-size: 13px;
		}

		.theme-htmleditor-sm .theme-htmleditor-textarea,
		.theme-htmleditor-sm .theme-htmleditor-preview {
			font-size: 11px;
			padding: 8px;
			min-height: 120px;
		}

		.theme-htmleditor-sm .theme-htmleditor-header {
			padding: 6px 8px;
		}

		.theme-htmleditor-sm .theme-htmleditor-title {
			font-size: 11px;
		}

		.theme-htmleditor-sm .theme-htmleditor-format,
		.theme-htmleditor-sm .theme-htmleditor-toggle,
		.theme-htmleditor-sm .theme-htmleditor-copy {
			width: 18px;
			height: 18px;
		}

		.theme-htmleditor-sm .theme-htmleditor-format svg,
		.theme-htmleditor-sm .theme-htmleditor-toggle svg,
		.theme-htmleditor-sm .theme-htmleditor-copy svg {
			width: 10px;
			height: 10px;
		}

		.theme-htmleditor-sm .html-render-preview {
			font-size: 11px;
		}

		.theme-htmleditor-lg .theme-htmleditor-textarea,
		.theme-htmleditor-lg .theme-htmleditor-preview {
			font-size: 15px;
			padding: 16px;
			min-height: 200px;
		}

		.theme-htmleditor-lg .theme-htmleditor-header {
			padding: 12px 16px;
		}

		.theme-htmleditor-lg .theme-htmleditor-title {
			font-size: 15px;
		}

		.theme-htmleditor-lg .theme-htmleditor-format,
		.theme-htmleditor-lg .theme-htmleditor-toggle,
		.theme-htmleditor-lg .theme-htmleditor-copy {
			width: 24px;
			height: 24px;
		}

		.theme-htmleditor-lg .theme-htmleditor-format svg,
		.theme-htmleditor-lg .theme-htmleditor-toggle svg,
		.theme-htmleditor-lg .theme-htmleditor-copy svg {
			width: 14px;
			height: 14px;
		}

		.theme-htmleditor-lg .html-render-preview {
			font-size: 15px;
		}

		.theme-htmleditor-xl .theme-htmleditor-textarea,
		.theme-htmleditor-xl .theme-htmleditor-preview {
			font-size: 17px;
			padding: 20px;
			min-height: 250px;
		}

		.theme-htmleditor-xl .theme-htmleditor-header {
			padding: 16px 20px;
		}

		.theme-htmleditor-xl .theme-htmleditor-title {
			font-size: 17px;
		}

		.theme-htmleditor-xl .theme-htmleditor-format,
		.theme-htmleditor-xl .theme-htmleditor-toggle,
		.theme-htmleditor-xl .theme-htmleditor-copy {
			width: 28px;
			height: 28px;
		}

		.theme-htmleditor-xl .theme-htmleditor-format svg,
		.theme-htmleditor-xl .theme-htmleditor-toggle svg,
		.theme-htmleditor-xl .theme-htmleditor-copy svg {
			width: 16px;
			height: 16px;
		}

		.theme-htmleditor-xl .html-render-preview {
			font-size: 17px;
		}
	}
</style>
