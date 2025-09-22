<script lang="ts">
  // Props
  interface Props {
    value?: string
    language?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (value: string) => void
    children?: any
  }

  let {
    value = '',
    language = 'javascript',
    disabled = false,
    size = 'md',
    variant = 'default',
    class: className = '',
    onchange,
    children,
    ...restProps
  }: Props = $props()

  // State
  let textareaElement: HTMLTextAreaElement

  // Get code editor classes
  function getCodeEditorClasses(): string {
    const baseClasses = 'theme-codeeditor'
    const sizeClass = `theme-codeeditor-${size}`
    const variantClass = `theme-codeeditor-${variant}`
    const disabledClass = disabled ? 'theme-codeeditor-disabled' : ''

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

  // Get language display name
  function getLanguageDisplayName(): string {
    const languageMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      csharp: 'C#',
      php: 'PHP',
      ruby: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      swift: 'Swift',
      kotlin: 'Kotlin',
      scala: 'Scala',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      less: 'Less',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      markdown: 'Markdown',
      sql: 'SQL',
      bash: 'Bash',
      shell: 'Shell',
      powershell: 'PowerShell',
      dockerfile: 'Dockerfile',
      makefile: 'Makefile',
      cmake: 'CMake',
      gradle: 'Gradle',
      maven: 'Maven',
      npm: 'NPM',
      yarn: 'Yarn',
      git: 'Git',
      svn: 'SVN',
      mercurial: 'Mercurial',
      perforce: 'Perforce',
      clearcase: 'ClearCase',
      tfs: 'TFS',
      vss: 'VSS',
      cvs: 'CVS',
      rcs: 'RCS',
      sccs: 'SCCS',
      bitkeeper: 'BitKeeper'
    }

    return languageMap[language] || language.toUpperCase()
  }
</script>

<div class={getCodeEditorClasses()} {...restProps}>
  <div class="theme-codeeditor-header">
    <div class="theme-codeeditor-language">
      {getLanguageDisplayName()}
    </div>

    <div class="theme-codeeditor-actions">
      <button
        class="theme-codeeditor-copy"
        onclick={() => navigator.clipboard?.writeText(value)}
        {disabled}
        aria-label="Copy code"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="theme-codeeditor-content">
    <textarea
      bind:this={textareaElement}
      class="theme-codeeditor-textarea"
      {value}
      {disabled}
      oninput={handleInputChange}
      onkeydown={handleKeydown}
      placeholder="Enter your code here..."
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
    ></textarea>
  </div>

  {#if children}
    <div class="theme-codeeditor-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-codeeditor {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .theme-codeeditor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .theme-codeeditor-language {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .theme-codeeditor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-codeeditor-copy {
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

  .theme-codeeditor-copy:hover:not(:disabled) {
    background: var(--color-border);
    color: var(--color-text);
  }

  .theme-codeeditor-copy:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-codeeditor-copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .theme-codeeditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-codeeditor-content {
    position: relative;
  }

  .theme-codeeditor-textarea {
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

  .theme-codeeditor-textarea:focus {
    outline: none;
    background: var(--color-surface);
  }

  .theme-codeeditor-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .theme-codeeditor-children {
    padding: 16px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
  }

  /* Sizes */
  .theme-codeeditor-sm .theme-codeeditor-textarea {
    font-size: 12px;
    padding: 12px;
    min-height: 150px;
  }

  .theme-codeeditor-sm .theme-codeeditor-header {
    padding: 8px 12px;
  }

  .theme-codeeditor-sm .theme-codeeditor-language {
    font-size: 11px;
  }

  .theme-codeeditor-sm .theme-codeeditor-copy {
    width: 20px;
    height: 20px;
  }

  .theme-codeeditor-sm .theme-codeeditor-copy svg {
    width: 12px;
    height: 12px;
  }

  .theme-codeeditor-md .theme-codeeditor-textarea {
    font-size: 14px;
    padding: 16px;
    min-height: 200px;
  }

  .theme-codeeditor-md .theme-codeeditor-header {
    padding: 12px 16px;
  }

  .theme-codeeditor-md .theme-codeeditor-language {
    font-size: 12px;
  }

  .theme-codeeditor-md .theme-codeeditor-copy {
    width: 24px;
    height: 24px;
  }

  .theme-codeeditor-md .theme-codeeditor-copy svg {
    width: 14px;
    height: 14px;
  }

  .theme-codeeditor-lg .theme-codeeditor-textarea {
    font-size: 16px;
    padding: 20px;
    min-height: 250px;
  }

  .theme-codeeditor-lg .theme-codeeditor-header {
    padding: 16px 20px;
  }

  .theme-codeeditor-lg .theme-codeeditor-language {
    font-size: 13px;
  }

  .theme-codeeditor-lg .theme-codeeditor-copy {
    width: 28px;
    height: 28px;
  }

  .theme-codeeditor-lg .theme-codeeditor-copy svg {
    width: 16px;
    height: 16px;
  }

  .theme-codeeditor-xl .theme-codeeditor-textarea {
    font-size: 18px;
    padding: 24px;
    min-height: 300px;
  }

  .theme-codeeditor-xl .theme-codeeditor-header {
    padding: 20px 24px;
  }

  .theme-codeeditor-xl .theme-codeeditor-language {
    font-size: 14px;
  }

  .theme-codeeditor-xl .theme-codeeditor-copy {
    width: 32px;
    height: 32px;
  }

  .theme-codeeditor-xl .theme-codeeditor-copy svg {
    width: 18px;
    height: 18px;
  }

  /* States */
  .theme-codeeditor-disabled .theme-codeeditor-textarea {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-codeeditor-disabled .theme-codeeditor-copy {
    cursor: not-allowed;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-codeeditor-textarea {
      font-size: 13px;
      padding: 12px;
      min-height: 150px;
    }

    .theme-codeeditor-header {
      padding: 8px 12px;
    }

    .theme-codeeditor-language {
      font-size: 11px;
    }

    .theme-codeeditor-copy {
      width: 20px;
      height: 20px;
    }

    .theme-codeeditor-copy svg {
      width: 12px;
      height: 12px;
    }

    .theme-codeeditor-sm .theme-codeeditor-textarea {
      font-size: 11px;
      padding: 8px;
      min-height: 120px;
    }

    .theme-codeeditor-sm .theme-codeeditor-header {
      padding: 6px 8px;
    }

    .theme-codeeditor-sm .theme-codeeditor-language {
      font-size: 10px;
    }

    .theme-codeeditor-sm .theme-codeeditor-copy {
      width: 18px;
      height: 18px;
    }

    .theme-codeeditor-sm .theme-codeeditor-copy svg {
      width: 10px;
      height: 10px;
    }

    .theme-codeeditor-lg .theme-codeeditor-textarea {
      font-size: 15px;
      padding: 16px;
      min-height: 200px;
    }

    .theme-codeeditor-lg .theme-codeeditor-header {
      padding: 12px 16px;
    }

    .theme-codeeditor-lg .theme-codeeditor-language {
      font-size: 12px;
    }

    .theme-codeeditor-lg .theme-codeeditor-copy {
      width: 24px;
      height: 24px;
    }

    .theme-codeeditor-lg .theme-codeeditor-copy svg {
      width: 14px;
      height: 14px;
    }

    .theme-codeeditor-xl .theme-codeeditor-textarea {
      font-size: 17px;
      padding: 20px;
      min-height: 250px;
    }

    .theme-codeeditor-xl .theme-codeeditor-header {
      padding: 16px 20px;
    }

    .theme-codeeditor-xl .theme-codeeditor-language {
      font-size: 13px;
    }

    .theme-codeeditor-xl .theme-codeeditor-copy {
      width: 28px;
      height: 28px;
    }

    .theme-codeeditor-xl .theme-codeeditor-copy svg {
      width: 16px;
      height: 16px;
    }
  }
</style>
