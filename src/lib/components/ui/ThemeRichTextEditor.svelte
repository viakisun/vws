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
	let editorElement = $state<HTMLDivElement>();

	// Get rich text editor classes
	function getRichTextEditorClasses(): string {
		const baseClasses = 'theme-richtexteditor';
		const sizeClass = `theme-richtexteditor-${size}`;
		const variantClass = `theme-richtexteditor-${variant}`;
		const disabledClass = disabled ? 'theme-richtexteditor-disabled' : '';

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
	function handleInputChange() {
		if (editorElement) {
			const newValue = editorElement.innerHTML;
			value = newValue;
			if (onchange) {
				onchange(newValue);
			}
		}
	}

	// Handle keydown
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Tab') {
			event.preventDefault();
			document.execCommand('insertText', false, '  ');
		}
	}

	// Toggle preview
	function togglePreview() {
		isPreview = !isPreview;
	}

	// Format text
	function formatText(command: string, value?: string) {
		if (disabled) return;
		
		document.execCommand(command, false, value);
		editorElement.focus();
		handleInputChange();
	}

	// Insert link
	function insertLink() {
		if (disabled) return;
		
		const url = prompt('Enter URL:');
		if (url) {
			formatText('createLink', url);
		}
	}

	// Insert image
	function insertImage() {
		if (disabled) return;
		
		const url = prompt('Enter image URL:');
		if (url) {
			formatText('insertImage', url);
		}
	}

	// Clear formatting
	function clearFormatting() {
		if (disabled) return;
		
		formatText('removeFormat');
	}

	// Get HTML preview
	function getHtmlPreview(): string {
		return value || '<p>No content</p>';
	}
</script>

<div class={getRichTextEditorClasses()} {...restProps}>
	<div class="theme-richtexteditor-header">
		<div class="theme-richtexteditor-title">
			Rich Text Editor
		</div>
		
		<div class="theme-richtexteditor-actions">
			<button
				class="theme-richtexteditor-toggle"
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
				class="theme-richtexteditor-copy"
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

	{#if !isPreview}
		<div class="theme-richtexteditor-toolbar">
			<div class="theme-richtexteditor-toolbar-group">
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('bold')}
					{disabled}
					aria-label="Bold"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
						<path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('italic')}
					{disabled}
					aria-label="Italic"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="19" y1="4" x2="10" y2="4"/>
						<line x1="14" y1="20" x2="5" y2="20"/>
						<line x1="15" y1="4" x2="9" y2="20"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('underline')}
					{disabled}
					aria-label="Underline"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
						<line x1="4" y1="21" x2="20" y2="21"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('strikeThrough')}
					{disabled}
					aria-label="Strikethrough"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M16 4H9a3 3 0 0 0-2.83 2"/>
						<path d="M14 12a4 4 0 0 1 0 8H6"/>
						<line x1="4" y1="12" x2="20" y2="12"/>
					</svg>
				</button>
			</div>

			<div class="theme-richtexteditor-toolbar-group">
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('justifyLeft')}
					{disabled}
					aria-label="Align left"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="21" y1="10" x2="7" y2="10"/>
						<line x1="21" y1="6" x2="3" y2="6"/>
						<line x1="21" y1="14" x2="3" y2="14"/>
						<line x1="21" y1="18" x2="7" y2="18"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('justifyCenter')}
					{disabled}
					aria-label="Align center"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="10" x2="6" y2="10"/>
						<line x1="21" y1="6" x2="3" y2="6"/>
						<line x1="21" y1="14" x2="3" y2="14"/>
						<line x1="18" y1="18" x2="6" y2="18"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('justifyRight')}
					{disabled}
					aria-label="Align right"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="3" y1="10" x2="21" y2="10"/>
						<line x1="3" y1="6" x2="21" y2="6"/>
						<line x1="3" y1="14" x2="21" y2="14"/>
						<line x1="3" y1="18" x2="21" y2="18"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('justifyFull')}
					{disabled}
					aria-label="Justify"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="3" y1="6" x2="21" y2="6"/>
						<line x1="3" y1="12" x2="21" y2="12"/>
						<line x1="3" y1="18" x2="21" y2="18"/>
					</svg>
				</button>
			</div>

			<div class="theme-richtexteditor-toolbar-group">
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('insertUnorderedList')}
					{disabled}
					aria-label="Bullet list"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="8" y1="6" x2="21" y2="6"/>
						<line x1="8" y1="12" x2="21" y2="12"/>
						<line x1="8" y1="18" x2="21" y2="18"/>
						<line x1="3" y1="6" x2="3.01" y2="6"/>
						<line x1="3" y1="12" x2="3.01" y2="12"/>
						<line x1="3" y1="18" x2="3.01" y2="18"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('insertOrderedList')}
					{disabled}
					aria-label="Numbered list"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="10" y1="6" x2="21" y2="6"/>
						<line x1="10" y1="12" x2="21" y2="12"/>
						<line x1="10" y1="18" x2="21" y2="18"/>
						<path d="M4 6h1v4"/>
						<path d="M4 10h2"/>
						<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('outdent')}
					{disabled}
					aria-label="Decrease indent"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="7,13 3,9 7,5"/>
						<path d="M21 12H11"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={() => formatText('indent')}
					{disabled}
					aria-label="Increase indent"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="17,13 21,9 17,5"/>
						<path d="M3 12H13"/>
					</svg>
				</button>
			</div>

			<div class="theme-richtexteditor-toolbar-group">
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={insertLink}
					{disabled}
					aria-label="Insert link"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={insertImage}
					{disabled}
					aria-label="Insert image"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
						<circle cx="8.5" cy="8.5" r="1.5"/>
						<polyline points="21,15 16,10 5,21"/>
					</svg>
				</button>
				
				<button
					class="theme-richtexteditor-toolbar-button"
					onclick={clearFormatting}
					{disabled}
					aria-label="Clear formatting"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 7V4h16v3"/>
						<path d="M5 20h6l2-3h6l2 3"/>
						<path d="M12 4v13"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<div class="theme-richtexteditor-content">
		{#if isPreview}
			<div class="theme-richtexteditor-preview">
				{@html getHtmlPreview()}
			</div>
		{:else}
			<div
				bind:this={editorElement}
				class="theme-richtexteditor-editor"
				contenteditable={!disabled}
				oninput={handleInputChange}
				onkeydown={handleKeydown}
				role="textbox"
				aria-label="Rich text editor"
				tabindex="0"
			>
				{@html value}
			</div>
		{/if}
	</div>

	{#if children}
		<div class="theme-richtexteditor-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-richtexteditor {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}

	.theme-richtexteditor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--color-surface-elevated);
		border-bottom: 1px solid var(--color-border);
	}

	.theme-richtexteditor-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-richtexteditor-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.theme-richtexteditor-toggle,
	.theme-richtexteditor-copy {
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

	.theme-richtexteditor-toggle:hover:not(:disabled),
	.theme-richtexteditor-copy:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-richtexteditor-toggle:focus,
	.theme-richtexteditor-copy:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-richtexteditor-toggle:disabled,
	.theme-richtexteditor-copy:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-richtexteditor-toggle svg,
	.theme-richtexteditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-richtexteditor-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--color-surface-elevated);
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
	}

	.theme-richtexteditor-toolbar-group {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 8px;
		border-right: 1px solid var(--color-border);
	}

	.theme-richtexteditor-toolbar-group:last-child {
		border-right: none;
	}

	.theme-richtexteditor-toolbar-button {
		width: 28px;
		height: 28px;
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

	.theme-richtexteditor-toolbar-button:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-richtexteditor-toolbar-button:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-richtexteditor-toolbar-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-richtexteditor-toolbar-button svg {
		width: 14px;
		height: 14px;
	}

	.theme-richtexteditor-content {
		position: relative;
	}

	.theme-richtexteditor-editor {
		width: 100%;
		background: var(--color-surface);
		border: none;
		padding: 16px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		font-size: 14px;
		line-height: 1.6;
		color: var(--color-text);
		min-height: 200px;
		transition: all 0.2s ease;
		outline: none;
	}

	.theme-richtexteditor-editor:focus {
		background: var(--color-surface);
	}

	.theme-richtexteditor-editor:empty:before {
		content: 'Enter your text here...';
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.theme-richtexteditor-preview {
		padding: 16px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
		font-size: 14px;
		line-height: 1.6;
		color: var(--color-text);
		min-height: 200px;
	}

	/* Rich text 미리보기 스타일은 동적으로 생성되는 컨텐츠에만 적용 */
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 4px;
	}

	.theme-richtexteditor-preview h3 {
		font-size: 18px;
	}

	.theme-richtexteditor-preview h4 {
		font-size: 16px;
	}

	.theme-richtexteditor-preview h5 {
		font-size: 14px;
	}

	.theme-richtexteditor-preview h6 {
		font-size: 12px;
	}

	.theme-richtexteditor-preview p {
		margin: 8px 0;
	}

	.theme-richtexteditor-preview strong {
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-richtexteditor-preview em {
		font-style: italic;
		color: var(--color-text-secondary);
	}

	.theme-richtexteditor-preview u {
		text-decoration: underline;
	}

	.theme-richtexteditor-preview s {
		text-decoration: line-through;
	}

	.theme-richtexteditor-preview a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.theme-richtexteditor-preview a:hover {
		text-decoration: underline;
	}

	.theme-richtexteditor-preview img {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 8px 0;
	}

	.theme-richtexteditor-preview ul,
	.theme-richtexteditor-preview ol {
		margin: 8px 0;
		padding-left: 24px;
	}

	.theme-richtexteditor-preview li {
		margin: 4px 0;
	}

	.theme-richtexteditor-preview blockquote {
		margin: 16px 0;
		padding: 12px 16px;
		background: var(--color-surface-elevated);
		border-left: 4px solid var(--color-primary);
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: var(--color-text-secondary);
	}

	.theme-richtexteditor-children {
		padding: 16px;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface-elevated);
	}

	/* Sizes */
	.theme-richtexteditor-sm .theme-richtexteditor-editor,
	.theme-richtexteditor-sm .theme-richtexteditor-preview {
		font-size: 12px;
		padding: 12px;
		min-height: 150px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-header {
		padding: 8px 12px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-title {
		font-size: 12px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-toggle,
	.theme-richtexteditor-sm .theme-richtexteditor-copy {
		width: 20px;
		height: 20px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-toggle svg,
	.theme-richtexteditor-sm .theme-richtexteditor-copy svg {
		width: 12px;
		height: 12px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-toolbar {
		padding: 6px 8px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-toolbar-button {
		width: 24px;
		height: 24px;
	}

	.theme-richtexteditor-sm .theme-richtexteditor-toolbar-button svg {
		width: 12px;
		height: 12px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-editor,
	.theme-richtexteditor-md .theme-richtexteditor-preview {
		font-size: 14px;
		padding: 16px;
		min-height: 200px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-header {
		padding: 12px 16px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-title {
		font-size: 14px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-toggle,
	.theme-richtexteditor-md .theme-richtexteditor-copy {
		width: 24px;
		height: 24px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-toggle svg,
	.theme-richtexteditor-md .theme-richtexteditor-copy svg {
		width: 14px;
		height: 14px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-toolbar {
		padding: 8px 12px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-toolbar-button {
		width: 28px;
		height: 28px;
	}

	.theme-richtexteditor-md .theme-richtexteditor-toolbar-button svg {
		width: 14px;
		height: 14px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-editor,
	.theme-richtexteditor-lg .theme-richtexteditor-preview {
		font-size: 16px;
		padding: 20px;
		min-height: 250px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-header {
		padding: 16px 20px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-title {
		font-size: 16px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-toggle,
	.theme-richtexteditor-lg .theme-richtexteditor-copy {
		width: 28px;
		height: 28px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-toggle svg,
	.theme-richtexteditor-lg .theme-richtexteditor-copy svg {
		width: 16px;
		height: 16px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-toolbar {
		padding: 10px 16px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-toolbar-button {
		width: 32px;
		height: 32px;
	}

	.theme-richtexteditor-lg .theme-richtexteditor-toolbar-button svg {
		width: 16px;
		height: 16px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-editor,
	.theme-richtexteditor-xl .theme-richtexteditor-preview {
		font-size: 18px;
		padding: 24px;
		min-height: 300px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-header {
		padding: 20px 24px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-title {
		font-size: 18px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-toggle,
	.theme-richtexteditor-xl .theme-richtexteditor-copy {
		width: 32px;
		height: 32px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-toggle svg,
	.theme-richtexteditor-xl .theme-richtexteditor-copy svg {
		width: 18px;
		height: 18px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-toolbar {
		padding: 12px 20px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-toolbar-button {
		width: 36px;
		height: 36px;
	}

	.theme-richtexteditor-xl .theme-richtexteditor-toolbar-button svg {
		width: 18px;
		height: 18px;
	}

	/* States */
	.theme-richtexteditor-disabled .theme-richtexteditor-editor {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-richtexteditor-disabled .theme-richtexteditor-toggle,
	.theme-richtexteditor-disabled .theme-richtexteditor-copy {
		cursor: not-allowed;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-richtexteditor-editor,
		.theme-richtexteditor-preview {
			font-size: 13px;
			padding: 12px;
			min-height: 150px;
		}

		.theme-richtexteditor-header {
			padding: 8px 12px;
		}

		.theme-richtexteditor-title {
			font-size: 13px;
		}

		.theme-richtexteditor-toggle,
		.theme-richtexteditor-copy {
			width: 20px;
			height: 20px;
		}

		.theme-richtexteditor-toggle svg,
		.theme-richtexteditor-copy svg {
			width: 12px;
			height: 12px;
		}

		.theme-richtexteditor-toolbar {
			padding: 6px 8px;
			gap: 4px;
		}

		.theme-richtexteditor-toolbar-group {
			gap: 2px;
			padding: 0 4px;
		}

		.theme-richtexteditor-toolbar-button {
			width: 24px;
			height: 24px;
		}

		.theme-richtexteditor-toolbar-button svg {
			width: 12px;
			height: 12px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-editor,
		.theme-richtexteditor-sm .theme-richtexteditor-preview {
			font-size: 11px;
			padding: 8px;
			min-height: 120px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-header {
			padding: 6px 8px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-title {
			font-size: 11px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-toggle,
		.theme-richtexteditor-sm .theme-richtexteditor-copy {
			width: 18px;
			height: 18px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-toggle svg,
		.theme-richtexteditor-sm .theme-richtexteditor-copy svg {
			width: 10px;
			height: 10px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-toolbar {
			padding: 4px 6px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-toolbar-button {
			width: 20px;
			height: 20px;
		}

		.theme-richtexteditor-sm .theme-richtexteditor-toolbar-button svg {
			width: 10px;
			height: 10px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-editor,
		.theme-richtexteditor-lg .theme-richtexteditor-preview {
			font-size: 15px;
			padding: 16px;
			min-height: 200px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-header {
			padding: 12px 16px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-title {
			font-size: 15px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-toggle,
		.theme-richtexteditor-lg .theme-richtexteditor-copy {
			width: 24px;
			height: 24px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-toggle svg,
		.theme-richtexteditor-lg .theme-richtexteditor-copy svg {
			width: 14px;
			height: 14px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-toolbar {
			padding: 8px 12px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-toolbar-button {
			width: 28px;
			height: 28px;
		}

		.theme-richtexteditor-lg .theme-richtexteditor-toolbar-button svg {
			width: 14px;
			height: 14px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-editor,
		.theme-richtexteditor-xl .theme-richtexteditor-preview {
			font-size: 17px;
			padding: 20px;
			min-height: 250px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-header {
			padding: 16px 20px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-title {
			font-size: 17px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-toggle,
		.theme-richtexteditor-xl .theme-richtexteditor-copy {
			width: 28px;
			height: 28px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-toggle svg,
		.theme-richtexteditor-xl .theme-richtexteditor-copy svg {
			width: 16px;
			height: 16px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-toolbar {
			padding: 10px 16px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-toolbar-button {
			width: 32px;
			height: 32px;
		}

		.theme-richtexteditor-xl .theme-richtexteditor-toolbar-button svg {
			width: 16px;
			height: 16px;
		}
	}
</style>
