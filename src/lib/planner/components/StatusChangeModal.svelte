<script lang="ts">
  import type { InitiativeStatus } from '../types'
  import { getStatusText } from '../utils/initiative-helpers'

  interface Props {
    show: boolean
    currentStatus: InitiativeStatus
    isChanging: boolean
    onStatusChange: (status: InitiativeStatus) => Promise<void>
    onClose: () => void
  }

  let { show = $bindable(), currentStatus, isChanging, onStatusChange, onClose }: Props = $props()

  const STATUS_OPTIONS: Array<{ value: InitiativeStatus; label: string }> = [
    { value: 'active', label: '진행 중' },
    { value: 'paused', label: '일시중지' },
    { value: 'shipped', label: '완료' },
    { value: 'abandoned', label: '중단' },
  ]

  let selectedStatus = $state<InitiativeStatus>(currentStatus)

  async function handleSubmit() {
    if (selectedStatus === currentStatus) {
      onClose()
      return
    }

    try {
      await onStatusChange(selectedStatus)
      show = false
    } catch (e) {
      alert(e instanceof Error ? e.message : '상태 변경에 실패했습니다')
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
</script>

{#if show}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="status-modal-title"
    tabindex="-1"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <div
      class="rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
      style:background="var(--color-surface)"
    >
      <h3
        id="status-modal-title"
        class="text-lg font-semibold mb-4"
        style:color="var(--color-text-primary)"
      >
        상태 변경
      </h3>

      <div class="mb-6">
        <label for="status-select" class="block text-sm font-medium mb-2" style:color="var(--color-text-secondary)">
          상태 선택
        </label>
        <select
          id="status-select"
          bind:value={selectedStatus}
          disabled={isChanging}
          class="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          style:background="var(--color-surface)"
          style:color="var(--color-text-primary)"
          style:border-color="var(--color-border)"
        >
          {#each STATUS_OPTIONS as status}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          onclick={handleSubmit}
          disabled={isChanging}
          class="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          변경
        </button>
        <button
          type="button"
          onclick={onClose}
          disabled={isChanging}
          class="flex-1 px-4 py-2 rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style:color="var(--color-text-secondary)"
          style:border-color="var(--color-border)"
        >
          취소
        </button>
      </div>
    </div>
  </div>
{/if}
