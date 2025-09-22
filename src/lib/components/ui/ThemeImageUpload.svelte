<script lang="ts">
  // Props
  interface Props {
    value?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    class?: string
    onchange?: (imageUrl: string) => void
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
  let isDragOver = $state(false)
  let isUploading = $state(false)

  // Get image upload classes
  function getImageUploadClasses(): string {
    const baseClasses = 'theme-imageupload'
    const sizeClass = `theme-imageupload-${size}`
    const variantClass = `theme-imageupload-${variant}`
    const disabledClass = disabled ? 'theme-imageupload-disabled' : ''
    const dragOverClass = isDragOver ? 'theme-imageupload-dragover' : ''

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
    const file = target.files?.[0]

    if (file && file.type.startsWith('image/')) {
      uploadImage(file)
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

    const file = event.dataTransfer?.files[0]
    if (file && file.type.startsWith('image/')) {
      uploadImage(file)
    }
  }

  // Handle click
  function handleClick() {
    if (!disabled && !isUploading) {
      const input = document.getElementById('image-input') as HTMLInputElement
      input?.click()
    }
  }

  // Upload image
  function uploadImage(file: File) {
    isUploading = true

    // Create a FileReader to convert the file to a data URL
    const reader = new FileReader()
    reader.onload = e => {
      const imageUrl = e.target?.result as string
      value = imageUrl
      if (onchange) {
        onchange(imageUrl)
      }
      isUploading = false
    }
    reader.onerror = () => {
      isUploading = false
    }
    reader.readAsDataURL(file)
  }

  // Remove image
  function removeImage() {
    value = ''
    if (onchange) {
      onchange('')
    }
  }

  // Get image preview style
  function getImagePreviewStyle(): string {
    return `background-image: url(${value});`
  }
</script>

<div
  class={getImageUploadClasses()}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={handleClick}
  {...restProps}
>
  <input
    id="image-input"
    type="file"
    accept="image/*"
    {disabled}
    onchange={handleFileChange}
    style="display: none;"
    aria-label="Image upload"
  />

  {#if value}
    <div class="theme-imageupload-preview" style={getImagePreviewStyle()}>
      <div class="theme-imageupload-overlay">
        <button
          class="theme-imageupload-remove"
          onclick={e => {
            e.stopPropagation()
            removeImage()
          }}
          {disabled}
          aria-label="Remove image"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <div class="theme-imageupload-content">
      {#if isUploading}
        <div class="theme-imageupload-spinner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke-linecap="round"
              stroke-dasharray="60"
              stroke-dashoffset="60"
            >
              <animate
                attributeName="stroke-dasharray"
                dur="1.5s"
                values="0 60;60 0;0 60"
                repeatCount="indefinite"
              ></animate>
              <animate
                attributeName="stroke-dashoffset"
                dur="1.5s"
                values="0;-60;-60"
                repeatCount="indefinite"
              ></animate>
            </circle>
          </svg>
        </div>
      {:else}
        <div class="theme-imageupload-icon" style="color: {getColor()};">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21,15 16,10 5,21"></polyline>
          </svg>
        </div>
      {/if}

      <div class="theme-imageupload-text">
        <div class="theme-imageupload-title">
          {isUploading ? 'Uploading...' : 'Drop image here or click to upload'}
        </div>
        <div class="theme-imageupload-subtitle">
          {isUploading ? 'Please wait' : 'Select an image file'}
        </div>
      </div>
    </div>
  {/if}

  {#if children}
    <div class="theme-imageupload-children">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .theme-imageupload {
    border: 2px dashed var(--color-border);
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    position: relative;
    overflow: hidden;
    aspect-ratio: 16/9;
  }

  .theme-imageupload:hover:not(.theme-imageupload-disabled) {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .theme-imageupload-dragover {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    transform: scale(1.02);
  }

  .theme-imageupload-preview {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
  }

  .theme-imageupload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .theme-imageupload:hover .theme-imageupload-overlay {
    opacity: 1;
  }

  .theme-imageupload-remove {
    width: 40px;
    height: 40px;
    background: var(--color-error);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
  }

  .theme-imageupload-remove:hover {
    background: var(--color-error-hover);
    transform: scale(1.1);
  }

  .theme-imageupload-remove:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-imageupload-remove svg {
    width: 20px;
    height: 20px;
  }

  .theme-imageupload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    height: 100%;
    padding: 24px;
  }

  .theme-imageupload-icon {
    font-size: 48px;
    line-height: 1;
  }

  .theme-imageupload-icon svg {
    width: 48px;
    height: 48px;
  }

  .theme-imageupload-spinner {
    font-size: 48px;
    line-height: 1;
    color: var(--color-primary);
  }

  .theme-imageupload-spinner svg {
    width: 48px;
    height: 48px;
    animation: spin 1s linear infinite;
  }

  .theme-imageupload-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-imageupload-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }

  .theme-imageupload-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .theme-imageupload-children {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  }

  /* Sizes */
  .theme-imageupload-sm {
    aspect-ratio: 4/3;
  }

  .theme-imageupload-sm .theme-imageupload-icon {
    font-size: 32px;
  }

  .theme-imageupload-sm .theme-imageupload-icon svg {
    width: 32px;
    height: 32px;
  }

  .theme-imageupload-sm .theme-imageupload-spinner {
    font-size: 32px;
  }

  .theme-imageupload-sm .theme-imageupload-spinner svg {
    width: 32px;
    height: 32px;
  }

  .theme-imageupload-sm .theme-imageupload-title {
    font-size: 14px;
  }

  .theme-imageupload-sm .theme-imageupload-subtitle {
    font-size: 12px;
  }

  .theme-imageupload-sm .theme-imageupload-remove {
    width: 32px;
    height: 32px;
  }

  .theme-imageupload-sm .theme-imageupload-remove svg {
    width: 16px;
    height: 16px;
  }

  .theme-imageupload-md {
    aspect-ratio: 16/9;
  }

  .theme-imageupload-md .theme-imageupload-icon {
    font-size: 48px;
  }

  .theme-imageupload-md .theme-imageupload-icon svg {
    width: 48px;
    height: 48px;
  }

  .theme-imageupload-md .theme-imageupload-spinner {
    font-size: 48px;
  }

  .theme-imageupload-md .theme-imageupload-spinner svg {
    width: 48px;
    height: 48px;
  }

  .theme-imageupload-md .theme-imageupload-title {
    font-size: 16px;
  }

  .theme-imageupload-md .theme-imageupload-subtitle {
    font-size: 14px;
  }

  .theme-imageupload-md .theme-imageupload-remove {
    width: 40px;
    height: 40px;
  }

  .theme-imageupload-md .theme-imageupload-remove svg {
    width: 20px;
    height: 20px;
  }

  .theme-imageupload-lg {
    aspect-ratio: 16/9;
  }

  .theme-imageupload-lg .theme-imageupload-icon {
    font-size: 64px;
  }

  .theme-imageupload-lg .theme-imageupload-icon svg {
    width: 64px;
    height: 64px;
  }

  .theme-imageupload-lg .theme-imageupload-spinner {
    font-size: 64px;
  }

  .theme-imageupload-lg .theme-imageupload-spinner svg {
    width: 64px;
    height: 64px;
  }

  .theme-imageupload-lg .theme-imageupload-title {
    font-size: 18px;
  }

  .theme-imageupload-lg .theme-imageupload-subtitle {
    font-size: 16px;
  }

  .theme-imageupload-lg .theme-imageupload-remove {
    width: 48px;
    height: 48px;
  }

  .theme-imageupload-lg .theme-imageupload-remove svg {
    width: 24px;
    height: 24px;
  }

  .theme-imageupload-xl {
    aspect-ratio: 16/9;
  }

  .theme-imageupload-xl .theme-imageupload-icon {
    font-size: 80px;
  }

  .theme-imageupload-xl .theme-imageupload-icon svg {
    width: 80px;
    height: 80px;
  }

  .theme-imageupload-xl .theme-imageupload-spinner {
    font-size: 80px;
  }

  .theme-imageupload-xl .theme-imageupload-spinner svg {
    width: 80px;
    height: 80px;
  }

  .theme-imageupload-xl .theme-imageupload-title {
    font-size: 20px;
  }

  .theme-imageupload-xl .theme-imageupload-subtitle {
    font-size: 18px;
  }

  .theme-imageupload-xl .theme-imageupload-remove {
    width: 56px;
    height: 56px;
  }

  .theme-imageupload-xl .theme-imageupload-remove svg {
    width: 28px;
    height: 28px;
  }

  /* States */
  .theme-imageupload-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .theme-imageupload-disabled:hover {
    border-color: var(--color-border);
    background: var(--color-surface);
    transform: none;
  }

  /* Animations */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-imageupload {
      aspect-ratio: 4/3;
    }

    .theme-imageupload-content {
      padding: 16px;
      gap: 12px;
    }

    .theme-imageupload-icon {
      font-size: 40px;
    }

    .theme-imageupload-icon svg {
      width: 40px;
      height: 40px;
    }

    .theme-imageupload-spinner {
      font-size: 40px;
    }

    .theme-imageupload-spinner svg {
      width: 40px;
      height: 40px;
    }

    .theme-imageupload-title {
      font-size: 15px;
    }

    .theme-imageupload-subtitle {
      font-size: 13px;
    }

    .theme-imageupload-remove {
      width: 36px;
      height: 36px;
    }

    .theme-imageupload-remove svg {
      width: 18px;
      height: 18px;
    }
  }
</style>
