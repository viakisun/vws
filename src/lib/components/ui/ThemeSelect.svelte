<script lang="ts">
  import type { ComponentType } from 'svelte'

  // Props
  interface Props {
    value?: string | number
    placeholder?: string
    options?: Array<{ value: string | number; label: string }>
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'outline'
    icon?: ComponentType
    class?: string
    onchange?: (value: string) => void
    name?: string
    id?: string
  }

  let {
    value: rawValue = $bindable(),
    placeholder = '선택하세요',
    options = [],
    disabled = false,
    size = 'md',
    variant = 'default',
    icon: Icon,
    class: className = '',
    onchange,
    name,
    id,
    ...restProps
  }: Props = $props()

  // undefined 값을 빈 문자열로 변환
  const value = $derived(rawValue ?? '')

  // Handle change
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const newValue = target.value
    rawValue = newValue
    if (onchange) {
      onchange(newValue)
    }
  }

  // Get select classes
  function getSelectClasses(): string {
    const baseClasses = 'theme-select'
    const sizeClass = `theme-select-${size}`
    const variantClass = `theme-select-${variant}`
    const stateClass = disabled ? 'theme-select-disabled' : 'theme-select-enabled'

    return [baseClasses, sizeClass, variantClass, stateClass, className].filter(Boolean).join(' ')
  }
</script>

<div class="theme-select-container">
  {#if Icon}
    <div class="theme-select-icon">
      <Icon size={16} />
    </div>
  {/if}

  <select
    class={getSelectClasses()}
    class:theme-select-with-icon={Icon}
    {value}
    {disabled}
    {name}
    {id}
    onchange={handleChange}
    {...restProps}
  >
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}

    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>

  <div class="theme-select-arrow">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</div>

<style>
  .theme-select-container {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .theme-select-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-muted);
    z-index: 1;
    pointer-events: none;
  }

  .theme-select {
    width: 100%;
    padding: 8px 12px;
    padding-left: 12px;
    padding-right: 32px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 14px;
    line-height: 1.5;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-select-with-icon {
    padding-left: 36px;
  }

  .theme-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
  }

  .theme-select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-muted);
    pointer-events: none;
    z-index: 1;
  }

  /* Sizes */
  .theme-select-sm {
    padding: 6px 10px;
    padding-left: 10px;
    padding-right: 28px;
    font-size: 12px;
  }

  .theme-select-sm.theme-select-with-icon {
    padding-left: 32px;
  }

  .theme-select-md {
    padding: 8px 12px;
    padding-left: 12px;
    padding-right: 32px;
    font-size: 14px;
  }

  .theme-select-md.theme-select-with-icon {
    padding-left: 36px;
  }

  .theme-select-lg {
    padding: 12px 16px;
    padding-left: 16px;
    padding-right: 40px;
    font-size: 16px;
  }

  .theme-select-lg.theme-select-with-icon {
    padding-left: 44px;
  }

  /* Variants */
  .theme-select-default {
    background: var(--color-surface);
    border-color: var(--color-border);
  }

  .theme-select-outline {
    background: transparent;
    border-color: var(--color-border);
  }

  /* States */
  .theme-select-enabled:hover {
    border-color: var(--color-border-hover);
  }

  .theme-select-disabled {
    background: var(--color-muted-alpha);
    color: var(--color-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .theme-select-disabled:hover {
    border-color: var(--color-border);
  }

  /* Dark theme adjustments */
  [data-theme='dark'] .theme-select {
    background: var(--color-surface);
    border-color: var(--color-border);
  }

  [data-theme='dark'] .theme-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-select {
      font-size: 16px; /* Prevent zoom on iOS */
    }
  }
</style>
