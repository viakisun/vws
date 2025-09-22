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
  let isValidYaml = $state(true)
  let yamlError = $state('')

  // Get YAML editor classes
  function getYamlEditorClasses(): string {
    const baseClasses = 'theme-yamleditor'
    const sizeClass = `theme-yamleditor-${size}`
    const variantClass = `theme-yamleditor-${variant}`
    const disabledClass = disabled ? 'theme-yamleditor-disabled' : ''
    const errorClass = !isValidYaml ? 'theme-yamleditor-error' : ''

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

  // Validate YAML
  function validateYaml(yamlString: string): boolean {
    try {
      // Simple YAML validation - check for basic structure
      const lines = yamlString.split('\n')
      let indentLevel = 0
      let prevIndent = 0

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const currentIndent = line.length - line.trimStart().length

        // Check for consistent indentation
        if (currentIndent > 0 && currentIndent % 2 !== 0) {
          return false
        }

        // Check for proper key-value structure
        if (trimmed.includes(':')) {
          const [key, value] = trimmed.split(':', 2)
          if (!key.trim()) {
            return false
          }
        }

        prevIndent = currentIndent
      }

      return true
    } catch (error) {
      return false
    }
  }

  // Format YAML
  function formatYaml(yamlString: string): string {
    try {
      // Simple YAML formatting - ensure consistent indentation
      const lines = yamlString.split('\n')
      const formattedLines: string[] = []
      let indentLevel = 0

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) {
          formattedLines.push(line)
          continue
        }

        const currentIndent = line.length - line.trimStart().length
        const newIndent = '  '.repeat(indentLevel)

        // Adjust indent level based on content
        if (trimmed.endsWith(':')) {
          formattedLines.push(newIndent + trimmed)
          indentLevel++
        } else if (trimmed.startsWith('- ')) {
          formattedLines.push(newIndent + trimmed)
        } else {
          formattedLines.push(newIndent + trimmed)
          if (currentIndent < indentLevel * 2) {
            indentLevel = Math.max(0, indentLevel - 1)
          }
        }
      }

      return formattedLines.join('\n')
    } catch (error) {
      return yamlString
    }
  }

  // Handle input change
  function handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement
    const newValue = target.value

    value = newValue
    isValidYaml = validateYaml(newValue)

    if (!isValidYaml) {
      yamlError = 'Invalid YAML structure'
    } else {
      yamlError = ''
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

  // Format YAML
  function formatYamlAction() {
    if (disabled) return

    const formatted = formatYaml(value)
    value = formatted
    isValidYaml = true
    yamlError = ''

    if (onchange) {
      onchange(formatted)
    }
  }

  // Get YAML preview
  function getYamlPreview(): string {
    if (!value) return 'No content'

    if (isValidYaml) {
      return formatYaml(value)
    } else {
      return value
    }
  }
</script>

<div class={getYamlEditorClasses()} {...restProps}>
  <div class="theme-yamleditor-header">
    <div class="theme-yamleditor-title">YAML Editor</div>

    <div class="theme-yamleditor-actions">
      <button
        class="theme-yamleditor-format"
        onclick={formatYamlAction}
        {disabled}
        aria-label="Format YAML"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          ></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </button>

      <button
        class="theme-yamleditor-toggle"
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
        class="theme-yamleditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy YAML"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  {#if !isValidYaml && !isPreview}
    <div class="theme-yamleditor-error-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>Invalid YAML: {yamlError}</span>
    </div>
  {/if}

  <div class="theme-yamleditor-content">
    {#if isPreview}
      <div class="theme-yamleditor-preview">
        <pre><code>{getYamlPreview()}</code></pre>
      </div>
    {:else}
      <textarea
        bind:this={textareaElement}
        class="theme-yamleditor-textarea"
        {value}
        {disabled}
        oninput={handleInputChange}
        onkeydown={handleKeydown}
        placeholder="Enter your YAML here..."
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      ></textarea>
    {/if}
  </div>

  {#if children}
    <div class="theme-yamleditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-yamleditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-yamleditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-yamleditor-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-yamleditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-yamleditor-format,
  .theme-yamleditor-toggle,
  .theme-yamleditor-copy {
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

  .theme-yamleditor-format:hover:not(:disabled),
  .theme-yamleditor-toggle:hover:not(:disabled),
  .theme-yamleditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-yamleditor-format:focus,
  .theme-yamleditor-toggle:focus,
  .theme-yamleditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-yamleditor-format:disabled,
  .theme-yamleditor-toggle:disabled,
  .theme-yamleditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-yamleditor-format svg,
  .theme-yamleditor-toggle svg,
  .theme-yamleditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-yamleditor-error-message {
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

  .theme-yamleditor-error-message svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .theme-yamleditor-content {
    position: relative;
  }

  .theme-yamleditor-textarea {
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

  .theme-yamleditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-yamleditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-yamleditor-preview {
    padding: 16px;
    background: var(--color-code-background);
    min-height: 200px;
    overflow-x: auto;
  }

  .theme-yamleditor-preview pre {
    margin: 0;
    font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .theme-yamleditor-preview code {
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
  }

  .theme-yamleditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-yamleditor-sm .theme-yamleditor-textarea,
  .theme-yamleditor-sm .theme-yamleditor-preview {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-yamleditor-sm .theme-yamleditor-header {
    padding: 8px 12px;
  }

  .theme-yamleditor-sm .theme-yamleditor-title {
    font-size: 12px;
  }

  .theme-yamleditor-sm .theme-yamleditor-format,
  .theme-yamleditor-sm .theme-yamleditor-toggle,
  .theme-yamleditor-sm .theme-yamleditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-yamleditor-sm .theme-yamleditor-format svg,
  .theme-yamleditor-sm .theme-yamleditor-toggle svg,
  .theme-yamleditor-sm .theme-yamleditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-yamleditor-md .theme-yamleditor-textarea,
  .theme-yamleditor-md .theme-yamleditor-preview {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-yamleditor-md .theme-yamleditor-header {
    padding: 12px 16px;
  }

  .theme-yamleditor-md .theme-yamleditor-title {
    font-size: 14px;
  }

  .theme-yamleditor-md .theme-yamleditor-format,
  .theme-yamleditor-md .theme-yamleditor-toggle,
  .theme-yamleditor-md .theme-yamleditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-yamleditor-md .theme-yamleditor-format svg,
  .theme-yamleditor-md .theme-yamleditor-toggle svg,
  .theme-yamleditor-md .theme-yamleditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-yamleditor-lg .theme-yamleditor-textarea,
  .theme-yamleditor-lg .theme-yamleditor-preview {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-yamleditor-lg .theme-yamleditor-header {
    padding: 16px 20px;
  }

  .theme-yamleditor-lg .theme-yamleditor-title {
    font-size: 16px;
  }

  .theme-yamleditor-lg .theme-yamleditor-format,
  .theme-yamleditor-lg .theme-yamleditor-toggle,
  .theme-yamleditor-lg .theme-yamleditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-yamleditor-lg .theme-yamleditor-format svg,
  .theme-yamleditor-lg .theme-yamleditor-toggle svg,
  .theme-yamleditor-lg .theme-yamleditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-yamleditor-xl .theme-yamleditor-textarea,
  .theme-yamleditor-xl .theme-yamleditor-preview {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-yamleditor-xl .theme-yamleditor-header {
    padding: 20px 24px;
  }

  .theme-yamleditor-xl .theme-yamleditor-title {
    font-size: 18px;
  }

  .theme-yamleditor-xl .theme-yamleditor-format,
  .theme-yamleditor-xl .theme-yamleditor-toggle,
  .theme-yamleditor-xl .theme-yamleditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-yamleditor-xl .theme-yamleditor-format svg,
  .theme-yamleditor-xl .theme-yamleditor-toggle svg,
  .theme-yamleditor-xl .theme-yamleditor-copy svg {
    width: 18px;
    height: 18px;
  }

  /* States */
  .theme-yamleditor-disabled .theme-yamleditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-yamleditor-disabled .theme-yamleditor-format,
  .theme-yamleditor-disabled .theme-yamleditor-toggle,
  .theme-yamleditor-disabled .theme-yamleditor-copy {
    cursor: not-allowed;
  }

  .theme-yamleditor-error {
    border-color: var(--color-error);
  }

  .theme-yamleditor-error .theme-yamleditor-textarea {
    border-color: var(--color-error);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-yamleditor-textarea,
    .theme-yamleditor-preview {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-yamleditor-header {
      padding: 8px 12px;
    }

    .theme-yamleditor-title {
      font-size: 13px;
    }

    .theme-yamleditor-format,
    .theme-yamleditor-toggle,
    .theme-yamleditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-yamleditor-format svg,
    .theme-yamleditor-toggle svg,
    .theme-yamleditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .theme-yamleditor-sm .theme-yamleditor-textarea,
    .theme-yamleditor-sm .theme-yamleditor-preview {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-yamleditor-sm .theme-yamleditor-header {
      padding: 6px 8px;
    }

    .theme-yamleditor-sm .theme-yamleditor-title {
      font-size: 11px;
    }

    .theme-yamleditor-sm .theme-yamleditor-format,
    .theme-yamleditor-sm .theme-yamleditor-toggle,
    .theme-yamleditor-sm .theme-yamleditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-yamleditor-sm .theme-yamleditor-format svg,
    .theme-yamleditor-sm .theme-yamleditor-toggle svg,
    .theme-yamleditor-sm .theme-yamleditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-yamleditor-lg .theme-yamleditor-textarea,
    .theme-yamleditor-lg .theme-yamleditor-preview {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-yamleditor-lg .theme-yamleditor-header {
      padding: 12px 16px;
    }

    .theme-yamleditor-lg .theme-yamleditor-title {
      font-size: 15px;
    }

    .theme-yamleditor-lg .theme-yamleditor-format,
    .theme-yamleditor-lg .theme-yamleditor-toggle,
    .theme-yamleditor-lg .theme-yamleditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-yamleditor-lg .theme-yamleditor-format svg,
    .theme-yamleditor-lg .theme-yamleditor-toggle svg,
    .theme-yamleditor-lg .theme-yamleditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-yamleditor-xl .theme-yamleditor-textarea,
    .theme-yamleditor-xl .theme-yamleditor-preview {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-yamleditor-xl .theme-yamleditor-header {
      padding: 16px 20px;
    }

    .theme-yamleditor-xl .theme-yamleditor-title {
      font-size: 17px;
    }

    .theme-yamleditor-xl .theme-yamleditor-format,
    .theme-yamleditor-xl .theme-yamleditor-toggle,
    .theme-yamleditor-xl .theme-yamleditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-yamleditor-xl .theme-yamleditor-format svg,
    .theme-yamleditor-xl .theme-yamleditor-toggle svg,
    .theme-yamleditor-xl .theme-yamleditor-copy svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
