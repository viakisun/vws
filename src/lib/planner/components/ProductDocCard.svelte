<script lang="ts">
  import ThemeMarkdown from '$lib/components/ui/ThemeMarkdown.svelte'
  import type { ProductDocWithCreator } from '$lib/planner/types'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import { EditIcon, EyeIcon, FileTextIcon, GripVerticalIcon, TrashIcon } from 'lucide-svelte'

  interface Props {
    doc: ProductDocWithCreator
    productId: string
    onEdit?: (doc: ProductDocWithCreator) => void
    onDelete?: (docId: string) => void
    canEdit?: boolean
    isDragging?: boolean
    showDragHandle?: boolean
  }

  let {
    doc,
    productId,
    onEdit,
    onDelete,
    canEdit = false,
    isDragging = false,
    showDragHandle = false,
  }: Props = $props()

  let loading = $state(false)
  let error = $state<string | null>(null)
  let isExpanded = $state(false)

  // Get content preview (first few lines)
  function getContentPreview(content: string, maxLength = 150): string {
    if (!content) return ''
    const lines = content.split('\n')
    let preview = ''
    let length = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        if (length + trimmedLine.length > maxLength) {
          preview += trimmedLine.substring(0, maxLength - length) + '...'
          break
        }
        preview += trimmedLine + ' '
        length += trimmedLine.length + 1
      }
    }

    return preview.trim() || 'No content preview available'
  }

  // Handle edit
  function handleEdit() {
    if (onEdit && canEdit) {
      onEdit(doc)
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!onDelete || !canEdit) return

    const confirmed = confirm('이 문서를 삭제하시겠습니까?')
    if (confirmed) {
      try {
        loading = true
        error = null
        await onDelete(doc.id)
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to delete doc'
        console.error('Error deleting doc:', e)
      } finally {
        loading = false
      }
    }
  }

  // Handle drag start
  function handleDragStart(event: DragEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', doc.id)
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  // Toggle expansion
  function toggleExpansion() {
    isExpanded = !isExpanded
  }
</script>

<div
  class="group relative rounded-lg border p-4 transition"
  class:opacity-50={isDragging}
  class:border-blue-300={isDragging}
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
  role="listitem"
  draggable={showDragHandle}
  ondragstart={handleDragStart}
>
  <!-- Drag handle -->
  {#if showDragHandle && canEdit}
    <div
      class="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-30 hover:opacity-70 transition-opacity"
      title="드래그하여 순서 변경"
    >
      <GripVerticalIcon size={14} class="text-gray-500" />
    </div>
  {/if}

  <!-- Header row: icon, title, metadata, buttons -->
  <div
    class="flex items-start justify-between gap-3"
    style:margin-left={showDragHandle ? '20px' : '0'}
  >
    <!-- Header with icon, title, and metadata -->
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <div class="flex-shrink-0 mt-0.5">
        <div
          class="flex items-center justify-center w-8 h-8 rounded bg-blue-100"
          style:background="var(--color-blue-light, #dbeafe)"
        >
          <FileTextIcon size={16} class="text-blue-600" />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3
            class="font-medium truncate flex-1"
            style:color="var(--color-text-primary)"
            title={doc.title}
          >
            {doc.title}
          </h3>
          <span
            class="px-2 py-0.5 text-xs font-medium rounded-full text-gray-600"
            style:background="var(--color-surface-elevated)"
          >
            MD
          </span>
        </div>

        <div class="flex items-center gap-4 text-xs" style:color="var(--color-text-tertiary)">
          <span>by {formatKoreanName(doc.creator.last_name, doc.creator.first_name)}</span>
          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    {#if canEdit}
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onclick={toggleExpansion}
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition"
          style:background="var(--color-primary)"
          style:color="white"
          disabled={loading}
        >
          <EyeIcon size={14} />
          {isExpanded ? '접기' : '펼치기'}
        </button>

        <button
          type="button"
          onclick={handleEdit}
          class="p-2 rounded-md transition hover:opacity-70"
          style:background="var(--color-surface)"
          style:color="var(--color-text-secondary)"
          disabled={loading}
          title="문서 편집"
        >
          <EditIcon size={16} />
        </button>

        <button
          type="button"
          onclick={handleDelete}
          class="p-2 rounded-md transition hover:opacity-70 hover:text-red-600"
          style:background="var(--color-surface)"
          style:color="var(--color-text-secondary)"
          disabled={loading}
          title="문서 삭제"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    {:else}
      <div class="flex-shrink-0">
        <button
          type="button"
          onclick={toggleExpansion}
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition"
          style:background="var(--color-primary)"
          style:color="white"
          disabled={loading}
        >
          <EyeIcon size={14} />
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>
    {/if}
  </div>

  <!-- Expanded content: full width below header -->
  {#if isExpanded}
    <div class="mt-6">
      <ThemeMarkdown content={doc.content} variant="compact" />
    </div>
  {/if}

  <!-- Error message -->
  {#if error}
    <div class="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
      {error}
    </div>
  {/if}
</div>
