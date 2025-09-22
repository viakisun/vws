<script lang="ts">
  // Props
  interface Props {
    value?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (value: string) => void
    children?: any
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
  }: Props = $props()

  // State
  let isPreview = $state(false)
  let textareaElement = $state<HTMLTextAreaElement>()

  // Get markdown editor classes
  function getMarkdownEditorClasses(): string {
    const baseClasses = 'theme-markdowneditor'
    const sizeClass = `theme-markdowneditor-${size}`
    const variantClass = `theme-markdowneditor-${variant}`
    const disabledClass = disabled ? 'theme-markdowneditor-disabled' : ''

    return [baseClasses, sizeClass, variantClass, disabledClass, className]
      .filter(Boolean)
      .join(' ')
  }

  // Get color for variant
  function getColor(): string {
    switch (variant) {
      case 'success':
        return 'var(--color-success)'
      case 'warning':
        return 'var(--color-warning)'
      case 'error':
        return 'var(--color-error)'
      case 'info':
        return 'var(--color-info)'
      default:
        return 'var(--color-primary)'
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement
    const newValue = target.value

    value = newValue
    if (onchange) {
      onchange(newValue)
    }
  }

  // Handle keydown
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault()
      const target = event.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)

      value = newValue
      if (onchange) {
        onchange(newValue)
      }

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }

  // Toggle preview
  function togglePreview() {
    isPreview = !isPreview
  }

  // Get markdown preview
  function getMarkdownPreview(): string {
    // Simple markdown to HTML conversion
    return value
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\n/gim, '<br>')
  }
</script>

<div class={getMarkdownEditorClasses()} {...restProps}>
  <div class="theme-markdowneditor-header">
    <div class="theme-markdowneditor-title">Markdown Editor</div>

    <div class="theme-markdowneditor-actions">
      <button
        class="theme-markdowneditor-toggle"
        onclick={togglePreview}
        {disabled}
        aria-label={isPreview ? 'Edit mode' : 'Preview mode'}
      >
        {#if isPreview}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        {/if}
      </button>

      <button
        class="theme-markdowneditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy markdown"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="theme-markdowneditor-content">
    {#if isPreview}
      <div class="theme-markdowneditor-preview">
        {@html getMarkdownPreview()}
      </div>
    {:else}
      <textarea
        bind:this={textareaElement}
        class="theme-markdowneditor-textarea"
        {value}
        {disabled}
        oninput={handleInputChange}
        onkeydown={handleKeydown}
        placeholder="Enter your markdown here..."
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      ></textarea>
    {/if}
  </div>

  {#if children}
    <div class="theme-markdowneditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-markdowneditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-markdowneditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-markdowneditor-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-markdowneditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-markdowneditor-toggle,
  .theme-markdowneditor-copy {
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

  .theme-markdowneditor-toggle:hover:not(:disabled),
  .theme-markdowneditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-markdowneditor-toggle:focus,
  .theme-markdowneditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-markdowneditor-toggle:disabled,
  .theme-markdowneditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-markdowneditor-toggle svg,
  .theme-markdowneditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-markdowneditor-content {
    position: relative;
  }

  .theme-markdowneditor-textarea {
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

  .theme-markdowneditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-markdowneditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-markdowneditor-preview {
    padding: 16px;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
      'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
    min-height: 200px;
  }

  /* Markdown 미리보기 스타일은 동적으로 생성되는 컨텐츠에만 적용 */

  .theme-markdowneditor-preview h2 {
    font-size: 20px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 4px;
  }

  .theme-markdowneditor-preview h3 {
    font-size: 18px;
  }

  .theme-markdowneditor-preview h4 {
    font-size: 16px;
  }

  .theme-markdowneditor-preview h5 {
    font-size: 14px;
  }

  .theme-markdowneditor-preview h6 {
    font-size: 12px;
  }

  .theme-markdowneditor-preview p {
    margin: 8px 0;
  }

  .theme-markdowneditor-preview strong {
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-markdowneditor-preview em {
    font-style: italic;
    color: var(--color-text-secondary);
  }

  .theme-markdowneditor-preview code {
    background: var(--color-code-background);
    border: 1px solid var(--color-code-border);
    border-radius: 4px;
    padding: 2px 4px;
    font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    color: var(--color-text);
  }

  .theme-markdowneditor-preview pre {
    background: var(--color-code-background);
    border: 1px solid var(--color-code-border);
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    overflow-x: auto;
  }

  .theme-markdowneditor-preview pre code {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
  }

  .theme-markdowneditor-preview a {
    color: var(--color-primary);
    text-decoration: none;
  }

  .theme-markdowneditor-preview a:hover {
    text-decoration: underline;
  }

  .theme-markdowneditor-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 8px 0;
  }

  .theme-markdowneditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-markdowneditor-sm .theme-markdowneditor-textarea,
  .theme-markdowneditor-sm .theme-markdowneditor-preview {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-markdowneditor-sm .theme-markdowneditor-header {
    padding: 8px 12px;
  }

  .theme-markdowneditor-sm .theme-markdowneditor-title {
    font-size: 12px;
  }

  .theme-markdowneditor-sm .theme-markdowneditor-toggle,
  .theme-markdowneditor-sm .theme-markdowneditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-markdowneditor-sm .theme-markdowneditor-toggle svg,
  .theme-markdowneditor-sm .theme-markdowneditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-markdowneditor-md .theme-markdowneditor-textarea,
  .theme-markdowneditor-md .theme-markdowneditor-preview {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-markdowneditor-md .theme-markdowneditor-header {
    padding: 12px 16px;
  }

  .theme-markdowneditor-md .theme-markdowneditor-title {
    font-size: 14px;
  }

  .theme-markdowneditor-md .theme-markdowneditor-toggle,
  .theme-markdowneditor-md .theme-markdowneditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-markdowneditor-md .theme-markdowneditor-toggle svg,
  .theme-markdowneditor-md .theme-markdowneditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-markdowneditor-lg .theme-markdowneditor-textarea,
  .theme-markdowneditor-lg .theme-markdowneditor-preview {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-markdowneditor-lg .theme-markdowneditor-header {
    padding: 16px 20px;
  }

  .theme-markdowneditor-lg .theme-markdowneditor-title {
    font-size: 16px;
  }

  .theme-markdowneditor-lg .theme-markdowneditor-toggle,
  .theme-markdowneditor-lg .theme-markdowneditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-markdowneditor-lg .theme-markdowneditor-toggle svg,
  .theme-markdowneditor-lg .theme-markdowneditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-markdowneditor-xl .theme-markdowneditor-textarea,
  .theme-markdowneditor-xl .theme-markdowneditor-preview {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-markdowneditor-xl .theme-markdowneditor-header {
    padding: 20px 24px;
  }

  .theme-markdowneditor-xl .theme-markdowneditor-title {
    font-size: 18px;
  }

  .theme-markdowneditor-xl .theme-markdowneditor-toggle,
  .theme-markdowneditor-xl .theme-markdowneditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-markdowneditor-xl .theme-markdowneditor-toggle svg,
  .theme-markdowneditor-xl .theme-markdowneditor-copy svg {
    width: 18px;
    height: 18px;
  }

  /* States */
  .theme-markdowneditor-disabled .theme-markdowneditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-markdowneditor-disabled .theme-markdowneditor-toggle,
  .theme-markdowneditor-disabled .theme-markdowneditor-copy {
    cursor: not-allowed;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-markdowneditor-textarea,
    .theme-markdowneditor-preview {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-markdowneditor-header {
      padding: 8px 12px;
    }

    .theme-markdowneditor-title {
      font-size: 13px;
    }

    .theme-markdowneditor-toggle,
    .theme-markdowneditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-markdowneditor-toggle svg,
    .theme-markdowneditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .theme-markdowneditor-sm .theme-markdowneditor-textarea,
    .theme-markdowneditor-sm .theme-markdowneditor-preview {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-markdowneditor-sm .theme-markdowneditor-header {
      padding: 6px 8px;
    }

    .theme-markdowneditor-sm .theme-markdowneditor-title {
      font-size: 11px;
    }

    .theme-markdowneditor-sm .theme-markdowneditor-toggle,
    .theme-markdowneditor-sm .theme-markdowneditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-markdowneditor-sm .theme-markdowneditor-toggle svg,
    .theme-markdowneditor-sm .theme-markdowneditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-markdowneditor-lg .theme-markdowneditor-textarea,
    .theme-markdowneditor-lg .theme-markdowneditor-preview {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-markdowneditor-lg .theme-markdowneditor-header {
      padding: 12px 16px;
    }

    .theme-markdowneditor-lg .theme-markdowneditor-title {
      font-size: 15px;
    }

    .theme-markdowneditor-lg .theme-markdowneditor-toggle,
    .theme-markdowneditor-lg .theme-markdowneditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-markdowneditor-lg .theme-markdowneditor-toggle svg,
    .theme-markdowneditor-lg .theme-markdowneditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-markdowneditor-xl .theme-markdowneditor-textarea,
    .theme-markdowneditor-xl .theme-markdowneditor-preview {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-markdowneditor-xl .theme-markdowneditor-header {
      padding: 16px 20px;
    }

    .theme-markdowneditor-xl .theme-markdowneditor-title {
      font-size: 17px;
    }

    .theme-markdowneditor-xl .theme-markdowneditor-toggle,
    .theme-markdowneditor-xl .theme-markdowneditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-markdowneditor-xl .theme-markdowneditor-toggle svg,
    .theme-markdowneditor-xl .theme-markdowneditor-copy svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
