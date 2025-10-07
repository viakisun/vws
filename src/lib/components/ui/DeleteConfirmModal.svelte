<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import ThemeModal from './ThemeModal.svelte'
  import ThemeButton from './ThemeButton.svelte'
  import ThemeInput from './ThemeInput.svelte'
  import { AlertTriangleIcon, TrashIcon, ArchiveIcon } from '@lucide/svelte'

  interface Props {
    open: boolean
    title: string
    message: string
    itemName?: string
    confirmText?: string // 확인을 위해 입력해야 하는 텍스트 (예: 직원 번호)
    confirmLabel?: string // 확인 입력 필드 라벨
    loading?: boolean
    showArchive?: boolean
  }

  const {
    open,
    title,
    message,
    itemName = '',
    confirmText = '',
    confirmLabel = '확인을 위해 입력하세요',
    loading = false,
    showArchive = true,
  }: Props = $props()

  const dispatch = createEventDispatcher<{
    close: void
    confirm: { action: 'delete' | 'archive' }
  }>()

  let inputValue = $state('')
  const isConfirmValid = $derived(confirmText ? inputValue === confirmText : true)

  function handleConfirm(action: 'delete' | 'archive') {
    if (!isConfirmValid) return
    dispatch('confirm', { action })
    inputValue = '' // 리셋
  }

  function handleClose() {
    inputValue = '' // 리셋
    dispatch('close')
  }
</script>

<ThemeModal {open} size="md" onclose={handleClose}>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <div class="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
        <AlertTriangleIcon size={24} class="text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h2 class="text-lg font-semibold" style:color="var(--color-text)">
          {title}
        </h2>
        <p class="text-sm" style:color="var(--color-text-secondary)">
          {message}
        </p>
      </div>
    </div>

    {#if itemName}
      <div
        class="p-4 rounded-lg mb-6"
        style:background="var(--color-surface-elevated)"
        style:border="1px solid var(--color-border)"
      >
        <p class="font-medium" style:color="var(--color-text)">{itemName}</p>
      </div>
    {/if}

    {#if confirmText}
      <div class="mb-6">
        <label
          for="confirm-input"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          {confirmLabel}
        </label>
        <ThemeInput
          id="confirm-input"
          type="text"
          placeholder={`"${confirmText}" 입력`}
          bind:value={inputValue}
          disabled={loading}
        />
        {#if inputValue && !isConfirmValid}
          <p class="text-sm mt-1" style:color="var(--color-error)">
            입력한 값이 일치하지 않습니다.
          </p>
        {/if}
      </div>
    {/if}

    <div class="flex items-center justify-end gap-3">
      <ThemeButton variant="ghost" onclick={handleClose} disabled={loading}>취소</ThemeButton>

      {#if showArchive}
        <ThemeButton
          variant="warning"
          onclick={() => handleConfirm('archive')}
          disabled={loading || !isConfirmValid}
          class="flex items-center gap-2"
        >
          {#if loading}
            <div
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
          {:else}
            <ArchiveIcon size={16} />
          {/if}
          퇴사 처리
        </ThemeButton>
      {/if}

      <ThemeButton
        variant="error"
        onclick={() => handleConfirm('delete')}
        disabled={loading || !isConfirmValid}
        class="flex items-center gap-2"
      >
        {#if loading}
          <div
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          ></div>
        {:else}
          <TrashIcon size={16} />
        {/if}
        완전 삭제
      </ThemeButton>
    </div>
  </div>
</ThemeModal>
