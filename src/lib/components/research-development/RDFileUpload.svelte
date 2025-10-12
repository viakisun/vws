<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import { DOCUMENT_TYPES, DocumentType } from '$lib/constants/document-types'
  import { uploadEvidenceDocument } from '$lib/services/s3/s3-evidence.service'
  import { formatFileSize, validateFile } from '$lib/utils/file-validation'
  import { logger } from '$lib/utils/logger'
  import { FileIcon, UploadIcon, XIcon } from '@lucide/svelte'

  let {
    evidenceId,
    onUploadComplete,
  }: {
    evidenceId: string
    onUploadComplete?: () => void
  } = $props()

  let selectedFile = $state<File | null>(null)
  let selectedDocType = $state<DocumentType>(DocumentType.OTHER)
  let uploading = $state(false)
  let uploadProgress = $state(0)
  let errorMessage = $state<string | null>(null)
  let isDragging = $state(false)

  const allowedTypes = '.pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.hwp'.split(',')
  const maxSizeMB = 100

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      processFile(target.files[0])
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging = false

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0])
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging = true
  }

  function handleDragLeave() {
    isDragging = false
  }

  function processFile(file: File) {
    errorMessage = null
    const validationError = validateFile(file, allowedTypes, maxSizeMB)

    if (validationError) {
      errorMessage = validationError.message
      return
    }

    selectedFile = file
  }

  function clearFile() {
    selectedFile = null
    errorMessage = null
    uploadProgress = 0
  }

  async function handleUpload() {
    if (!selectedFile) return

    try {
      uploading = true
      uploadProgress = 0
      errorMessage = null

      // S3 Evidence Service를 통한 업로드 (메타데이터 저장 포함)
      await uploadEvidenceDocument(evidenceId, selectedFile, selectedDocType, (progress) => {
        uploadProgress = progress
      })

      logger.log('File uploaded successfully', {
        evidenceId,
        fileName: selectedFile.name,
      })

      // 완료 후 초기화
      clearFile()
      onUploadComplete?.()
    } catch (error) {
      logger.error('File upload failed:', error)
      errorMessage = error instanceof Error ? error.message : '업로드 실패'
      uploadProgress = 0
    } finally {
      uploading = false
    }
  }
</script>

<div class="space-y-4">
  <!-- 문서 타입 선택 -->
  <div>
    <label for="doc-type-select" class="block text-sm font-medium text-gray-700 mb-2">
      문서 타입
    </label>
    <select
      id="doc-type-select"
      bind:value={selectedDocType}
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      disabled={uploading}
    >
      {#each DOCUMENT_TYPES as docType}
        <option value={docType.type}>
          {docType.label} - {docType.description}
        </option>
      {/each}
    </select>
  </div>

  <!-- 파일 선택 영역 -->
  {#if !selectedFile}
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragging
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400'}"
      role="button"
      tabindex="0"
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
      onclick={() => document.getElementById('file-input')?.click()}
    >
      <UploadIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p class="text-sm text-gray-600 mb-2">파일을 드래그하거나 클릭하여 업로드</p>
      <p class="text-xs text-gray-500">
        허용 형식: {allowedTypes.join(', ')} (최대 {maxSizeMB}MB)
      </p>
      <input
        id="file-input"
        type="file"
        accept={allowedTypes.join(',')}
        onchange={handleFileSelect}
        class="hidden"
      />
    </div>
  {:else}
    <!-- 선택된 파일 정보 -->
    <div class="border border-gray-300 rounded-lg p-4">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3">
          <FileIcon class="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {selectedFile.name}
            </p>
            <p class="text-xs text-gray-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        </div>
        {#if !uploading}
          <button type="button" onclick={clearFile} class="text-gray-400 hover:text-gray-600">
            <XIcon size={20} />
          </button>
        {/if}
      </div>

      <!-- 업로드 진행률 -->
      {#if uploading}
        <div class="mt-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-600">업로드 중...</span>
            <span class="text-xs text-gray-600">{uploadProgress}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style:width="{uploadProgress}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- 업로드 버튼 -->
      {#if !uploading}
        <div class="mt-4">
          <ThemeButton onclick={handleUpload} class="w-full">
            <UploadIcon size={16} class="mr-2" />
            업로드
          </ThemeButton>
        </div>
      {/if}
    </div>
  {/if}

  <!-- 에러 메시지 -->
  {#if errorMessage}
    <div class="rounded-md bg-red-50 p-4">
      <p class="text-sm text-red-800">{errorMessage}</p>
    </div>
  {/if}
</div>
