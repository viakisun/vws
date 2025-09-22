<script lang="ts">
  // Props
  interface Props {
    accept?: string
    multiple?: boolean
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (files: FileList) => void
    children?: any
  }

  let {
    accept = '*/*',
    multiple = false,
    disabled = false,
    size = 'md',
    variant = 'default',
    class: className = '',
    onchange,
    children,
    ...restProps
  }: Props = $props()

  // State
  let isDragOver = $state(false)
  let selectedFiles: FileList | null = null

  // Get file upload classes
  function getFileUploadClasses(): string {
    const baseClasses = 'theme-fileupload'
    const sizeClass = `theme-fileupload-${size}`
    const variantClass = `theme-fileupload-${variant}`
    const disabledClass = disabled ? 'theme-fileupload-disabled' : ''
    const dragOverClass = isDragOver ? 'theme-fileupload-dragover' : ''

    return [baseClasses, sizeClass, variantClass, disabledClass, dragOverClass, className]
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

  // Handle file change
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files

    if (files && files.length > 0) {
      selectedFiles = files
      if (onchange) {
        onchange(files)
      }
    }
  }

  // Handle drag over
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    if (!disabled) {
      isDragOver = true
    }
  }

  // Handle drag leave
  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragOver = false
  }

  // Handle drop
  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragOver = false

    if (disabled) return

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      selectedFiles = files
      if (onchange) {
        onchange(files)
      }
    }
  }

  // Handle click
  function handleClick() {
    if (!disabled) {
      const input = document.getElementById('file-input') as HTMLInputElement
      input?.click()
    }
  }

  // Get file names
  function getFileNames(): string {
    if (!selectedFiles) return ''

    const names = Array.from(selectedFiles).map(file => file.name)
    return names.join(', ')
  }

  // Get file size
  function getFileSize(): string {
    if (!selectedFiles) return ''

    const totalSize = Array.from(selectedFiles).reduce((sum, file) => sum + file.size, 0)
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
    return `${sizeInMB} MB`
  }
</script>

<div
  class={getFileUploadClasses()}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={handleClick}
  {...restProps}
>
  <input
    id="file-input"
    type="file"
    {accept}
    {multiple}
    {disabled}
    onchange={handleFileChange}
    style="display: none;"
    aria-label="File upload"
  />

  <div class="theme-fileupload-content">
    <div class="theme-fileupload-icon" style="color: {getColor()};">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7,10 12,15 17,10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    </div>

    <div class="theme-fileupload-text">
      <div class="theme-fileupload-title">
        {selectedFiles ? 'Files Selected' : 'Drop files here or click to upload'}
      </div>

      {#if selectedFiles}
        <div class="theme-fileupload-files">
          <div class="theme-fileupload-filename">{getFileNames()}</div>
          <div class="theme-fileupload-filesize">{getFileSize()}</div>
        </div>
      {:else}
        <div class="theme-fileupload-subtitle">
          {multiple ? 'Select multiple files' : 'Select a file'}
        </div>
      {/if}
    </div>
  </div>

  {#if children}
    <div class="theme-fileupload-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-fileupload {
    border: 2px dashed var(--color-border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    position: relative;
    overflow: hidden;
  }

  .theme-fileupload:hover:not(.theme-fileupload-disabled) {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .theme-fileupload-dragover {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    transform: scale(1.02);
  }

  .theme-fileupload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .theme-fileupload-icon {
    font-size: 48px;
    line-height: 1;
  }

  .theme-fileupload-icon svg {
    width: 48px;
    height: 48px;
  }

  .theme-fileupload-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-fileupload-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-fileupload-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .theme-fileupload-files {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .theme-fileupload-filename {
    font-size: 14px;
    color: var(--color-text);
    font-weight: 500;
    word-break: break-all;
  }

  .theme-fileupload-filesize {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .theme-fileupload-children {
    margin-top: 16px;
  }

  /* Sizes */
  .theme-fileupload-sm {
    padding: 16px;
  }

  .theme-fileupload-sm .theme-fileupload-icon {
    font-size: 32px;
  }

  .theme-fileupload-sm .theme-fileupload-icon svg {
    width: 32px;
    height: 32px;
  }

  .theme-fileupload-sm .theme-fileupload-title {
    font-size: 14px;
  }

  .theme-fileupload-sm .theme-fileupload-subtitle {
    font-size: 12px;
  }

  .theme-fileupload-sm .theme-fileupload-filename {
    font-size: 12px;
  }

  .theme-fileupload-sm .theme-fileupload-filesize {
    font-size: 11px;
  }

  .theme-fileupload-md {
    padding: 24px;
  }

  .theme-fileupload-md .theme-fileupload-icon {
    font-size: 48px;
  }

  .theme-fileupload-md .theme-fileupload-icon svg {
    width: 48px;
    height: 48px;
  }

  .theme-fileupload-md .theme-fileupload-title {
    font-size: 16px;
  }

  .theme-fileupload-md .theme-fileupload-subtitle {
    font-size: 14px;
  }

  .theme-fileupload-md .theme-fileupload-filename {
    font-size: 14px;
  }

  .theme-fileupload-md .theme-fileupload-filesize {
    font-size: 12px;
  }

  .theme-fileupload-lg {
    padding: 32px;
  }

  .theme-fileupload-lg .theme-fileupload-icon {
    font-size: 64px;
  }

  .theme-fileupload-lg .theme-fileupload-icon svg {
    width: 64px;
    height: 64px;
  }

  .theme-fileupload-lg .theme-fileupload-title {
    font-size: 18px;
  }

  .theme-fileupload-lg .theme-fileupload-subtitle {
    font-size: 16px;
  }

  .theme-fileupload-lg .theme-fileupload-filename {
    font-size: 16px;
  }

  .theme-fileupload-lg .theme-fileupload-filesize {
    font-size: 14px;
  }

  .theme-fileupload-xl {
    padding: 40px;
  }

  .theme-fileupload-xl .theme-fileupload-icon {
    font-size: 80px;
  }

  .theme-fileupload-xl .theme-fileupload-icon svg {
    width: 80px;
    height: 80px;
  }

  .theme-fileupload-xl .theme-fileupload-title {
    font-size: 20px;
  }

  .theme-fileupload-xl .theme-fileupload-subtitle {
    font-size: 18px;
  }

  .theme-fileupload-xl .theme-fileupload-filename {
    font-size: 18px;
  }

  .theme-fileupload-xl .theme-fileupload-filesize {
    font-size: 16px;
  }

  /* States */
  .theme-fileupload-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .theme-fileupload-disabled:hover {
    border-color: var(--color-border);
    background: var(--color-surface);
    transform: none;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-fileupload {
      padding: 20px;
    }

    .theme-fileupload-content {
      gap: 12px;
    }

    .theme-fileupload-icon {
      font-size: 40px;
    }

    .theme-fileupload-icon svg {
      width: 40px;
      height: 40px;
    }

    .theme-fileupload-title {
      font-size: 15px;
    }

    .theme-fileupload-subtitle {
      font-size: 13px;
    }

    .theme-fileupload-filename {
      font-size: 13px;
    }

    .theme-fileupload-filesize {
      font-size: 11px;
    }

    .theme-fileupload-sm {
      padding: 12px;
    }

    .theme-fileupload-sm .theme-fileupload-icon {
      font-size: 28px;
    }

    .theme-fileupload-sm .theme-fileupload-icon svg {
      width: 28px;
      height: 28px;
    }

    .theme-fileupload-lg {
      padding: 28px;
    }

    .theme-fileupload-lg .theme-fileupload-icon {
      font-size: 56px;
    }

    .theme-fileupload-lg .theme-fileupload-icon svg {
      width: 56px;
      height: 56px;
    }

    .theme-fileupload-xl {
      padding: 36px;
    }

    .theme-fileupload-xl .theme-fileupload-icon {
      font-size: 72px;
    }

    .theme-fileupload-xl .theme-fileupload-icon svg {
      width: 72px;
      height: 72px;
    }
  }
</style>
