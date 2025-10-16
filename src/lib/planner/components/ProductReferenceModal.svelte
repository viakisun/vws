<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import type { ProductReferenceType, ProductReferenceWithCreator } from '$lib/planner/types'
  import {
    createProductReferenceUrl,
    formatFileSize,
    uploadProductReference,
  } from '$lib/services/s3/s3-planner.service'
  import { detectLinkType, getReferenceTypeLabel } from '$lib/utils/link-detector'
  import { FileTextIcon, LinkIcon, UploadIcon, XIcon } from 'lucide-svelte'

  interface Props {
    open: boolean
    productId: string
    reference?: ProductReferenceWithCreator | null
    onclose: () => void
    onsave: () => void
  }

  let { open = $bindable(false), productId, reference = null, onclose, onsave }: Props = $props()

  // State
  let referenceType = $state<'file' | 'url'>('file')
  let title = $state('')
  let description = $state('')
  let url = $state('')
  let selectedFile = $state<File | null>(null)
  let dropZoneActive = $state(false)
  let uploading = $state(false)
  let uploadProgress = $state(0)
  let error = $state<string | null>(null)
  let type: ProductReferenceType = $state('other')

  // Is this edit mode?
  const isEdit = $derived(!!reference)
  const isValidUrl = $derived(url ? /^https?:\/\/.+/.test(url) : false)

  // Reset form when opening/closing or when reference changes
  $effect(() => {
    if (open) {
      if (reference) {
        // Edit mode - populate form
        title = reference.title
        description = reference.description || ''
        url = reference.url || ''
        type = reference.type
        referenceType = reference.url ? 'url' : 'file'
      } else {
        // Create mode - reset form
        resetForm()
      }
    }
  })

  function resetForm() {
    title = ''
    description = ''
    url = ''
    selectedFile = null
    type = 'other'
    error = null
    uploadProgress = 0
  }

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      selectedFile = file
      if (!title) {
        title = file.name.replace(/\.[^/.]+$/, '') // Remove extension for title
      }
      // Auto-detect type from filename
      type = detectLinkType('', file.name)
    }
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    dropZoneActive = true
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    dropZoneActive = false
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    dropZoneActive = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      selectedFile = file
      if (!title) {
        title = file.name.replace(/\.[^/.]+$/, '')
      }
      // Auto-detect type from filename
      type = detectLinkType('', file.name)
    }
  }

  // Auto-detect type when URL changes
  $effect(() => {
    if (url && referenceType === 'url') {
      const detectedType = detectLinkType(url)
      type = detectedType
    }
  })

  // Handle form submission
  async function handleSubmit() {
    if (uploading) return

    error = null

    if (!title.trim()) {
      error = '제목을 입력해주세요.'
      return
    }

    try {
      uploading = true
      uploadProgress = 0

      if (referenceType === 'file') {
        if (!selectedFile && !(isEdit && reference?.s3_key)) {
          error = '파일을 선택해주세요.'
          return
        }

        // Validate file size (50MB max) - only for new files
        if (selectedFile) {
          const maxSize = 50 * 1024 * 1024 // 50MB
          if (selectedFile.size > maxSize) {
            error = `파일 크기가 50MB를 초과합니다. (현재: ${formatFileSize(selectedFile.size)})`
            return
          }
        }

        if (isEdit && reference?.s3_key && !selectedFile) {
          // Edit mode - update metadata only (no new file upload)
          const response = await fetch(
            `/api/planner/products/${productId}/references/${reference.id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: title.trim(),
                description: description.trim() || undefined,
                type: 'file', // Keep as file type
              }),
              credentials: 'include',
            },
          )

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || '레퍼런스 수정에 실패했습니다.')
          }
        } else {
          // New file upload
          await uploadProductReference(
            productId,
            selectedFile!,
            title.trim(),
            description.trim() || undefined,
            (progress) => {
              uploadProgress = progress
            },
          )
        }
      } else {
        if (!url.trim()) {
          error = 'URL을 입력해주세요.'
          return
        }

        if (!isValidUrl) {
          error = '올바른 URL 형식을 입력해주세요.'
          return
        }

        if (isEdit && reference?.url) {
          // Edit mode - update URL metadata
          const response = await fetch(
            `/api/planner/products/${productId}/references/${reference.id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: title.trim(),
                description: description.trim() || undefined,
                url: url.trim(),
                type: type,
              }),
              credentials: 'include',
            },
          )

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || '레퍼런스 수정에 실패했습니다.')
          }
        } else {
          // New URL creation
          await createProductReferenceUrl(
            productId,
            url.trim(),
            title.trim(),
            description.trim() || undefined,
            type,
          )
        }
      }

      onsave()
      onclose()
    } catch (e) {
      error = e instanceof Error ? e.message : '레퍼런스 생성에 실패했습니다.'
      console.error('Failed to create reference:', e)
    } finally {
      uploading = false
      uploadProgress = 0
    }
  }

  // Handle cancel
  function handleCancel() {
    if (uploading) return
    resetForm()
    onclose()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<ThemeModal {open} size="lg" onclose={handleCancel}>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">
        {isEdit ? '레퍼런스 편집' : '새 레퍼런스 추가'}
      </h2>
    </div>

    <!-- Reference Type Selection -->
    <fieldset class="mb-6">
      <legend class="block text-sm font-medium mb-3" style:color="var(--color-text-primary)">
        레퍼런스 타입 선택 *
      </legend>
      <div class="space-y-3">
        <label
          class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition"
          class:border-blue-500={referenceType === 'file'}
          class:border-gray-300={referenceType !== 'file'}
          class:bg-blue-50={referenceType === 'file'}
          class:bg-transparent={referenceType !== 'file'}
        >
          <input
            type="radio"
            name="referenceType"
            value="file"
            bind:group={referenceType}
            disabled={uploading || (isEdit && !!reference?.url)}
            class="text-blue-600 focus:ring-blue-500"
            onchange={() => {
              error = null
              // Clear URL when switching to file mode
              url = ''
            }}
          />
          <UploadIcon size={20} class="text-blue-600" />
          <div>
            <div class="font-medium" style:color="var(--color-text-primary)">파일 업로드</div>
            <div class="text-sm" style:color="var(--color-text-secondary)">
              PDF, 이미지, 문서 파일을 업로드합니다
            </div>
          </div>
        </label>

        <label
          class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition"
          class:border-blue-500={referenceType === 'url'}
          class:border-gray-300={referenceType !== 'url'}
          class:bg-blue-50={referenceType === 'url'}
          class:bg-transparent={referenceType !== 'url'}
        >
          <input
            type="radio"
            name="referenceType"
            value="url"
            bind:group={referenceType}
            disabled={uploading || (isEdit && !!reference?.s3_key)}
            class="text-blue-600 focus:ring-blue-500"
            onchange={() => {
              error = null
              // Clear file when switching to URL mode
              selectedFile = null
            }}
          />
          <LinkIcon size={20} class="text-blue-600" />
          <div>
            <div class="font-medium" style:color="var(--color-text-primary)">링크 추가</div>
            <div class="text-sm" style:color="var(--color-text-secondary)">
              웹사이트, 문서, 설계 링크를 추가합니다
            </div>
          </div>
        </label>
      </div>
    </fieldset>

    <!-- Error message -->
    {#if error}
      <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    {/if}

    <!-- Form -->
    <form onsubmit={handleSubmit} class="space-y-4">
      <!-- Title -->
      <div>
        <label
          for="title"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-primary)"
        >
          제목 *
        </label>
        <input
          id="title"
          type="text"
          bind:value={title}
          class="w-full rounded-md border px-3 py-2 text-sm"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text-primary)"
          placeholder="레퍼런스 제목을 입력하세요"
          required
          disabled={uploading}
        />
      </div>

      <!-- Description -->
      <div>
        <label
          for="description"
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text-primary)"
        >
          설명
        </label>
        <textarea
          id="description"
          bind:value={description}
          rows="3"
          class="w-full rounded-md border px-3 py-2 text-sm"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text-primary)"
          placeholder="레퍼런스 설명 (선택사항)"
          disabled={uploading}
        ></textarea>
      </div>

      <!-- File Upload Section -->
      {#if referenceType === 'file'}
        <div>
          <label
            for="file-dropzone"
            class="block text-sm font-medium mb-2"
            style:color="var(--color-text-primary)"
          >
            파일 선택
          </label>

          <div
            id="file-dropzone"
            role="button"
            tabindex="0"
            class="relative border-2 border-dashed rounded-lg p-6 text-center transition"
            class:border-blue-400={dropZoneActive}
            class:border-gray-300={!dropZoneActive}
            class:bg-blue-50={dropZoneActive}
            class:bg-gray-50={!dropZoneActive}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onchange={handleFileSelect}
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            />

            {#if selectedFile}
              <div class="flex items-center gap-3">
                <FileTextIcon size={32} class="text-blue-600" />
                <div class="text-left flex-1">
                  <p class="font-medium" style:color="var(--color-text-primary)">
                    {selectedFile.name}
                  </p>
                  <p class="text-sm" style:color="var(--color-text-secondary)">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onclick={() => {
                    selectedFile = null
                    // Reset file input
                    const fileInput = document.getElementById('file-input') as HTMLInputElement
                    if (fileInput) fileInput.value = ''
                  }}
                  class="text-gray-400 hover:text-gray-600 transition"
                  disabled={uploading}
                >
                  <XIcon size={18} />
                </button>
              </div>
            {:else if isEdit && reference?.s3_key}
              <!-- Show existing file in edit mode -->
              <div class="flex items-center gap-3">
                <FileTextIcon size={32} class="text-blue-600" />
                <div class="text-left flex-1">
                  <p class="font-medium" style:color="var(--color-text-primary)">
                    {reference.file_name || '기존 파일'}
                  </p>
                  <p class="text-sm" style:color="var(--color-text-secondary)">
                    {reference.file_size ? formatFileSize(reference.file_size) : '파일 정보 없음'}
                  </p>
                </div>
              </div>
            {:else}
              <div>
                <UploadIcon size={32} class="mx-auto mb-2 text-gray-400" />
                <p class="text-sm" style:color="var(--color-text-secondary)">
                  파일을 드래그하여 놓거나 클릭하여 선택하세요
                </p>
                <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
                  PDF, 이미지, 문서 파일 (최대 50MB)
                </p>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- URL Section -->
      {#if referenceType === 'url'}
        <div>
          <label
            for="url"
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text-primary)"
          >
            URL *
          </label>
          <div class="space-y-2">
            <input
              id="url"
              type="url"
              bind:value={url}
              class="w-full rounded-md border px-3 py-2 text-sm"
              style:background="var(--color-surface)"
              style:border-color="var(--color-border)"
              style:color="var(--color-text-primary)"
              placeholder="https://example.com/document"
              required
              disabled={uploading}
            />
            {#if url && type !== 'url'}
              <div class="flex items-center gap-2 text-sm">
                <span style:color="var(--color-text-tertiary)">감지된 타입:</span>
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  class:bg-blue-100={type === 'pdf'}
                  class:text-blue-700={type === 'pdf'}
                  class:bg-purple-100={type === 'figma'}
                  class:text-purple-700={type === 'figma'}
                  class:bg-gray-100={type === 'notion'}
                  class:text-gray-700={type === 'notion'}
                >
                  {getReferenceTypeLabel(type)}
                </span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Upload Progress -->
      {#if uploading}
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span style:color="var(--color-text-secondary)">업로드 중...</span>
            <span style:color="var(--color-text-secondary)">{uploadProgress.toFixed(0)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style:width="{uploadProgress}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4">
        <ThemeButton variant="ghost" onclick={handleCancel} disabled={uploading}>취소</ThemeButton>
        <ThemeButton
          type="submit"
          disabled={uploading ||
            !title.trim() ||
            (referenceType === 'file' && !selectedFile && !(isEdit && reference?.s3_key)) ||
            (referenceType === 'url' && !url.trim())}
        >
          {uploading ? '저장 중...' : isEdit ? '수정' : '추가'}
        </ThemeButton>
      </div>
    </form>
  </div>
</ThemeModal>
