<script lang="ts">
  import { goto } from '$app/navigation'
  import { AlertTriangleIcon, XIcon } from 'lucide-svelte'
  import type { InitiativeWithOwner } from '../types'

  // =============================================
  // Props
  // =============================================

  interface Props {
    /** The initiative to delete */
    initiative: InitiativeWithOwner
    /** Modal visibility state */
    open: boolean
    /** Callback when modal is closed */
    onclose: () => void
  }

  let { initiative, open = $bindable(false), onclose }: Props = $props()

  // =============================================
  // State
  // =============================================

  let deleting = $state(false)
  let error = $state<string | null>(null)

  // =============================================
  // Effects
  // =============================================

  // Handle ESC key to close modal
  $effect(() => {
    if (!open) return

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })

  // =============================================
  // Actions
  // =============================================

  /**
   * Delete the initiative
   */
  async function handleDelete() {
    if (deleting) return

    try {
      deleting = true
      error = null

      const response = await fetch(`/api/planner/initiatives/${initiative.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '삭제에 실패했습니다')
      }

      // Success - redirect to planner
      await goto('/planner')
    } catch (e) {
      error = e instanceof Error ? e.message : '삭제에 실패했습니다'
      console.error('Failed to delete initiative:', e)
    } finally {
      deleting = false
    }
  }

  /**
   * Cancel and close the modal
   */
  function handleCancel() {
    if (deleting) return
    error = null
    onclose()
  }

  /**
   * Handle backdrop click to close modal
   */
  function handleBackdropClick() {
    handleCancel()
  }

  /**
   * Prevent modal close when clicking inside content
   */
  function handleContentClick(e: MouseEvent) {
    e.stopPropagation()
  }
</script>

{#if open}
  <!-- Modal Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={handleBackdropClick}
  >
    <!-- Modal Content -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="rounded-lg shadow-xl max-w-md w-full"
      style:background="var(--color-surface)"
      onclick={handleContentClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b"
        style:border-color="var(--color-border)"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <AlertTriangleIcon class="text-red-600" size={20} />
          </div>
          <h2
            id="delete-modal-title"
            class="text-xl font-semibold"
            style:color="var(--color-text-primary)"
          >
            이니셔티브 삭제
          </h2>
        </div>
        <button
          type="button"
          onclick={handleCancel}
          disabled={deleting}
          class="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 transition-colors"
          aria-label="닫기"
        >
          <XIcon size={20} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Error Message -->
        {#if error}
          <div
            class="p-3 rounded-lg bg-red-50 border border-red-200"
            role="alert"
            aria-live="polite"
          >
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}

        <div id="delete-modal-description" class="space-y-3">
          <!-- Confirmation Message -->
          <p class="text-sm" style:color="var(--color-text-primary)">
            다음 이니셔티브를 삭제하시겠습니까?
          </p>

          <!-- Initiative Info -->
          <div
            class="p-3 rounded-lg border"
            style:background="var(--color-surface-secondary)"
            style:border-color="var(--color-border)"
          >
            <p class="font-medium mb-1" style:color="var(--color-text-primary)">
              {initiative.title}
            </p>
            {#if initiative.product}
              <p class="text-xs" style:color="var(--color-text-tertiary)">
                {initiative.product.name}
              </p>
            {/if}
          </div>

          <!-- Warning Box -->
                 <div
                   class="p-4 rounded-lg bg-red-50 border border-red-200"
                   style:color="var(--color-error)"
                   role="alert"
                 >
                   <p class="text-sm font-medium mb-2">⚠️ 주의사항</p>
                   <ul class="text-xs space-y-1 list-disc list-inside">
                     <li>삭제된 이니셔티브는 복구할 수 없습니다</li>
                     <li>연관된 스레드와 투두도 함께 삭제됩니다</li>
                     <li>활동 기록은 보존됩니다</li>
                   </ul>
                 </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex gap-3 p-6 border-t"
        style:border-color="var(--color-border)"
        style:background="var(--color-surface-secondary)"
      >
        <button
          type="button"
          onclick={handleCancel}
          disabled={deleting}
          class="flex-1 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
        >
          취소
        </button>
        <button
          type="button"
          onclick={handleDelete}
          disabled={deleting}
          class="flex-1 px-4 py-2 rounded-lg border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium"
        >
          {#if deleting}
            <span class="flex items-center justify-center gap-2">
              <span
                class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              ></span>
              <span>삭제 중...</span>
            </span>
          {:else}
            삭제하기
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
