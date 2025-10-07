<script lang="ts">
  import type { AccountTag } from '$lib/finance/types'
  import { onMount } from 'svelte'
import { logger } from '$lib/utils/logger'

  interface Props {
    accountId: string
    selectedTags?: AccountTag[]
    onUpdate?: (tagIds: string[]) => void
  }

  let { accountId, selectedTags = [], onUpdate }: Props = $props()

  let availableTags = $state<AccountTag[]>([])
  let showSelector = $state(false)
  let loading = $state(false)
  let currentTags = $state<AccountTag[]>([...selectedTags])

  // 태그 목록 로드
  async function loadTags() {
    try {
      const response = await fetch('/api/finance/account-tags')
      const result = await response.json()
      if (result.success) {
        availableTags = result.data
      }
    } catch (error) {
      logger.error('태그 로드 실패:', error)
    }
  }

  // 태그 토글
  function toggleTag(tag: AccountTag) {
    const index = currentTags.findIndex((t) => t.id === tag.id)
    if (index >= 0) {
      currentTags = currentTags.filter((t) => t.id !== tag.id)
    } else {
      currentTags = [...currentTags, tag]
    }
  }

  // 태그 저장
  async function saveTags() {
    loading = true
    try {
      const tagIds = currentTags.map((t) => t.id)
      const response = await fetch(`/api/finance/accounts/${accountId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds }),
      })

      const result = await response.json()
      if (result.success) {
        showSelector = false
        if (onUpdate) {
          onUpdate(tagIds)
        }
      }
    } catch (error) {
      logger.error('태그 저장 실패:', error)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadTags()
  })

  $effect(() => {
    currentTags = [...selectedTags]
  })
</script>

<div class="relative">
  <!-- 태그 표시 -->
  <div class="flex flex-wrap gap-1 items-center">
    {#each currentTags as tag}
      <span
        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
        style:background-color="{tag.color}20"
        style:color={tag.color}
      >
        {tag.name}
      </span>
    {/each}
    <button
      type="button"
      onclick={() => (showSelector = !showSelector)}
      class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
    >
      {currentTags.length > 0 ? '편집' : '태그 추가'}
    </button>
  </div>

  <!-- 태그 선택 모달 -->
  {#if showSelector}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => {
        if (e.target === e.currentTarget) {
          showSelector = false
          currentTags = [...selectedTags]
        }
      }}
      onkeydown={(e) => {
        if (e.key === 'Escape') {
          showSelector = false
          currentTags = [...selectedTags]
        }
      }}
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">계좌 태그 선택</h3>

        <div class="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {#each availableTags as tag}
            <label
              class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={currentTags.some((t) => t.id === tag.id)}
                onchange={() => toggleTag(tag)}
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div class="flex items-center gap-2 flex-1">
                <div class="w-3 h-3 rounded" style:background-color={tag.color}></div>
                <span class="text-sm text-gray-900 dark:text-gray-100">{tag.name}</span>
                {#if tag.isSystem}
                  <span
                    class="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                  >
                    시스템
                  </span>
                {/if}
              </div>
            </label>
          {/each}
        </div>

        <div class="flex gap-2 justify-end">
          <button
            type="button"
            onclick={() => {
              showSelector = false
              currentTags = [...selectedTags]
            }}
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onclick={saveTags}
            disabled={loading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
