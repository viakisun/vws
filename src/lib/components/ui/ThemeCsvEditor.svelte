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
  let isValidCsv = $state(true)
  let csvError = $state('')

  // Get CSV editor classes
  function getCsvEditorClasses(): string {
    const baseClasses = 'theme-csveditor'
    const sizeClass = `theme-csveditor-${size}`
    const variantClass = `theme-csveditor-${variant}`
    const disabledClass = disabled ? 'theme-csveditor-disabled' : ''
    const errorClass = !isValidCsv ? 'theme-csveditor-error' : ''

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

  // Validate CSV
  function validateCsv(csvString: string): boolean {
    try {
      if (!csvString.trim()) return true

      const lines = csvString.split('\n')
      if (lines.length === 0) return true

      // Check if all lines have the same number of columns
      const firstLineColumns = (lines[0].match(/,/g) || []).length + 1

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue // Skip empty lines

        const lineColumns = (line.match(/,/g) || []).length + 1
        if (lineColumns !== firstLineColumns) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  // Format CSV
  function formatCsv(csvString: string): string {
    try {
      if (!csvString.trim()) return csvString

      const lines = csvString.split('\n')
      const formattedLines: string[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          formattedLines.push('')
          continue
        }

        // Split by comma and rejoin with proper spacing
        const columns = trimmed.split(',').map(col => col.trim())
        formattedLines.push(columns.join(', '))
      }

      return formattedLines.join('\n')
    } catch (error) {
      return csvString
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement
    const newValue = target.value

    value = newValue
    isValidCsv = validateCsv(newValue)

    if (!isValidCsv) {
      csvError = 'Invalid CSV structure - all rows must have the same number of columns'
    } else {
      csvError = ''
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

  // Format CSV
  function formatCsvAction() {
    if (disabled) return

    const formatted = formatCsv(value)
    value = formatted
    isValidCsv = true
    csvError = ''

    if (onchange) {
      onchange(formatted)
    }
  }

  // Get CSV preview
  function getCsvPreview(): string {
    if (!value) return 'No content'

    if (isValidCsv) {
      return formatCsv(value)
    } else {
      return value
    }
  }

  // Get CSV table HTML
  function getCsvTableHtml(): string {
    if (!value || !isValidCsv) return '<p>No valid CSV data to display</p>'

    try {
      const lines = value.split('\n').filter(line => line.trim())
      if (lines.length === 0) return '<p>No data</p>'

      let html = '<table class="csv-table">'

      // Header row
      const headerColumns = lines[0].split(',').map(col => col.trim())
      html += '<thead><tr>'
      for (const column of headerColumns) {
        html += `<th>${column}</th>`
      }
      html += '</tr></thead>'

      // Data rows
      html += '<tbody>'
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim())
        html += '<tr>'
        for (const column of columns) {
          html += `<td>${column}</td>`
        }
        html += '</tr>'
      }
      html += '</tbody></table>'

      return html
    } catch (error) {
      return '<p>Error parsing CSV data</p>'
    }
  }
</script>

<div class={getCsvEditorClasses()} {...restProps}>
  <div class="theme-csveditor-header">
    <div class="theme-csveditor-title">CSV Editor</div>

    <div class="theme-csveditor-actions">
      <button
        class="theme-csveditor-format"
        onclick={formatCsvAction}
        {disabled}
        aria-label="Format CSV"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          ></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </button>

      <button
        class="theme-csveditor-toggle"
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
        class="theme-csveditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy CSV"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  {#if !isValidCsv && !isPreview}
    <div class="theme-csveditor-error-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>Invalid CSV: {csvError}</span>
    </div>
  {/if}

  <div class="theme-csveditor-content">
    {#if isPreview}
      <div class="theme-csveditor-preview">
        {#if isValidCsv}
          <div class="csv-table-container">
            {@html getCsvTableHtml()}
          </div>
        {:else}
          <pre><code>{getCsvPreview()}</code></pre>
        {/if}
      </div>
    {:else}
      <textarea
        bind:this={textareaElement}
        class="theme-csveditor-textarea"
        {value}
        {disabled}
        oninput={handleInputChange}
        onkeydown={handleKeydown}
        placeholder="Enter your CSV here..."
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      ></textarea>
    {/if}
  </div>

  {#if children}
    <div class="theme-csveditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-csveditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-csveditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-csveditor-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-csveditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-csveditor-format,
  .theme-csveditor-toggle,
  .theme-csveditor-copy {
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

  .theme-csveditor-format:hover:not(:disabled),
  .theme-csveditor-toggle:hover:not(:disabled),
  .theme-csveditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-csveditor-format:focus,
  .theme-csveditor-toggle:focus,
  .theme-csveditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-csveditor-format:disabled,
  .theme-csveditor-toggle:disabled,
  .theme-csveditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-csveditor-format svg,
  .theme-csveditor-toggle svg,
  .theme-csveditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-csveditor-error-message {
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

  .theme-csveditor-error-message svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .theme-csveditor-content {
    position: relative;
  }

  .theme-csveditor-textarea {
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

  .theme-csveditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-csveditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-csveditor-preview {
    padding: 16px;
    background: var(--color-code-background);
    min-height: 200px;
    overflow-x: auto;
  }

  .theme-csveditor-preview pre {
    margin: 0;
    font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .theme-csveditor-preview code {
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
  }

  .csv-table-container {
    overflow-x: auto;
  }

  .csv-table {
    width: 100%;
    border-collapse: collapse;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
      'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    background: var(--color-surface);
    border-radius: 8px;
    overflow: hidden;
  }

  /* CSV 테이블 스타일은 동적으로 생성되는 테이블에만 적용 */

  /* CSV 테이블 스타일은 동적으로 생성되는 테이블에만 적용 */

  .theme-csveditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-csveditor-sm .theme-csveditor-textarea,
  .theme-csveditor-sm .theme-csveditor-preview {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-csveditor-sm .theme-csveditor-header {
    padding: 8px 12px;
  }

  .theme-csveditor-sm .theme-csveditor-title {
    font-size: 12px;
  }

  .theme-csveditor-sm .theme-csveditor-format,
  .theme-csveditor-sm .theme-csveditor-toggle,
  .theme-csveditor-sm .theme-csveditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-csveditor-sm .theme-csveditor-format svg,
  .theme-csveditor-sm .theme-csveditor-toggle svg,
  .theme-csveditor-sm .theme-csveditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-csveditor-sm .csv-table {
    font-size: 12px;
  }

  .theme-csveditor-sm .csv-table th,
  .theme-csveditor-sm .csv-table td {
    padding: 6px 8px;
  }

  .theme-csveditor-md .theme-csveditor-textarea,
  .theme-csveditor-md .theme-csveditor-preview {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-csveditor-md .theme-csveditor-header {
    padding: 12px 16px;
  }

  .theme-csveditor-md .theme-csveditor-title {
    font-size: 14px;
  }

  .theme-csveditor-md .theme-csveditor-format,
  .theme-csveditor-md .theme-csveditor-toggle,
  .theme-csveditor-md .theme-csveditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-csveditor-md .theme-csveditor-format svg,
  .theme-csveditor-md .theme-csveditor-toggle svg,
  .theme-csveditor-md .theme-csveditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-csveditor-md .csv-table {
    font-size: 14px;
  }

  .theme-csveditor-md .csv-table th,
  .theme-csveditor-md .csv-table td {
    padding: 8px 12px;
  }

  .theme-csveditor-lg .theme-csveditor-textarea,
  .theme-csveditor-lg .theme-csveditor-preview {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-csveditor-lg .theme-csveditor-header {
    padding: 16px 20px;
  }

  .theme-csveditor-lg .theme-csveditor-title {
    font-size: 16px;
  }

  .theme-csveditor-lg .theme-csveditor-format,
  .theme-csveditor-lg .theme-csveditor-toggle,
  .theme-csveditor-lg .theme-csveditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-csveditor-lg .theme-csveditor-format svg,
  .theme-csveditor-lg .theme-csveditor-toggle svg,
  .theme-csveditor-lg .theme-csveditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-csveditor-lg .csv-table {
    font-size: 16px;
  }

  .theme-csveditor-lg .csv-table th,
  .theme-csveditor-lg .csv-table td {
    padding: 10px 16px;
  }

  .theme-csveditor-xl .theme-csveditor-textarea,
  .theme-csveditor-xl .theme-csveditor-preview {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-csveditor-xl .theme-csveditor-header {
    padding: 20px 24px;
  }

  .theme-csveditor-xl .theme-csveditor-title {
    font-size: 18px;
  }

  .theme-csveditor-xl .theme-csveditor-format,
  .theme-csveditor-xl .theme-csveditor-toggle,
  .theme-csveditor-xl .theme-csveditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-csveditor-xl .theme-csveditor-format svg,
  .theme-csveditor-xl .theme-csveditor-toggle svg,
  .theme-csveditor-xl .theme-csveditor-copy svg {
    width: 18px;
    height: 18px;
  }

  .theme-csveditor-xl .csv-table {
    font-size: 18px;
  }

  .theme-csveditor-xl .csv-table th,
  .theme-csveditor-xl .csv-table td {
    padding: 12px 20px;
  }

  /* States */
  .theme-csveditor-disabled .theme-csveditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-csveditor-disabled .theme-csveditor-format,
  .theme-csveditor-disabled .theme-csveditor-toggle,
  .theme-csveditor-disabled .theme-csveditor-copy {
    cursor: not-allowed;
  }

  .theme-csveditor-error {
    border-color: var(--color-error);
  }

  .theme-csveditor-error .theme-csveditor-textarea {
    border-color: var(--color-error);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-csveditor-textarea,
    .theme-csveditor-preview {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-csveditor-header {
      padding: 8px 12px;
    }

    .theme-csveditor-title {
      font-size: 13px;
    }

    .theme-csveditor-format,
    .theme-csveditor-toggle,
    .theme-csveditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-csveditor-format svg,
    .theme-csveditor-toggle svg,
    .theme-csveditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .csv-table {
      font-size: 13px;
    }

    .csv-table th,
    .csv-table td {
      padding: 6px 8px;
    }

    .theme-csveditor-sm .theme-csveditor-textarea,
    .theme-csveditor-sm .theme-csveditor-preview {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-csveditor-sm .theme-csveditor-header {
      padding: 6px 8px;
    }

    .theme-csveditor-sm .theme-csveditor-title {
      font-size: 11px;
    }

    .theme-csveditor-sm .theme-csveditor-format,
    .theme-csveditor-sm .theme-csveditor-toggle,
    .theme-csveditor-sm .theme-csveditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-csveditor-sm .theme-csveditor-format svg,
    .theme-csveditor-sm .theme-csveditor-toggle svg,
    .theme-csveditor-sm .theme-csveditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-csveditor-sm .csv-table {
      font-size: 11px;
    }

    .theme-csveditor-sm .csv-table th,
    .theme-csveditor-sm .csv-table td {
      padding: 4px 6px;
    }

    .theme-csveditor-lg .theme-csveditor-textarea,
    .theme-csveditor-lg .theme-csveditor-preview {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-csveditor-lg .theme-csveditor-header {
      padding: 12px 16px;
    }

    .theme-csveditor-lg .theme-csveditor-title {
      font-size: 15px;
    }

    .theme-csveditor-lg .theme-csveditor-format,
    .theme-csveditor-lg .theme-csveditor-toggle,
    .theme-csveditor-lg .theme-csveditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-csveditor-lg .theme-csveditor-format svg,
    .theme-csveditor-lg .theme-csveditor-toggle svg,
    .theme-csveditor-lg .theme-csveditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-csveditor-lg .csv-table {
      font-size: 15px;
    }

    .theme-csveditor-lg .csv-table th,
    .theme-csveditor-lg .csv-table td {
      padding: 8px 12px;
    }

    .theme-csveditor-xl .theme-csveditor-textarea,
    .theme-csveditor-xl .theme-csveditor-preview {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-csveditor-xl .theme-csveditor-header {
      padding: 16px 20px;
    }

    .theme-csveditor-xl .theme-csveditor-title {
      font-size: 17px;
    }

    .theme-csveditor-xl .theme-csveditor-format,
    .theme-csveditor-xl .theme-csveditor-toggle,
    .theme-csveditor-xl .theme-csveditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-csveditor-xl .theme-csveditor-format svg,
    .theme-csveditor-xl .theme-csveditor-toggle svg,
    .theme-csveditor-xl .theme-csveditor-copy svg {
      width: 16px;
      height: 16px;
    }

    .theme-csveditor-xl .csv-table {
      font-size: 17px;
    }

    .theme-csveditor-xl .csv-table th,
    .theme-csveditor-xl .csv-table td {
      padding: 10px 16px;
    }
  }
</style>
