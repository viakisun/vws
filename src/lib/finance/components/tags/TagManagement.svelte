<script lang="ts">
  import { PlusIcon, TagIcon } from '@lucide/svelte'
  import { pushToast } from '$lib/stores/toasts'
  import type { AccountTag } from '$lib/finance/types'
  import { onMount } from 'svelte'

  let tags = $state<AccountTag[]>([])
  let loading = $state(false)
  let showModal = $state(false)
  let editingTag = $state<AccountTag | null>(null)

  // Form state
  let formData = $state({
    name: '',
    color: '#3B82F6',
    description: '',
  })

  // 태그 목록 로드
  async function loadTags() {
    loading = true
    try {
      const response = await fetch('/api/finance/account-tags')
      const result = await response.json()

      if (result.success) {
        tags = result.data
      } else {
        pushToast(result.error || '태그 조회 실패', 'error')
      }
    } catch (error) {
      pushToast('태그 조회 실패', 'error')
    } finally {
      loading = false
    }
  }

  // 태그 생성/수정
  async function handleSubmit() {
    loading = true
    try {
      const url = editingTag
        ? `/api/finance/account-tags/${editingTag.id}`
        : '/api/finance/account-tags'
      const method = editingTag ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        pushToast(editingTag ? '태그가 수정되었습니다' : '태그가 생성되었습니다', 'success')
        showModal = false
        resetForm()
        await loadTags()
      } else {
        pushToast(result.error || '작업 실패', 'error')
      }
    } catch (error) {
      pushToast('작업 실패', 'error')
    } finally {
      loading = false
    }
  }

  // 태그 삭제
  async function handleDelete(tagId: string) {
    if (!confirm('이 태그를 삭제하시겠습니까?')) return

    loading = true
    try {
      const response = await fetch(`/api/finance/account-tags/${tagId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        pushToast(result.message || '태그가 삭제되었습니다', 'success')
        await loadTags()
      } else {
        pushToast(result.error || '삭제 실패', 'error')
      }
    } catch (error) {
      pushToast('삭제 실패', 'error')
    } finally {
      loading = false
    }
  }

  // 모달 열기
  function openModal(tag?: AccountTag) {
    if (tag) {
      editingTag = tag
      formData = {
        name: tag.name,
        color: tag.color,
        description: tag.description || '',
      }
    }
    showModal = true
  }

  // 폼 리셋
  function resetForm() {
    editingTag = null
    formData = {
      name: '',
      color: '#3B82F6',
      description: '',
    }
  }

  onMount(() => {
    loadTags()
  })
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <TagIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">계좌 태그 관리</h2>
    </div>
    <button
      type="button"
      onclick={() => openModal()}
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon class="w-4 h-4" />
      새 태그
    </button>
  </div>

  <!-- 태그 목록 -->
  {#if loading && tags.length === 0}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
    </div>
  {:else if tags.length === 0}
    <div class="text-center py-12 text-gray-500 dark:text-gray-400">
      <TagIcon class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>등록된 태그가 없습니다</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each tags as tag}
        <div
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded" style:background-color={tag.color}></div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-gray-900 dark:text-gray-100">{tag.name}</h3>
                  {#if tag.isSystem}
                    <span
                      class="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                    >
                      시스템
                    </span>
                  {/if}
                </div>
              </div>
            </div>
            {#if !tag.isSystem}
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  onclick={() => openModal(tag)}
                  class="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  aria-label="태그 수정"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onclick={() => handleDelete(tag.id)}
                  class="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  aria-label="태그 삭제"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            {/if}
          </div>
          {#if tag.description}
            <p class="text-sm text-gray-600 dark:text-gray-400">{tag.description}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- 태그 생성/수정 모달 -->
{#if showModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => {
      if (e.target === e.currentTarget) {
        showModal = false
        resetForm()
      }
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') {
        showModal = false
        resetForm()
      }
    }}
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {editingTag ? '태그 수정' : '새 태그 생성'}
      </h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        class="space-y-4"
      >
        <div>
          <label for="tag-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            태그 이름 *
          </label>
          <input
            id="tag-name"
            type="text"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label for="tag-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            색상 *
          </label>
          <div class="flex items-center gap-2">
            <input
              id="tag-color-picker"
              type="color"
              bind:value={formData.color}
              class="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              id="tag-color"
              type="text"
              bind:value={formData.color}
              placeholder="#3B82F6"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label for="tag-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            설명
          </label>
          <textarea
            id="tag-description"
            bind:value={formData.description}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>

        <div class="flex gap-2 justify-end">
          <button
            type="button"
            onclick={() => {
              showModal = false
              resetForm()
            }}
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {editingTag ? '수정' : '생성'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
