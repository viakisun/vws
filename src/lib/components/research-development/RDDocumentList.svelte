<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { getDocumentTypeInfo, getDocumentTypeLabel } from '$lib/constants/document-types'
  import type { EvidenceDocument } from '$lib/types/document.types'
  import { formatFileSize } from '$lib/utils/file-validation'
  import { formatDate } from '$lib/utils/format'
  import { logger } from '$lib/utils/logger'
  import { DownloadIcon, FileTextIcon, TrashIcon } from '@lucide/svelte'

  let {
    evidenceId,
    documents = $bindable([]),
    onRefresh,
  }: {
    evidenceId: string
    documents: EvidenceDocument[]
    onRefresh?: () => void
  } = $props()

  let deleting = $state<string | null>(null)

  async function handleDownload(docId: string, fileName: string) {
    try {
      const response = await fetch(
        `/api/research-development/evidence/${evidenceId}/documents/${docId}/download`,
      )

      if (!response.ok) {
        throw new Error('다운로드 URL 생성 실패')
      }

      const { data } = await response.json()

      // 새 창으로 다운로드
      window.open(data.downloadUrl, '_blank')

      logger.log('Document download initiated', { evidenceId, docId, fileName })
    } catch (error) {
      logger.error('Document download failed:', error)
      alert('파일 다운로드에 실패했습니다.')
    }
  }

  async function handleDelete(docId: string, fileName: string) {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) {
      return
    }

    try {
      deleting = docId

      const response = await fetch(
        `/api/research-development/evidence/${evidenceId}/documents/${docId}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        throw new Error('삭제 실패')
      }

      logger.log('Document deleted', { evidenceId, docId, fileName })

      // 목록 새로고침
      onRefresh?.()
    } catch (error) {
      logger.error('Document deletion failed:', error)
      alert('파일 삭제에 실패했습니다.')
    } finally {
      deleting = null
    }
  }
</script>

<div class="space-y-2">
  {#if documents.length === 0}
    <div class="text-center py-8 text-gray-500">
      <FileTextIcon class="mx-auto h-12 w-12 text-gray-300 mb-2" />
      <p class="text-sm">업로드된 서류가 없습니다.</p>
    </div>
  {:else}
    <div class="divide-y divide-gray-200">
      {#each documents as doc (doc.id)}
        {@const docTypeInfo = getDocumentTypeInfo(doc.document_type)}
        <div class="py-3 flex items-center justify-between hover:bg-gray-50 px-3 rounded">
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <!-- 문서 타입 아이콘 -->
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileTextIcon class="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <!-- 파일 정보 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {doc.file_name}
                </p>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {getDocumentTypeLabel(doc.document_type)}
                </span>
              </div>
              <div class="text-xs text-gray-500 space-x-2">
                <span>{formatFileSize(doc.file_size)}</span>
                <span>•</span>
                <span>{formatDate(doc.upload_date)}</span>
              </div>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="flex items-center space-x-2 ml-4">
            <ThemeButton
              variant="ghost"
              size="sm"
              onclick={() => handleDownload(doc.id, doc.file_name)}
            >
              <DownloadIcon size={16} />
            </ThemeButton>
            <ThemeButton
              variant="ghost"
              size="sm"
              onclick={() => handleDelete(doc.id, doc.file_name)}
              disabled={deleting === doc.id}
            >
              <TrashIcon size={16} class="text-red-600" />
            </ThemeButton>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
