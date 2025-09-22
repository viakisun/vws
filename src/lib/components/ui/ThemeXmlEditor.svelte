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
  let textareaElement: HTMLTextAreaElement
  let isValidXml = $state(true)
  let xmlError = $state('')

  // Get XML editor classes
  function getXmlEditorClasses(): string {
    const baseClasses = 'theme-xmleditor'
    const sizeClass = `theme-xmleditor-${size}`
    const variantClass = `theme-xmleditor-${variant}`
    const disabledClass = disabled ? 'theme-xmleditor-disabled' : ''
    const errorClass = !isValidXml ? 'theme-xmleditor-error' : ''

    return [baseClasses, sizeClass, variantClass, disabledClass, errorClass, className]
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

  // Validate XML
  function validateXml(xmlString: string): boolean {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlString, 'text/xml')
      const parserError = doc.querySelector('parsererror')
      return !parserError
    } catch (error) {
      return false
    }
  }

  // Format XML
  function formatXml(xmlString: string): string {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlString, 'text/xml')
      const parserError = doc.querySelector('parsererror')

      if (parserError) {
        return xmlString
      }

      // Simple XML formatting
      return xmlString
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/g, '')
        .split('\n')
        .map((line, index) => {
          const indent = '  '.repeat(
            Math.max(0, (line.match(/</g) || []).length - (line.match(/<\//g) || []).length - 1)
          )
          return indent + line.trim()
        })
        .join('\n')
    } catch (error) {
      return xmlString
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement
    const newValue = target.value

    value = newValue
    isValidXml = validateXml(newValue)

    if (!isValidXml) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(newValue, 'text/xml')
        const parserError = doc.querySelector('parsererror')
        if (parserError) {
          xmlError = parserError.textContent || 'Invalid XML'
        } else {
          xmlError = 'Invalid XML'
        }
      } catch (error) {
        xmlError = error instanceof Error ? error.message : 'Invalid XML'
      }
    } else {
      xmlError = ''
    }

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

  // Format XML
  function formatXmlAction() {
    if (disabled) return

    const formatted = formatXml(value)
    value = formatted
    isValidXml = true
    xmlError = ''

    if (onchange) {
      onchange(formatted)
    }
  }

  // Get XML preview
  function getXmlPreview(): string {
    if (!value) return 'No content'

    if (isValidXml) {
      return formatXml(value)
    } else {
      return value
    }
  }
</script>

<div class={getXmlEditorClasses()} {...restProps}>
  <div class="theme-xmleditor-header">
    <div class="theme-xmleditor-title">XML Editor</div>

    <div class="theme-xmleditor-actions">
      <button
        class="theme-xmleditor-format"
        onclick={formatXmlAction}
        {disabled}
        aria-label="Format XML"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          ></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </button>

      <button
        class="theme-xmleditor-toggle"
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
        class="theme-xmleditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy XML"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  {#if !isValidXml && !isPreview}
    <div class="theme-xmleditor-error-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>Invalid XML: {xmlError}</span>
    </div>
  {/if}

  <div class="theme-xmleditor-content">
    {#if isPreview}
      <div class="theme-xmleditor-preview">
        <pre><code>{getXmlPreview()}</code></pre>
      </div>
    {:else}
      <textarea
        bind:this={textareaElement}
        class="theme-xmleditor-textarea"
        {value}
        {disabled}
        oninput={handleInputChange}
        onkeydown={handleKeydown}
        placeholder="Enter your XML here..."
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      ></textarea>
    {/if}
  </div>

  {#if children}
    <div class="theme-xmleditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-xmleditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-xmleditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-xmleditor-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-xmleditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-xmleditor-format,
  .theme-xmleditor-toggle,
  .theme-xmleditor-copy {
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

  .theme-xmleditor-format:hover:not(:disabled),
  .theme-xmleditor-toggle:hover:not(:disabled),
  .theme-xmleditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-xmleditor-format:focus,
  .theme-xmleditor-toggle:focus,
  .theme-xmleditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-xmleditor-format:disabled,
  .theme-xmleditor-toggle:disabled,
  .theme-xmleditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-xmleditor-format svg,
  .theme-xmleditor-toggle svg,
  .theme-xmleditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-xmleditor-error-message {
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

  .theme-xmleditor-error-message svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .theme-xmleditor-content {
    position: relative;
  }

  .theme-xmleditor-textarea {
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

  .theme-xmleditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-xmleditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-xmleditor-preview {
    padding: 16px;
    background: var(--color-code-background);
    min-height: 200px;
    overflow-x: auto;
  }

  .theme-xmleditor-preview pre {
    margin: 0;
    font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .theme-xmleditor-preview code {
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
  }

  .theme-xmleditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-xmleditor-sm .theme-xmleditor-textarea,
  .theme-xmleditor-sm .theme-xmleditor-preview {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-xmleditor-sm .theme-xmleditor-header {
    padding: 8px 12px;
  }

  .theme-xmleditor-sm .theme-xmleditor-title {
    font-size: 12px;
  }

  .theme-xmleditor-sm .theme-xmleditor-format,
  .theme-xmleditor-sm .theme-xmleditor-toggle,
  .theme-xmleditor-sm .theme-xmleditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-xmleditor-sm .theme-xmleditor-format svg,
  .theme-xmleditor-sm .theme-xmleditor-toggle svg,
  .theme-xmleditor-sm .theme-xmleditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-xmleditor-md .theme-xmleditor-textarea,
  .theme-xmleditor-md .theme-xmleditor-preview {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-xmleditor-md .theme-xmleditor-header {
    padding: 12px 16px;
  }

  .theme-xmleditor-md .theme-xmleditor-title {
    font-size: 14px;
  }

  .theme-xmleditor-md .theme-xmleditor-format,
  .theme-xmleditor-md .theme-xmleditor-toggle,
  .theme-xmleditor-md .theme-xmleditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-xmleditor-md .theme-xmleditor-format svg,
  .theme-xmleditor-md .theme-xmleditor-toggle svg,
  .theme-xmleditor-md .theme-xmleditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-xmleditor-lg .theme-xmleditor-textarea,
  .theme-xmleditor-lg .theme-xmleditor-preview {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-xmleditor-lg .theme-xmleditor-header {
    padding: 16px 20px;
  }

  .theme-xmleditor-lg .theme-xmleditor-title {
    font-size: 16px;
  }

  .theme-xmleditor-lg .theme-xmleditor-format,
  .theme-xmleditor-lg .theme-xmleditor-toggle,
  .theme-xmleditor-lg .theme-xmleditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-xmleditor-lg .theme-xmleditor-format svg,
  .theme-xmleditor-lg .theme-xmleditor-toggle svg,
  .theme-xmleditor-lg .theme-xmleditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-xmleditor-xl .theme-xmleditor-textarea,
  .theme-xmleditor-xl .theme-xmleditor-preview {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-xmleditor-xl .theme-xmleditor-header {
    padding: 20px 24px;
  }

  .theme-xmleditor-xl .theme-xmleditor-title {
    font-size: 18px;
  }

  .theme-xmleditor-xl .theme-xmleditor-format,
  .theme-xmleditor-xl .theme-xmleditor-toggle,
  .theme-xmleditor-xl .theme-xmleditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-xmleditor-xl .theme-xmleditor-format svg,
  .theme-xmleditor-xl .theme-xmleditor-toggle svg,
  .theme-xmleditor-xl .theme-xmleditor-copy svg {
    width: 18px;
    height: 18px;
  }

  /* States */
  .theme-xmleditor-disabled .theme-xmleditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-xmleditor-disabled .theme-xmleditor-format,
  .theme-xmleditor-disabled .theme-xmleditor-toggle,
  .theme-xmleditor-disabled .theme-xmleditor-copy {
    cursor: not-allowed;
  }

  .theme-xmleditor-error {
    border-color: var(--color-error);
  }

  .theme-xmleditor-error .theme-xmleditor-textarea {
    border-color: var(--color-error);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-xmleditor-textarea,
    .theme-xmleditor-preview {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-xmleditor-header {
      padding: 8px 12px;
    }

    .theme-xmleditor-title {
      font-size: 13px;
    }

    .theme-xmleditor-format,
    .theme-xmleditor-toggle,
    .theme-xmleditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-xmleditor-format svg,
    .theme-xmleditor-toggle svg,
    .theme-xmleditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .theme-xmleditor-sm .theme-xmleditor-textarea,
    .theme-xmleditor-sm .theme-xmleditor-preview {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-xmleditor-sm .theme-xmleditor-header {
      padding: 6px 8px;
    }

    .theme-xmleditor-sm .theme-xmleditor-title {
      font-size: 11px;
    }

    .theme-xmleditor-sm .theme-xmleditor-format,
    .theme-xmleditor-sm .theme-xmleditor-toggle,
    .theme-xmleditor-sm .theme-xmleditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-xmleditor-sm .theme-xmleditor-format svg,
    .theme-xmleditor-sm .theme-xmleditor-toggle svg,
    .theme-xmleditor-sm .theme-xmleditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-xmleditor-lg .theme-xmleditor-textarea,
    .theme-xmleditor-lg .theme-xmleditor-preview {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-xmleditor-lg .theme-xmleditor-header {
      padding: 12px 16px;
    }

    .theme-xmleditor-lg .theme-xmleditor-title {
      font-size: 15px;
    }

    .theme-xmleditor-lg .theme-xmleditor-format,
    .theme-xmleditor-lg .theme-xmleditor-toggle,
    .theme-xmleditor-lg .theme-xmleditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-xmleditor-lg .theme-xmleditor-format svg,
    .theme-xmleditor-lg .theme-xmleditor-toggle svg,
    .theme-xmleditor-lg .theme-xmleditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-xmleditor-xl .theme-xmleditor-textarea,
    .theme-xmleditor-xl .theme-xmleditor-preview {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-xmleditor-xl .theme-xmleditor-header {
      padding: 16px 20px;
    }

    .theme-xmleditor-xl .theme-xmleditor-title {
      font-size: 17px;
    }

    .theme-xmleditor-xl .theme-xmleditor-format,
    .theme-xmleditor-xl .theme-xmleditor-toggle,
    .theme-xmleditor-xl .theme-xmleditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-xmleditor-xl .theme-xmleditor-format svg,
    .theme-xmleditor-xl .theme-xmleditor-toggle svg,
    .theme-xmleditor-xl .theme-xmleditor-copy svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
