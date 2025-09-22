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
  let isValidSql = $state(true)
  let sqlError = $state('')

  // Get SQL editor classes
  function getSqlEditorClasses(): string {
    const baseClasses = 'theme-sqleditor'
    const sizeClass = `theme-sqleditor-${size}`
    const variantClass = `theme-sqleditor-${variant}`
    const disabledClass = disabled ? 'theme-sqleditor-disabled' : ''
    const errorClass = !isValidSql ? 'theme-sqleditor-error' : ''

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

  // Validate SQL
  function validateSql(sqlString: string): boolean {
    try {
      if (!sqlString.trim()) return true

      // Basic SQL validation - check for common SQL keywords and structure
      const sqlKeywords = [
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'CREATE',
        'DROP',
        'ALTER',
        'FROM',
        'WHERE',
        'JOIN',
        'INNER',
        'LEFT',
        'RIGHT',
        'OUTER',
        'ON',
        'GROUP',
        'BY',
        'ORDER',
        'HAVING',
        'LIMIT',
        'OFFSET'
      ]
      const upperSql = sqlString.toUpperCase()

      // Check if it contains at least one SQL keyword
      const hasKeyword = sqlKeywords.some(keyword => upperSql.includes(keyword))
      if (!hasKeyword) return false

      // Check for balanced parentheses
      let parenCount = 0
      for (const char of sqlString) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) return false
      }
      if (parenCount !== 0) return false

      // Check for balanced quotes
      let singleQuoteCount = 0
      let doubleQuoteCount = 0
      let inSingleQuote = false
      let inDoubleQuote = false

      for (const char of sqlString) {
        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote
          singleQuoteCount++
        } else if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote
          doubleQuoteCount++
        }
      }

      if (inSingleQuote || inDoubleQuote) return false
      if (singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) return false

      return true
    } catch (error) {
      return false
    }
  }

  // Format SQL
  function formatSql(sqlString: string): string {
    try {
      if (!sqlString.trim()) return sqlString

      // Simple SQL formatting
      let formatted = sqlString.replace(/\s+/g, ' ').trim()

      // Add line breaks after major keywords
      formatted = formatted
        .replace(
          /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET)\b/gi,
          '\n$1'
        )
        .replace(/\n\s+/g, '\n')
        .trim()

      // Add proper indentation
      const lines = formatted.split('\n')
      const formattedLines: string[] = []
      let indentLevel = 0

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          formattedLines.push('')
          continue
        }

        // Decrease indent for certain keywords
        if (
          trimmed.match(
            /^\b(WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET)\b/i
          )
        ) {
          indentLevel = Math.max(0, indentLevel - 1)
        }

        const indent = '  '.repeat(indentLevel)
        formattedLines.push(indent + trimmed)

        // Increase indent for certain keywords
        if (trimmed.match(/^\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM)\b/i)) {
          indentLevel++
        }
      }

      return formattedLines.join('\n')
    } catch (error) {
      return sqlString
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement
    const newValue = target.value

    value = newValue
    isValidSql = validateSql(newValue)

    if (!isValidSql) {
      sqlError = 'Invalid SQL structure'
    } else {
      sqlError = ''
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

  // Format SQL
  function formatSqlAction() {
    if (disabled) return

    const formatted = formatSql(value)
    value = formatted
    isValidSql = true
    sqlError = ''

    if (onchange) {
      onchange(formatted)
    }
  }

  // Get SQL preview
  function getSqlPreview(): string {
    if (!value) return 'No content'

    if (isValidSql) {
      return formatSql(value)
    } else {
      return value
    }
  }
</script>

<div class={getSqlEditorClasses()} {...restProps}>
  <div class="theme-sqleditor-header">
    <div class="theme-sqleditor-title">SQL Editor</div>

    <div class="theme-sqleditor-actions">
      <button
        class="theme-sqleditor-format"
        onclick={formatSqlAction}
        {disabled}
        aria-label="Format SQL"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          ></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </button>

      <button
        class="theme-sqleditor-toggle"
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
        class="theme-sqleditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy SQL"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  {#if !isValidSql && !isPreview}
    <div class="theme-sqleditor-error-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>Invalid SQL: {sqlError}</span>
    </div>
  {/if}

  <div class="theme-sqleditor-content">
    {#if isPreview}
      <div class="theme-sqleditor-preview">
        <pre><code>{getSqlPreview()}</code></pre>
      </div>
    {:else}
      <textarea
        bind:this={textareaElement}
        class="theme-sqleditor-textarea"
        {value}
        {disabled}
        oninput={handleInputChange}
        onkeydown={handleKeydown}
        placeholder="Enter your SQL here..."
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      ></textarea>
    {/if}
  </div>

  {#if children}
    <div class="theme-sqleditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-sqleditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-sqleditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-sqleditor-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-sqleditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-sqleditor-format,
  .theme-sqleditor-toggle,
  .theme-sqleditor-copy {
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

  .theme-sqleditor-format:hover:not(:disabled),
  .theme-sqleditor-toggle:hover:not(:disabled),
  .theme-sqleditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-sqleditor-format:focus,
  .theme-sqleditor-toggle:focus,
  .theme-sqleditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-sqleditor-format:disabled,
  .theme-sqleditor-toggle:disabled,
  .theme-sqleditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-sqleditor-format svg,
  .theme-sqleditor-toggle svg,
  .theme-sqleditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-sqleditor-error-message {
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

  .theme-sqleditor-error-message svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .theme-sqleditor-content {
    position: relative;
  }

  .theme-sqleditor-textarea {
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

  .theme-sqleditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-sqleditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-sqleditor-preview {
    padding: 16px;
    background: var(--color-code-background);
    min-height: 200px;
    overflow-x: auto;
  }

  .theme-sqleditor-preview pre {
    margin: 0;
    font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .theme-sqleditor-preview code {
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
  }

  .theme-sqleditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-sqleditor-sm .theme-sqleditor-textarea,
  .theme-sqleditor-sm .theme-sqleditor-preview {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-sqleditor-sm .theme-sqleditor-header {
    padding: 8px 12px;
  }

  .theme-sqleditor-sm .theme-sqleditor-title {
    font-size: 12px;
  }

  .theme-sqleditor-sm .theme-sqleditor-format,
  .theme-sqleditor-sm .theme-sqleditor-toggle,
  .theme-sqleditor-sm .theme-sqleditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-sqleditor-sm .theme-sqleditor-format svg,
  .theme-sqleditor-sm .theme-sqleditor-toggle svg,
  .theme-sqleditor-sm .theme-sqleditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-sqleditor-md .theme-sqleditor-textarea,
  .theme-sqleditor-md .theme-sqleditor-preview {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-sqleditor-md .theme-sqleditor-header {
    padding: 12px 16px;
  }

  .theme-sqleditor-md .theme-sqleditor-title {
    font-size: 14px;
  }

  .theme-sqleditor-md .theme-sqleditor-format,
  .theme-sqleditor-md .theme-sqleditor-toggle,
  .theme-sqleditor-md .theme-sqleditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-sqleditor-md .theme-sqleditor-format svg,
  .theme-sqleditor-md .theme-sqleditor-toggle svg,
  .theme-sqleditor-md .theme-sqleditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-sqleditor-lg .theme-sqleditor-textarea,
  .theme-sqleditor-lg .theme-sqleditor-preview {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-sqleditor-lg .theme-sqleditor-header {
    padding: 16px 20px;
  }

  .theme-sqleditor-lg .theme-sqleditor-title {
    font-size: 16px;
  }

  .theme-sqleditor-lg .theme-sqleditor-format,
  .theme-sqleditor-lg .theme-sqleditor-toggle,
  .theme-sqleditor-lg .theme-sqleditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-sqleditor-lg .theme-sqleditor-format svg,
  .theme-sqleditor-lg .theme-sqleditor-toggle svg,
  .theme-sqleditor-lg .theme-sqleditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-sqleditor-xl .theme-sqleditor-textarea,
  .theme-sqleditor-xl .theme-sqleditor-preview {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-sqleditor-xl .theme-sqleditor-header {
    padding: 20px 24px;
  }

  .theme-sqleditor-xl .theme-sqleditor-title {
    font-size: 18px;
  }

  .theme-sqleditor-xl .theme-sqleditor-format,
  .theme-sqleditor-xl .theme-sqleditor-toggle,
  .theme-sqleditor-xl .theme-sqleditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-sqleditor-xl .theme-sqleditor-format svg,
  .theme-sqleditor-xl .theme-sqleditor-toggle svg,
  .theme-sqleditor-xl .theme-sqleditor-copy svg {
    width: 18px;
    height: 18px;
  }

  /* States */
  .theme-sqleditor-disabled .theme-sqleditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-sqleditor-disabled .theme-sqleditor-format,
  .theme-sqleditor-disabled .theme-sqleditor-toggle,
  .theme-sqleditor-disabled .theme-sqleditor-copy {
    cursor: not-allowed;
  }

  .theme-sqleditor-error {
    border-color: var(--color-error);
  }

  .theme-sqleditor-error .theme-sqleditor-textarea {
    border-color: var(--color-error);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-sqleditor-textarea,
    .theme-sqleditor-preview {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-sqleditor-header {
      padding: 8px 12px;
    }

    .theme-sqleditor-title {
      font-size: 13px;
    }

    .theme-sqleditor-format,
    .theme-sqleditor-toggle,
    .theme-sqleditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-sqleditor-format svg,
    .theme-sqleditor-toggle svg,
    .theme-sqleditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .theme-sqleditor-sm .theme-sqleditor-textarea,
    .theme-sqleditor-sm .theme-sqleditor-preview {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-sqleditor-sm .theme-sqleditor-header {
      padding: 6px 8px;
    }

    .theme-sqleditor-sm .theme-sqleditor-title {
      font-size: 11px;
    }

    .theme-sqleditor-sm .theme-sqleditor-format,
    .theme-sqleditor-sm .theme-sqleditor-toggle,
    .theme-sqleditor-sm .theme-sqleditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-sqleditor-sm .theme-sqleditor-format svg,
    .theme-sqleditor-sm .theme-sqleditor-toggle svg,
    .theme-sqleditor-sm .theme-sqleditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-sqleditor-lg .theme-sqleditor-textarea,
    .theme-sqleditor-lg .theme-sqleditor-preview {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-sqleditor-lg .theme-sqleditor-header {
      padding: 12px 16px;
    }

    .theme-sqleditor-lg .theme-sqleditor-title {
      font-size: 15px;
    }

    .theme-sqleditor-lg .theme-sqleditor-format,
    .theme-sqleditor-lg .theme-sqleditor-toggle,
    .theme-sqleditor-lg .theme-sqleditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-sqleditor-lg .theme-sqleditor-format svg,
    .theme-sqleditor-lg .theme-sqleditor-toggle svg,
    .theme-sqleditor-lg .theme-sqleditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-sqleditor-xl .theme-sqleditor-textarea,
    .theme-sqleditor-xl .theme-sqleditor-preview {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-sqleditor-xl .theme-sqleditor-header {
      padding: 16px 20px;
    }

    .theme-sqleditor-xl .theme-sqleditor-title {
      font-size: 17px;
    }

    .theme-sqleditor-xl .theme-sqleditor-format,
    .theme-sqleditor-xl .theme-sqleditor-toggle,
    .theme-sqleditor-xl .theme-sqleditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-sqleditor-xl .theme-sqleditor-format svg,
    .theme-sqleditor-xl .theme-sqleditor-toggle svg,
    .theme-sqleditor-xl .theme-sqleditor-copy svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
