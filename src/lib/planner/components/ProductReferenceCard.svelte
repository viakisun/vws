<script lang="ts">
  import type { ProductReferenceWithCreator } from '$lib/planner/types'
  import {
    deleteProductReference,
    downloadProductReference,
    formatFileSize,
  } from '$lib/services/s3/s3-planner.service'
  import { formatKoreanName } from '$lib/utils/korean-name'
  import { getReferenceTypeLabel } from '$lib/utils/link-detector'
  import {
    BugIcon,
    CheckSquareIcon,
    DownloadIcon,
    EditIcon,
    ExternalLinkIcon,
    FileIcon,
    FileTextIcon,
    GithubIcon,
    GlobeIcon,
    GripVerticalIcon,
    ImageIcon,
    MessageSquareIcon,
    PaletteIcon,
    TrashIcon,
    VideoIcon,
    BrushIcon,
    MonitorIcon,
  } from 'lucide-svelte'

  interface Props {
    reference: ProductReferenceWithCreator
    productId: string
    onEdit?: (reference: ProductReferenceWithCreator) => void
    onDelete?: (referenceId: string) => void
    canEdit?: boolean
    isDragging?: boolean
    showDragHandle?: boolean
  }

  let {
    reference,
    productId,
    onEdit,
    onDelete,
    canEdit = false,
    isDragging = false,
    showDragHandle = false,
  }: Props = $props()

  let loading = $state(false)
  let error = $state<string | null>(null)

  // Get appropriate icon for reference type and filename
  function getTypeIcon(type: string, filename?: string) {
    // 파일명을 기반으로 더 구체적인 아이콘 선택
    if (filename) {
      const lowerFilename = filename.toLowerCase()

      // 문서 파일들
      if (lowerFilename.endsWith('.pdf')) return FileTextIcon
      if (lowerFilename.match(/\.(doc|docx)$/)) return FileTextIcon
      if (lowerFilename.match(/\.(xls|xlsx)$/)) return FileIcon // 스프레드시트
      if (lowerFilename.match(/\.(ppt|pptx)$/)) return FileTextIcon // 프레젠테이션

      // 이미지 파일들
      if (lowerFilename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/)) return ImageIcon
    }

    // 타입 기반 아이콘 매핑
    switch (type) {
      case 'pdf':
        return FileTextIcon // PDF 문서
      case 'image':
        return ImageIcon // 이미지 파일
      case 'github':
        return GithubIcon // GitHub 저장소
      case 'youtube':
        return VideoIcon // YouTube 비디오
      case 'slack':
        return MessageSquareIcon // Slack 워크스페이스
      case 'discord':
        return MessageSquareIcon // Discord 서버
      case 'zoom':
        return VideoIcon // Zoom 회의
      case 'trello':
        return CheckSquareIcon // Trello 보드
      case 'jira':
        return BugIcon // Jira 이슈
      case 'figma':
        return PaletteIcon // Figma 디자인
      case 'notion':
        return FileTextIcon // Notion 페이지
      case 'google_docs':
        return FileTextIcon // Google Docs 문서
      case 'miro':
        return BrushIcon // Miro 화이트보드
      case 'adobe':
        return PaletteIcon // Adobe 크리에이티브 도구
      case 'url':
        return ExternalLinkIcon // 외부 링크
      case 'file':
        return FileIcon // 일반 파일
      default:
        return FileIcon // 기본값
    }
  }

  // Get type color
  function getTypeColor(type: string): string {
    switch (type) {
      case 'pdf':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'image':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'figma':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'notion':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'google_docs':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'github':
        return 'text-gray-800 bg-gray-100 border-gray-300'
      case 'youtube':
        return 'text-red-700 bg-red-50 border-red-300'
      case 'slack':
        return 'text-purple-700 bg-purple-50 border-purple-300'
      case 'discord':
        return 'text-indigo-700 bg-indigo-50 border-indigo-300'
      case 'zoom':
        return 'text-blue-700 bg-blue-50 border-blue-300'
      case 'trello':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'jira':
        return 'text-blue-700 bg-blue-50 border-blue-300'
      case 'miro':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'adobe':
        return 'text-red-700 bg-red-50 border-red-300'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Format creation date
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Handle download/preview
  async function handleAction() {
    if (loading) return

    try {
      loading = true
      error = null

      if (reference.url) {
        // External URL - open in new tab
        window.open(reference.url, '_blank')
      } else if (reference.s3_key) {
        // File download
        await downloadProductReference(productId, reference.id, true)
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to open reference'
      console.error('Error handling reference action:', e)
    } finally {
      loading = false
    }
  }

  // Handle edit
  function handleEdit() {
    onEdit?.(reference)
  }

  // Handle delete
  async function handleDelete() {
    if (loading) return

    if (!confirm(`정말로 "${reference.title}" 레퍼런스를 삭제하시겠습니까?`)) {
      return
    }

    try {
      loading = true
      error = null

      await deleteProductReference(productId, reference.id)
      onDelete?.(reference.id)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete reference'
      console.error('Error deleting reference:', e)
    } finally {
      loading = false
    }
  }

  // Check if it's an external link
  const isExternalLink = $derived(!!reference.url && !reference.s3_key)
  const hasFile = $derived(!!reference.s3_key)
  const typeColor = $derived(getTypeColor(reference.type))
  const TypeIcon = $derived(getTypeIcon(reference.type, reference.file_name))
</script>

<div
  class="group relative rounded-lg border p-4 transition-all hover:shadow-md"
  class:opacity-50={loading || isDragging}
  class:cursor-grab={showDragHandle && canEdit}
  style:background="var(--color-surface)"
  style:border-color="var(--color-border)"
>
  <!-- Error message -->
  {#if error}
    <div class="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
      {error}
    </div>
  {/if}

  <div class="flex items-start gap-3">
    <!-- Drag handle -->
    {#if showDragHandle}
      <div class="flex items-center justify-center h-10 w-6 cursor-grab">
        <GripVerticalIcon size={16} style="color: var(--color-text-tertiary)" />
      </div>
    {/if}

    <!-- Type icon -->
    <div class="flex h-10 w-10 items-center justify-center rounded-lg border {typeColor}">
      <TypeIcon size={20} />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Title and type badge -->
      <div class="mb-2 flex items-start gap-2">
        <h4
          class="font-medium flex-1"
          style="color: var(--color-text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
          title={reference.title}
        >
          {reference.title}
        </h4>
        <span class="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap {typeColor}">
          {getReferenceTypeLabel(reference.type)}
        </span>
      </div>

      <!-- Description -->
      {#if reference.description}
        <p class="mb-2 text-sm" style:color="var(--color-text-secondary)">
          {reference.description}
        </p>
      {/if}

      <!-- File info or URL -->
      <div class="mb-2 flex items-center gap-4 text-xs" style:color="var(--color-text-tertiary)">
        {#if hasFile && reference.file_name}
          <span class="flex items-center gap-1">
            <FileTextIcon size={12} />
            {reference.file_name}
          </span>
          {#if reference.file_size}
            <span>{formatFileSize(reference.file_size)}</span>
          {/if}
        {:else if isExternalLink && reference.url}
          <span class="flex items-center gap-1">
            <GlobeIcon size={12} />
            {new URL(reference.url).hostname}
          </span>
        {/if}

        <span class="flex items-center gap-1">
          {formatKoreanName(reference.creator.last_name, reference.creator.first_name)}
          · {formatDate(reference.created_at)}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <!-- Download/Open button - Primary action with blue background -->
      <button
        type="button"
        class="rounded-md p-2 transition"
        class:bg-blue-600={!loading}
        class:hover:bg-blue-700={!loading}
        class:text-white={!loading}
        class:bg-gray-200={loading}
        class:pointer-events-none={loading}
        onclick={handleAction}
        title={isExternalLink ? '링크 열기' : '다운로드'}
      >
        {#if loading}
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"
          ></div>
        {:else if isExternalLink}
          <ExternalLinkIcon size={16} />
        {:else}
          <DownloadIcon size={16} />
        {/if}
      </button>

      <!-- Edit/Delete buttons (if can edit) -->
      {#if canEdit}
        <button
          type="button"
          class="rounded-md p-1.5 transition hover:bg-gray-100"
          class:pointer-events-none={loading}
          onclick={handleEdit}
          title="편집"
          style:color="var(--color-text-secondary)"
        >
          <EditIcon size={16} />
        </button>

        <button
          type="button"
          class="rounded-md p-1.5 transition hover:bg-red-100"
          class:pointer-events-none={loading}
          onclick={handleDelete}
          title="삭제"
        >
          <TrashIcon size={16} class="text-red-600" />
        </button>
      {/if}
    </div>
  </div>
</div>
