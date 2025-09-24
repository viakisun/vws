<script lang="ts">
  // Props
  interface Props {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea'
    variant?: 'default' | 'filled' | 'outlined' | 'underlined'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    placeholder?: string
    value?: string
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    error?: boolean
    success?: boolean
    label?: string
    helper?: string
    errorMessage?: string
    successMessage?: string
    id?: string
    class?: string
    prefix?: any
    suffix?: any
    oninput?: (event: Event) => void
    onchange?: (event: Event) => void
    onfocus?: (event: Event) => void
    onblur?: (event: Event) => void
    children?: any
  }

  let {
    type = 'text',
    variant = 'default',
    size = 'md',
    placeholder = '',
    value = $bindable(''),
    disabled = false,
    readonly = false,
    required = false,
    error = false,
    success = false,
    label = '',
    helper = '',
    errorMessage = '',
    successMessage = '',
    id = '',
    class: className = '',
    prefix,
    suffix,
    oninput,
    onchange,
    onfocus,
    onblur,
    children,
    ...restProps
  }: Props = $props()

  // Get input classes
  function getInputClasses(): string {
    const baseClasses = 'theme-input'
    const variantClass = `theme-input-${variant}`
    const sizeClass = `theme-input-${size}`
    const stateClasses = [
      error ? 'theme-input-error' : '',
      success ? 'theme-input-success' : '',
      disabled ? 'theme-input-disabled' : '',
      readonly ? 'theme-input-readonly' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const prefixClass = prefix ? 'pl-10' : ''
    const suffixClass = suffix ? 'pr-10' : ''

    return [baseClasses, variantClass, sizeClass, stateClasses, prefixClass, suffixClass, className]
      .filter(Boolean)
      .join(' ')
  }

  // Get container classes
  function getContainerClasses(): string {
    const baseClasses = 'theme-input-container'
    const stateClasses = [
      error ? 'theme-input-container-error' : '',
      success ? 'theme-input-container-success' : '',
      disabled ? 'theme-input-container-disabled' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return [baseClasses, ...stateClasses].filter(Boolean).join(' ')
  }

  // Get message classes
  function getMessageClasses(): string {
    const baseClasses = 'theme-input-message'
    const stateClasses = [
      error ? 'theme-input-message-error' : '',
      success ? 'theme-input-message-success' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return [baseClasses, ...stateClasses].filter(Boolean).join(' ')
  }

  // Get message text
  function getMessageText(): string {
    if (error && errorMessage) return errorMessage
    if (success && successMessage) return successMessage
    if (helper) return helper
    return ''
  }

  // Get message icon
  function getMessageIcon(): string {
    if (error) return '⚠️'
    if (success) return '✅'
    return ''
  }
</script>

<div class={getContainerClasses()}>
  {#if label}
    <label class="theme-input-label" for={id}>
      {label}
      {#if required}
        <span class="theme-input-required">*</span>
      {/if}
    </label>
  {/if}

  <div class="theme-input-wrapper relative">
    {#if prefix}
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {@render prefix()}
      </div>
    {/if}

    {#if type === 'textarea'}
      <textarea
        {id}
        class={getInputClasses()}
        {placeholder}
        {value}
        {disabled}
        {readonly}
        {required}
        {oninput}
        {onchange}
        {onfocus}
        {onblur}
        {...restProps}
      ></textarea>
    {:else}
      <input
        {id}
        {type}
        class={getInputClasses()}
        {placeholder}
        {value}
        {disabled}
        {readonly}
        {required}
        {oninput}
        {onchange}
        {onfocus}
        {onblur}
        {...restProps}
      />
    {/if}

    {#if suffix}
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {@render suffix()}
      </div>
    {/if}

    {#if children}
      <div class="theme-input-children">
        {@render children?.()}
      </div>
    {/if}
  </div>

  {#if getMessageText()}
    <div class={getMessageClasses()}>
      {#if getMessageIcon()}
        <span class="theme-input-message-icon">{getMessageIcon()}</span>
      {/if}
      <span class="theme-input-message-text">{getMessageText()}</span>
    </div>
  {/if}
</div>

<style>
  .theme-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .theme-input-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .theme-input-required {
    color: var(--color-error);
    font-weight: 600;
  }

  .theme-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .theme-input {
    width: 100%;
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
    border-radius: 8px;
    font-size: 14px;
    color: var(--color-text);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .theme-input:focus {
    outline: none;
    border-color: var(--color-input-focus);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  .theme-input::placeholder {
    color: var(--color-text-muted);
  }

  /* Variants */
  .theme-input-default {
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
  }

  .theme-input-filled {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .theme-input-outlined {
    background: transparent;
    border: 2px solid var(--color-input-border);
  }

  .theme-input-underlined {
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--color-input-border);
    border-radius: 0;
  }

  /* Sizes */
  .theme-input-sm {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 32px;
  }

  .theme-input-md {
    padding: 10px 14px;
    font-size: 14px;
    min-height: 40px;
  }

  .theme-input-lg {
    padding: 12px 16px;
    font-size: 16px;
    min-height: 48px;
  }

  .theme-input-xl {
    padding: 14px 18px;
    font-size: 18px;
    min-height: 56px;
  }

  /* States */
  .theme-input-error {
    border-color: var(--color-error);
  }

  .theme-input-error:focus {
    border-color: var(--color-error);
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
  }

  .theme-input-success {
    border-color: var(--color-success);
  }

  .theme-input-success:focus {
    border-color: var(--color-success);
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
  }

  .theme-input-disabled {
    background: var(--color-border-light);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-input-readonly {
    background: var(--color-border-light);
    cursor: default;
  }

  /* Container states */
  .theme-input-container-error .theme-input-label {
    color: var(--color-error);
  }

  .theme-input-container-success .theme-input-label {
    color: var(--color-success);
  }

  .theme-input-container-disabled .theme-input-label {
    color: var(--color-text-muted);
  }

  /* Children (icons, buttons, etc.) */
  .theme-input-children {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  }

  .theme-input-children :global(*) {
    pointer-events: auto;
  }

  /* Message */
  .theme-input-message {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    margin-top: 4px;
  }

  .theme-input-message-error {
    color: var(--color-error);
  }

  .theme-input-message-success {
    color: var(--color-success);
  }

  .theme-input-message:not(.theme-input-message-error):not(.theme-input-message-success) {
    color: var(--color-text-secondary);
  }

  .theme-input-message-icon {
    font-size: 14px;
    line-height: 1;
  }

  .theme-input-message-text {
    flex: 1;
  }

  /* Textarea specific styles */
  .theme-input[type='textarea'] {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    line-height: 1.5;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-input-sm {
      padding: 6px 10px;
      font-size: 11px;
      min-height: 28px;
    }

    .theme-input-md {
      padding: 8px 12px;
      font-size: 13px;
      min-height: 36px;
    }

    .theme-input-lg {
      padding: 10px 14px;
      font-size: 15px;
      min-height: 44px;
    }

    .theme-input-xl {
      padding: 12px 16px;
      font-size: 17px;
      min-height: 52px;
    }

    .theme-input-children {
      right: 10px;
    }
  }
</style>
