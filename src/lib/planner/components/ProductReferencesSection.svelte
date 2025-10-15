<script lang="ts">
  import SectionActionButton from '$lib/components/ui/SectionActionButton.svelte'
  import SectionHeader from '$lib/components/ui/SectionHeader.svelte'
  import type { ProductReferenceWithCreator } from '$lib/planner/types'
  import ProductReferenceCard from './ProductReferenceCard.svelte'
  import ProductReferenceModal from './ProductReferenceModal.svelte'

  interface Props {
    productId: string
    canEdit?: boolean
  }

  let { productId, canEdit = false }: Props = $props()

  // State
  let references = $state<ProductReferenceWithCreator[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)
  let showModal = $state(false)
  let editingReference = $state<ProductReferenceWithCreator | null>(null)

  // Drag and drop state
  let draggedIndex = $state<number | null>(null)
  let dragOverIndex = $state<number | null>(null)

  // Load references
  async function loadReferences() {
    try {
      loading = true
      error = null

      const response = await fetch(`/api/planner/products/${productId}/references`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load references')
      }

      const result = await response.json()
      if (result.success) {
        references = result.data || []
      } else {
        throw new Error(result.error || 'Failed to load references')
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load references'
      console.error('Error loading references:', e)
    } finally {
      loading = false
    }
  }

  // Load references on mount and when productId changes
  $effect(() => {
    if (productId) {
      loadReferences()
    }
  })

  // Handle add reference
  function handleAddReference() {
    editingReference = null
    showModal = true
  }

  // Handle edit reference
  function handleEditReference(reference: ProductReferenceWithCreator) {
    editingReference = reference
    showModal = true
  }

  // Handle delete reference
  async function handleDeleteReference(referenceId: string) {
    try {
      const response = await fetch(`/api/planner/products/${productId}/references/${referenceId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete reference')
      }

      // Remove from local state
      references = references.filter((ref) => ref.id !== referenceId)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete reference'
      console.error('Error deleting reference:', e)
    }
  }

  // Handle modal close
  function handleModalClose() {
    showModal = false
    editingReference = null
  }

  // Handle modal save
  function handleModalSave() {
    // Reload references to get the updated list
    loadReferences()
    showModal = false
    editingReference = null
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
      // Create new array with reordered references
      const newReferences = [...references]
      const draggedItem = newReferences[draggedIndex]

      // Remove dragged item from its current position
      newReferences.splice(draggedIndex, 1)

      // Insert it at the new position
      newReferences.splice(dropIndex, 0, draggedItem)

      // Update local state immediately for better UX
      references = newReferences

      // Send reorder request to API
      const referenceIds = newReferences.map((ref) => ref.id)

      const response = await fetch(`/api/planner/products/${productId}/references/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ referenceIds }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to reorder references')
      }

      // Reload references to ensure consistency with server
      await loadReferences()
    } catch (e) {
      console.error('Error reordering references:', e)
      error = e instanceof Error ? e.message : 'Failed to reorder references'
      // Reload to reset to server state
      await loadReferences()
    } finally {
      handleDragEnd()
    }
  }

  // Group references by type for better organization
  const referencesByType = $derived.by(() => {
    const groups: Record<string, ProductReferenceWithCreator[]> = {
      pdf: [],
      image: [],
      figma: [],
      notion: [],
      google_docs: [],
      github: [],
      youtube: [],
      slack: [],
      discord: [],
      zoom: [],
      trello: [],
      jira: [],
      miro: [],
      adobe: [],
      url: [],
      file: [],
      other: [],
    }

    references.forEach((ref) => {
      if (groups[ref.type]) {
        groups[ref.type].push(ref)
      } else {
        groups.other.push(ref)
      }
    })

    // Only return groups that have references
    return Object.entries(groups).filter(([_, refs]) => refs.length > 0)
  })
</script>

<div>
  <!-- Section Header -->
  <SectionHeader title="References" count={references.length}>
    {#if canEdit}
      <SectionActionButton onclick={handleAddReference}>+ Add Reference</SectionActionButton>
    {/if}
  </SectionHeader>

  <!-- Loading State -->
  {#if loading}
    <div class="text-center py-12">
      <div class="text-sm" style:color="var(--color-text-secondary)">레퍼런스를 불러오는 중...</div>
    </div>
    <!-- Error State -->
  {:else if error}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4">
      <div class="text-sm text-red-700">
        {error}
      </div>
      <button
        type="button"
        onclick={loadReferences}
        class="mt-2 text-sm text-red-600 underline hover:no-underline"
      >
        다시 시도
      </button>
    </div>
    <!-- Empty State -->
  {:else if references.length === 0}
    <div
      class="text-center py-12 rounded-lg border"
      style:background="var(--color-surface)"
      style:border-color="var(--color-border)"
    >
      <p class="text-sm" style:color="var(--color-text-tertiary)">아직 레퍼런스가 없습니다.</p>
      {#if canEdit}
        <button
          type="button"
          onclick={handleAddReference}
          class="mt-3 text-sm"
          style:color="var(--color-primary)"
        >
          첫 번째 레퍼런스 추가하기
        </button>
      {/if}
    </div>
    <!-- References List -->
  {:else}
    <!-- Draggable References List -->
    <div class="space-y-3" role="list">
      {#each references as reference, index (reference.id)}
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
              e.dataTransfer?.setData('text/plain', reference.id)
              e.dataTransfer!.effectAllowed = 'move'
            }
          }}
          ondragover={(e) => handleDragOver(e, index)}
          ondragleave={handleDragLeave}
          ondragend={handleDragEnd}
          ondrop={(e) => handleDrop(e, index)}
        >
          <ProductReferenceCard
            {reference}
            {productId}
            {canEdit}
            onEdit={handleEditReference}
            onDelete={handleDeleteReference}
            isDragging={draggedIndex === index}
            showDragHandle={canEdit}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal}
  <ProductReferenceModal
    bind:open={showModal}
    {productId}
    reference={editingReference}
    onclose={handleModalClose}
    onsave={handleModalSave}
  />
{/if}
