<script lang="ts">
  import { onMount } from 'svelte'

  // Props
  interface Props {
    open?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    closable?: boolean
    backdrop?: boolean
    class?: string
    onclose?: () => void
    children?: any
  }

  let {
    open = false,
    size = 'md',
    closable = true,
    backdrop = true,
    class: className = '',
    onclose,
    children,
    ...restProps
  }: Props = $props()

  // Get modal classes
  function getModalClasses(): string {
    const baseClasses = 'theme-modal'
    const sizeClass = `theme-modal-${size}`
    const stateClass = open ? 'theme-modal-open' : 'theme-modal-closed'

    return [baseClasses, sizeClass, stateClass, className].filter(Boolean).join(' ')
  }

  // Get backdrop classes
  function getBackdropClasses(): string {
    const baseClasses = 'theme-modal-backdrop'
    const stateClass = open ? 'theme-modal-backdrop-open' : 'theme-modal-backdrop-closed'

    return [baseClasses, stateClass].filter(Boolean).join(' ')
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    // 텍스트 선택이나 드래그 중일 때는 모달을 닫지 않음
    if (window.getSelection()?.toString()) {
      return
    }

    // 마우스 이벤트가 드래그나 선택과 관련된 경우 모달을 닫지 않음
    if (event.detail === 0) {
      // 드래그 이벤트는 detail이 0
      return
    }

    // 마우스 버튼이 왼쪽 버튼이고 단순 클릭인 경우만 처리
    if (event.button !== 0) {
      return
    }

    // 배경을 클릭했을 때만 모달을 닫음
    if (backdrop && event.target === event.currentTarget && closable) {
      // 약간의 지연을 두어 드래그와 클릭을 구분
      setTimeout(() => {
        if (!window.getSelection()?.toString()) {
          closeModal()
        }
      }, 100)
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && closable) {
      closeModal()
    }
  }

  // Close modal
  function closeModal() {
    if (onclose) {
      onclose()
    }
  }

  // Handle close button click
  function handleCloseClick() {
    closeModal()
  }

  // Add/remove event listeners
  onMount(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  // Prevent body scroll when modal is open
  function _updateData() {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
</script>

{#if open}
  <div
    class={getBackdropClasses()}
    onmousedown={handleBackdropClick}
    onkeydown={(e) => {
      if (e.key === 'Escape') handleCloseClick()
    }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class={getModalClasses()} {...restProps}>
      {#if closable}
        <button
          type="button"
          class="theme-modal-close"
          onclick={handleCloseClick}
          aria-label="Close modal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      {/if}

      <div class="theme-modal-content">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .theme-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .theme-modal-backdrop-open {
    opacity: 1;
    visibility: visible;
  }

  .theme-modal-backdrop-closed {
    opacity: 0;
    visibility: hidden;
  }

  .theme-modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 20px 40px var(--color-shadow);
    position: relative;
    max-height: 90vh;
    overflow: hidden;
    transform: scale(0.9);
    transition: transform 0.3s ease;
  }

  .theme-modal-open {
    transform: scale(1);
  }

  .theme-modal-closed {
    transform: scale(0.9);
  }

  /* Sizes */
  .theme-modal-sm {
    width: 100%;
    max-width: 400px;
  }

  .theme-modal-md {
    width: 100%;
    max-width: 600px;
  }

  .theme-modal-lg {
    width: 100%;
    max-width: 800px;
  }

  .theme-modal-xl {
    width: 100%;
    max-width: 1000px;
  }

  .theme-modal-full {
    width: 100%;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  /* Close button */
  .theme-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .theme-modal-close:hover {
    background: var(--color-border);
    border-color: var(--color-primary);
  }

  .theme-modal-close:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-modal-close svg {
    width: 16px;
    height: 16px;
    color: var(--color-text-secondary);
  }

  .theme-modal-close:hover svg {
    color: var(--color-text);
  }

  /* Content */
  .theme-modal-content {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(90vh - 48px);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .theme-modal-backdrop {
      padding: 16px;
    }

    .theme-modal-sm,
    .theme-modal-md,
    .theme-modal-lg,
    .theme-modal-xl {
      width: 100%;
      max-width: 100%;
    }

    .theme-modal-content {
      padding: 20px;
    }

    .theme-modal-close {
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
    }

    .theme-modal-close svg {
      width: 14px;
      height: 14px;
    }
  }

  /* Dark theme specific adjustments */
</style>
