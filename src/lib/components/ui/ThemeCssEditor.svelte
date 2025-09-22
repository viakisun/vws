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
  let isValidCss = $state(true)
  let cssError = $state('')

  // Get CSS editor classes
  function getCssEditorClasses(): string {
    const baseClasses = 'theme-csseditor'
    const sizeClass = `theme-csseditor-${size}`
    const variantClass = `theme-csseditor-${variant}`
    const disabledClass = disabled ? 'theme-csseditor-disabled' : ''
    const errorClass = !isValidCss ? 'theme-csseditor-error' : ''

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

  // Validate CSS
  function validateCss(cssString: string): boolean {
    try {
      if (!cssString.trim()) return true

      // Basic CSS validation - check for balanced braces and semicolons
      let braceCount = 0
      let parenCount = 0
      let inString = false
      let stringChar = ''

      for (let i = 0; i < cssString.length; i++) {
        const char = cssString[i]
        const prevChar = i > 0 ? cssString[i - 1] : ''

        // Handle strings
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (!inString) {
            inString = true
            stringChar = char
          } else if (char === stringChar) {
            inString = false
            stringChar = ''
          }
        }

        if (!inString) {
          if (char === '{') braceCount++
          if (char === '}') braceCount--
          if (char === '(') parenCount++
          if (char === ')') parenCount--

          if (braceCount < 0 || parenCount < 0) return false
        }
      }

      return braceCount === 0 && parenCount === 0 && !inString
    } catch (error) {
      return false
    }
  }

  // Format CSS
  function formatCss(cssString: string): string {
    try {
      if (!cssString.trim()) return cssString

      // Simple CSS formatting
      let formatted = cssString
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/\s*,\s*/g, ', ')
        .trim()

      // Clean up extra whitespace
      formatted = formatted
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')

      return formatted
    } catch (error) {
      return cssString
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement
    const newValue = target.value

    value = newValue
    isValidCss = validateCss(newValue)

    if (!isValidCss) {
      cssError = 'Invalid CSS structure - check for balanced braces and proper syntax'
    } else {
      cssError = ''
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

  // Format CSS
  function formatCssAction() {
    if (disabled) return

    const formatted = formatCss(value)
    value = formatted
    isValidCss = true
    cssError = ''

    if (onchange) {
      onchange(formatted)
    }
  }

  // Get CSS preview
  function getCssPreview(): string {
    if (!value) return 'No content'

    if (isValidCss) {
      return formatCss(value)
    } else {
      return value
    }
  }

  // Get CSS render preview
  function getCssRenderPreview(): string {
    if (!value) return '<p>No content</p>'

    if (isValidCss) {
      return '<div class="css-preview-content"><p>CSS Preview</p><div class="sample-element">Sample Element</div></div>'
    } else {
      return '<p>Invalid CSS</p>'
    }
  }
</script>

<div class={getCssEditorClasses()} {...restProps}>
  <div class="theme-csseditor-header">
    <div class="theme-csseditor-title">CSS Editor</div>

    <div class="theme-csseditor-actions">
      <button
        class="theme-csseditor-format"
        onclick={formatCssAction}
        {disabled}
        aria-label="Format CSS"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          ></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </button>

      <button
        class="theme-csseditor-toggle"
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
        class="theme-csseditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy CSS"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  {#if !isValidCss && !isPreview}
    <div class="theme-csseditor-error-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>Invalid CSS: {cssError}</span>
    </div>
  {/if}

  <div class="theme-csseditor-content">
    {#if isPreview}
      <div class="theme-csseditor-preview">
        {#if isValidCss}
          <div class="css-render-preview">
            {@html getCssRenderPreview()}
          </div>
        {:else}
          <pre><code>{getCssPreview()}</code></pre>
        {/if}
      </div>
    {:else}
      <textarea
        bind:this={textareaElement}
        class="theme-csseditor-textarea"
        {value}
        {disabled}
        oninput={handleInputChange}
        onkeydown={handleKeydown}
        placeholder="Enter your CSS here..."
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      ></textarea>
    {/if}
  </div>

  {#if children}
    <div class="theme-csseditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-csseditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-csseditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-csseditor-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-csseditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-csseditor-format,
  .theme-csseditor-toggle,
  .theme-csseditor-copy {
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

  .theme-csseditor-format:hover:not(:disabled),
  .theme-csseditor-toggle:hover:not(:disabled),
  .theme-csseditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-csseditor-format:focus,
  .theme-csseditor-toggle:focus,
  .theme-csseditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-csseditor-format:disabled,
  .theme-csseditor-toggle:disabled,
  .theme-csseditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-csseditor-format svg,
  .theme-csseditor-toggle svg,
  .theme-csseditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-csseditor-error-message {
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

  .theme-csseditor-error-message svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .theme-csseditor-content {
    position: relative;
  }

  .theme-csseditor-textarea {
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

  .theme-csseditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-csseditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-csseditor-preview {
    padding: 16px;
    background: var(--color-code-background);
    min-height: 200px;
    overflow-x: auto;
  }

  .theme-csseditor-preview pre {
    margin: 0;
    font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .theme-csseditor-preview code {
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
  }

  .css-render-preview {
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
      'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
  }

  .theme-csseditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-csseditor-sm .theme-csseditor-textarea,
  .theme-csseditor-sm .theme-csseditor-preview {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-csseditor-sm .theme-csseditor-header {
    padding: 8px 12px;
  }

  .theme-csseditor-sm .theme-csseditor-title {
    font-size: 12px;
  }

  .theme-csseditor-sm .theme-csseditor-format,
  .theme-csseditor-sm .theme-csseditor-toggle,
  .theme-csseditor-sm .theme-csseditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-csseditor-sm .theme-csseditor-format svg,
  .theme-csseditor-sm .theme-csseditor-toggle svg,
  .theme-csseditor-sm .theme-csseditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-csseditor-sm .css-render-preview {
    font-size: 12px;
  }

  .theme-csseditor-md .theme-csseditor-textarea,
  .theme-csseditor-md .theme-csseditor-preview {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-csseditor-md .theme-csseditor-header {
    padding: 12px 16px;
  }

  .theme-csseditor-md .theme-csseditor-title {
    font-size: 14px;
  }

  .theme-csseditor-md .theme-csseditor-format,
  .theme-csseditor-md .theme-csseditor-toggle,
  .theme-csseditor-md .theme-csseditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-csseditor-md .theme-csseditor-format svg,
  .theme-csseditor-md .theme-csseditor-toggle svg,
  .theme-csseditor-md .theme-csseditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-csseditor-md .css-render-preview {
    font-size: 14px;
  }

  .theme-csseditor-lg .theme-csseditor-textarea,
  .theme-csseditor-lg .theme-csseditor-preview {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-csseditor-lg .theme-csseditor-header {
    padding: 16px 20px;
  }

  .theme-csseditor-lg .theme-csseditor-title {
    font-size: 16px;
  }

  .theme-csseditor-lg .theme-csseditor-format,
  .theme-csseditor-lg .theme-csseditor-toggle,
  .theme-csseditor-lg .theme-csseditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-csseditor-lg .theme-csseditor-format svg,
  .theme-csseditor-lg .theme-csseditor-toggle svg,
  .theme-csseditor-lg .theme-csseditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-csseditor-lg .css-render-preview {
    font-size: 16px;
  }

  .theme-csseditor-xl .theme-csseditor-textarea,
  .theme-csseditor-xl .theme-csseditor-preview {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-csseditor-xl .theme-csseditor-header {
    padding: 20px 24px;
  }

  .theme-csseditor-xl .theme-csseditor-title {
    font-size: 18px;
  }

  .theme-csseditor-xl .theme-csseditor-format,
  .theme-csseditor-xl .theme-csseditor-toggle,
  .theme-csseditor-xl .theme-csseditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-csseditor-xl .theme-csseditor-format svg,
  .theme-csseditor-xl .theme-csseditor-toggle svg,
  .theme-csseditor-xl .theme-csseditor-copy svg {
    width: 18px;
    height: 18px;
  }

  .theme-csseditor-xl .css-render-preview {
    font-size: 18px;
  }

  /* States */
  .theme-csseditor-disabled .theme-csseditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-csseditor-disabled .theme-csseditor-format,
  .theme-csseditor-disabled .theme-csseditor-toggle,
  .theme-csseditor-disabled .theme-csseditor-copy {
    cursor: not-allowed;
  }

  .theme-csseditor-error {
    border-color: var(--color-error);
  }

  .theme-csseditor-error .theme-csseditor-textarea {
    border-color: var(--color-error);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-csseditor-textarea,
    .theme-csseditor-preview {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-csseditor-header {
      padding: 8px 12px;
    }

    .theme-csseditor-title {
      font-size: 13px;
    }

    .theme-csseditor-format,
    .theme-csseditor-toggle,
    .theme-csseditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-csseditor-format svg,
    .theme-csseditor-toggle svg,
    .theme-csseditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .css-render-preview {
      font-size: 13px;
    }

    .theme-csseditor-sm .theme-csseditor-textarea,
    .theme-csseditor-sm .theme-csseditor-preview {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-csseditor-sm .theme-csseditor-header {
      padding: 6px 8px;
    }

    .theme-csseditor-sm .theme-csseditor-title {
      font-size: 11px;
    }

    .theme-csseditor-sm .theme-csseditor-format,
    .theme-csseditor-sm .theme-csseditor-toggle,
    .theme-csseditor-sm .theme-csseditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-csseditor-sm .theme-csseditor-format svg,
    .theme-csseditor-sm .theme-csseditor-toggle svg,
    .theme-csseditor-sm .theme-csseditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-csseditor-sm .css-render-preview {
      font-size: 11px;
    }

    .theme-csseditor-lg .theme-csseditor-textarea,
    .theme-csseditor-lg .theme-csseditor-preview {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-csseditor-lg .theme-csseditor-header {
      padding: 12px 16px;
    }

    .theme-csseditor-lg .theme-csseditor-title {
      font-size: 15px;
    }

    .theme-csseditor-lg .theme-csseditor-format,
    .theme-csseditor-lg .theme-csseditor-toggle,
    .theme-csseditor-lg .theme-csseditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-csseditor-lg .theme-csseditor-format svg,
    .theme-csseditor-lg .theme-csseditor-toggle svg,
    .theme-csseditor-lg .theme-csseditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-csseditor-lg .css-render-preview {
      font-size: 15px;
    }

    .theme-csseditor-xl .theme-csseditor-textarea,
    .theme-csseditor-xl .theme-csseditor-preview {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-csseditor-xl .theme-csseditor-header {
      padding: 16px 20px;
    }

    .theme-csseditor-xl .theme-csseditor-title {
      font-size: 17px;
    }

    .theme-csseditor-xl .theme-csseditor-format,
    .theme-csseditor-xl .theme-csseditor-toggle,
    .theme-csseditor-xl .theme-csseditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-csseditor-xl .theme-csseditor-format svg,
    .theme-csseditor-xl .theme-csseditor-toggle svg,
    .theme-csseditor-xl .theme-csseditor-copy svg {
      width: 16px;
      height: 16px;
    }

    .theme-csseditor-xl .css-render-preview {
      font-size: 17px;
    }
  }
</style>
