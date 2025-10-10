<script lang="ts">
  import { onMount } from 'svelte'
  import { PlusIcon, GripVerticalIcon, PencilIcon, TrashIcon } from 'lucide-svelte'

  interface Category {
    id: string
    name: string
    code: string
    description: string | null
    display_order: number
    product_count?: number
  }

  let categories = $state<Category[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showModal = $state(false)
  let editingCategory = $state<Category | null>(null)

  let formData = $state({
    name: '',
    code: '',
    description: '',
  })

  let saving = $state(false)
  let draggedIndex = $state<number | null>(null)

  async function loadCategories() {
    try {
      loading = true
      error = null

      const response = await fetch('/api/planner/categories')
      if (!response.ok) throw new Error('Failed to load categories')

      const data = await response.json()
      categories = data.data
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load categories'
    } finally {
      loading = false
    }
  }

  async function handleSubmit() {
    try {
      saving = true
      error = null

      const url = editingCategory
        ? `/api/planner/categories/${editingCategory.id}`
        : '/api/planner/categories'

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save category')
      }

      showModal = false
      editingCategory = null
      formData = { name: '', code: '', description: '' }
      await loadCategories()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save category'
    } finally {
      saving = false
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/planner/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }

      await loadCategories()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete category'
    }
  }

  async function updateOrder(newOrder: Category[]) {
    try {
      const response = await fetch('/api/planner/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: newOrder.map((cat, index) => ({
            id: cat.id,
            display_order: index + 1,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update order'
      await loadCategories() // 실패시 다시 로드
    }
  }

  function handleDragStart(index: number) {
    draggedIndex = index
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCategories = [...categories]
    const draggedItem = newCategories[draggedIndex]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(index, 0, draggedItem)

    categories = newCategories
    draggedIndex = index
  }

  function handleDragEnd() {
    if (draggedIndex !== null) {
      updateOrder(categories)
    }
    draggedIndex = null
  }

  function openEditModal(category: Category) {
    editingCategory = category
    formData = {
      name: category.name,
      code: category.code,
      description: category.description || '',
    }
    showModal = true
  }

  function openNewModal() {
    editingCategory = null
    formData = { name: '', code: '', description: '' }
    showModal = true
  }

  onMount(() => {
    loadCategories()
  })
</script>

<svelte:head>
  <title>카테고리 관리 - 플래너</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold" style:color="var(--color-text-primary)">카테고리 관리</h1>
      <p class="text-sm mt-1" style:color="var(--color-text-secondary)">
        제품 카테고리를 관리하고 순서를 조정하세요
      </p>
    </div>
    <button
      type="button"
      onclick={openNewModal}
      class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
      style:background="var(--color-primary)"
      style:color="white"
    >
      <PlusIcon size={16} />
      <span>카테고리 추가</span>
    </button>
  </div>

  {#if error}
    <div class="p-4 rounded-lg border border-red-200 bg-red-50" style:color="var(--color-error)">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-12">
      <div style:color="var(--color-text-secondary)">로딩 중...</div>
    </div>
  {:else if categories.length === 0}
    <div
      class="text-center py-12 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <p class="text-sm" style:color="var(--color-text-tertiary)">
        아직 카테고리가 없습니다. 새로운 카테고리를 추가하세요.
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each categories as category, index}
        <div
          draggable="true"
          ondragstart={() => handleDragStart(index)}
          ondragover={(e) => handleDragOver(e, index)}
          ondragend={handleDragEnd}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') e.preventDefault()
          }}
          class="flex items-center gap-3 p-4 rounded-lg border transition cursor-move"
          class:opacity-50={draggedIndex === index}
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          role="button"
          tabindex="0"
        >
          <div class="cursor-grab" style:color="var(--color-text-tertiary)">
            <GripVerticalIcon size={20} />
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h3 class="font-medium" style:color="var(--color-text-primary)">
                {category.name}
              </h3>
              <code
                class="px-2 py-0.5 text-xs rounded"
                style:background="var(--color-surface-elevated)"
                style:color="var(--color-text-secondary)"
              >
                {category.code}
              </code>
              {#if category.product_count !== undefined}
                <span class="text-xs" style:color="var(--color-text-tertiary)">
                  {category.product_count}개 제품
                </span>
              {/if}
            </div>
            {#if category.description}
              <p class="text-sm" style:color="var(--color-text-secondary)">
                {category.description}
              </p>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={() => openEditModal(category)}
              class="p-2 rounded transition hover:opacity-70"
              style:color="var(--color-text-secondary)"
              title="편집"
            >
              <PencilIcon size={16} />
            </button>
            <button
              type="button"
              onclick={() => handleDelete(category.id)}
              class="p-2 rounded transition hover:opacity-70"
              style:color="var(--color-error)"
              title="삭제"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="text-xs" style:color="var(--color-text-tertiary)">
      <p>💡 드래그하여 카테고리 순서를 변경할 수 있습니다</p>
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style:background="rgba(0, 0, 0, 0.5)"
    onclick={() => !saving && (showModal = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && !saving && (showModal = false)}
  >
    <div
      class="w-full max-w-md rounded-lg shadow-lg"
      style:background="var(--color-surface)"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="-1"
    >
      <div
        class="flex items-center justify-between p-6 border-b"
        style:border-color="var(--color-border)"
      >
        <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">
          {editingCategory ? '카테고리 편집' : '새 카테고리'}
        </h2>
      </div>

      <form onsubmit={(e) => (e.preventDefault(), handleSubmit())} class="p-6 space-y-4">
        <div>
          <label
            for="name"
            class="block text-sm font-medium mb-1.5"
            style:color="var(--color-text-secondary)"
          >
            카테고리명 *
          </label>
          <input
            type="text"
            id="name"
            bind:value={formData.name}
            required
            class="w-full px-3 py-2 rounded-lg border text-sm"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="Cloud Platforms"
          />
        </div>

        <div>
          <label
            for="code"
            class="block text-sm font-medium mb-1.5"
            style:color="var(--color-text-secondary)"
          >
            코드 *
          </label>
          <input
            type="text"
            id="code"
            bind:value={formData.code}
            required
            disabled={!!editingCategory}
            class="w-full px-3 py-2 rounded-lg border text-sm"
            class:opacity-60={!!editingCategory}
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="cloud-platforms"
          />
          <p class="mt-1 text-xs" style:color="var(--color-text-tertiary)">
            {editingCategory ? '코드는 수정할 수 없습니다' : '영문 소문자, 숫자, 하이픈(-)만 사용'}
          </p>
        </div>

        <div>
          <label
            for="description"
            class="block text-sm font-medium mb-1.5"
            style:color="var(--color-text-secondary)"
          >
            설명
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            rows="3"
            class="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="카테고리에 대한 설명을 입력하세요"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={() => (showModal = false)}
            disabled={saving}
            class="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-70"
            style:background="var(--color-surface-elevated)"
            style:color="var(--color-text-secondary)"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            class="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
            style:background="var(--color-primary)"
            style:color="white"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
