<script lang="ts">
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import type { ProductDocWithCreator } from '$lib/planner/types'
  import ProductDocCard from './ProductDocCard.svelte'
  import ProductDocModal from './ProductDocModal.svelte'

  interface Props {
    productId: string
    canEdit?: boolean
  }

  let { productId, canEdit = false }: Props = $props()

  // State
  let docs = $state<ProductDocWithCreator[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showModal = $state(false)
  let editingDoc = $state<ProductDocWithCreator | null>(null)

  // Drag and drop state
  let draggedIndex = $state<number | null>(null)
  let dragOverIndex = $state<number | null>(null)

  // Load docs
  async function loadDocs() {
    try {
      loading = true
      error = null

      const response = await fetch(`/api/planner/products/${productId}/docs`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load docs')
      }

      const result = await response.json()
      if (result.success) {
        docs = result.data || []
      } else {
        throw new Error(result.error || 'Failed to load docs')
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load docs'
      console.error('Error loading docs:', e)
    } finally {
      loading = false
    }
  }

  // Load docs on mount and when productId changes
  $effect(() => {
    if (productId) {
      loadDocs()
    }
  })

  // Handle add doc
  function handleAddDoc() {
    editingDoc = null
    showModal = true
  }

  // Handle edit doc
  function handleEditDoc(doc: ProductDocWithCreator) {
    editingDoc = doc
    showModal = true
  }

  // Handle delete doc
  async function handleDeleteDoc(docId: string) {
    try {
      const response = await fetch(`/api/planner/products/${productId}/docs/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete doc')
      }

      // Remove from local state
      docs = docs.filter((doc) => doc.id !== docId)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete doc'
      console.error('Error deleting doc:', e)
    }
  }

  // Handle modal close
  function handleModalClose() {
    showModal = false
    editingDoc = null
  }

  // Handle modal save
  function handleModalSave() {
    // Reload docs to get the updated list
    loadDocs()
    showModal = false
    editingDoc = null
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    if (!canEdit) return
    draggedIndex = index
  }

  function handleDragOver(event: DragEvent, index: number) {
    if (!canEdit || draggedIndex === null) return
    event.preventDefault()
    dragOverIndex = index
  }

  function handleDragLeave() {
    dragOverIndex = null
  }

  function handleDragEnd() {
    draggedIndex = null
    dragOverIndex = null
  }

  async function handleDrop(event: DragEvent, dropIndex: number) {
    if (!canEdit || draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd()
      return
    }

    event.preventDefault()

    try {
      // Create new array with reordered docs
      const newDocs = [...docs]
      const draggedItem = newDocs[draggedIndex]

      // Remove dragged item from its current position
      newDocs.splice(draggedIndex, 1)

      // Insert it at the new position
      newDocs.splice(dropIndex, 0, draggedItem)

      // Update local state immediately for better UX
      docs = newDocs

      // Send reorder request to API
      const docIds = newDocs.map((doc) => doc.id)

      const response = await fetch(`/api/planner/products/${productId}/docs/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ docIds }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to reorder docs')
      }

      // Reload docs to ensure consistency with server
      await loadDocs()
    } catch (e) {
      console.error('Error reordering docs:', e)
      error = e instanceof Error ? e.message : 'Failed to reorder docs'
      // Reload to reset to server state
      await loadDocs()
    } finally {
      handleDragEnd()
    }
  }
</script>

<div
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
  class="p-6 rounded-lg border"
>
  <!-- Section Header -->
  <div class="mb-6">
    <SectionHeader title="Docs" count={docs.length}>
      {#if canEdit}
        <SectionActionButton onclick={handleAddDoc}>+ Add Doc</SectionActionButton>
      {/if}
    </SectionHeader>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="text-center py-12">
      <div class="text-sm" style:color="var(--color-text-secondary)">문서를 불러오는 중...</div>
    </div>
    <!-- Error State -->
  {:else if error}
    <div class="rounded-lg border border-red-200 p-4" style:background="var(--color-surface)">
      <div class="text-sm text-red-700">
        {error}
      </div>
      <button
        type="button"
        onclick={loadDocs}
        class="mt-2 text-sm text-red-600 underline hover:no-underline"
      >
        다시 시도
      </button>
    </div>
    <!-- Empty State -->
  {:else if docs.length === 0}
    <div
      class="text-center py-12 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <p class="text-sm" style:color="var(--color-text-tertiary)">아직 문서가 없습니다.</p>
      {#if canEdit}
        <button
          type="button"
          onclick={handleAddDoc}
          class="mt-3 text-sm"
          style:color="var(--color-primary)"
        >
          첫 번째 문서 추가하기
        </button>
      {/if}
    </div>
    <!-- Docs List -->
  {:else}
    <!-- Draggable Docs List -->
    <div class="mt-4 space-y-3" role="list">
      {#each docs as doc, index (doc.id)}
        <div
          class="relative transition-all duration-200"
          class:opacity-50={draggedIndex === index}
          class:border-t-2={dragOverIndex === index && draggedIndex !== null}
          class:border-blue-500={dragOverIndex === index && draggedIndex !== null}
          role="listitem"
          draggable={canEdit}
          ondragstart={(e) => {
            if (canEdit) {
              handleDragStart(index)
              e.dataTransfer?.setData('text/plain', doc.id)
              e.dataTransfer!.effectAllowed = 'move'
            }
          }}
          ondragover={(e) => handleDragOver(e, index)}
          ondragleave={handleDragLeave}
          ondragend={handleDragEnd}
          ondrop={(e) => handleDrop(e, index)}
        >
          <ProductDocCard
            {doc}
            {productId}
            {canEdit}
            onEdit={handleEditDoc}
            onDelete={handleDeleteDoc}
            isDragging={draggedIndex === index}
            showDragHandle={canEdit}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal -->
<ProductDocModal
  bind:open={showModal}
  {productId}
  doc={editingDoc}
  onclose={handleModalClose}
  onsave={handleModalSave}
/>
