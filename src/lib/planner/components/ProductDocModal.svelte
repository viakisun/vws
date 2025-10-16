<script lang="ts">
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeMarkdown from '$lib/components/ui/ThemeMarkdown.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import type { ProductDocWithCreator } from '$lib/planner/types'
  import { CodeIcon, EyeIcon, FileTextIcon, UploadIcon, XIcon } from 'lucide-svelte'

  interface Props {
    open: boolean
    productId: string
    doc?: ProductDocWithCreator | null
    onclose: () => void
    onsave: () => void
  }

  let { open = $bindable(false), productId, doc = null, onclose, onsave }: Props = $props()

  // State
  let title = $state('')
  let content = $state('')
  let selectedFile = $state<File | null>(null)
  let dropZoneActive = $state(false)
  let uploading = $state(false)
  let error = $state<string | null>(null)
  let showPreview = $state(false)

  // Is this edit mode?
  const isEdit = $derived(!!doc)

  // Reset form when opening/closing or when doc changes
  $effect(() => {
    if (open) {
      if (doc) {
        // Edit mode - populate form
        title = doc.title
        content = doc.content
        selectedFile = null
      } else {
        // Create mode - reset form
        resetForm()
      }
    }
  })

  function resetForm() {
    title = ''
    content = ''
    selectedFile = null
    error = null
    showPreview = false
  }

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.md')) {
      selectedFile = file
      readFileContent(file)
    } else {
      error = 'Please select a valid .md file'
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
      if (file.name.toLowerCase().endsWith('.md')) {
        selectedFile = file
        readFileContent(file)
      } else {
        error = 'Please select a valid .md file'
      }
    }
  }

  // Read file content
  function readFileContent(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      content = text
      if (!title) {
        title = file.name.replace(/\.md$/i, '') // Remove .md extension for title
      }
      error = null
    }
    reader.onerror = () => {
      error = 'Failed to read file content'
    }
    reader.readAsText(file)
  }

  // Handle form submission
  async function handleSubmit() {
    if (uploading) return

    error = null

    if (!title.trim()) {
      error = '제목을 입력해주세요.'
      return
    }

    if (!content.trim()) {
      error = '콘텐츠를 입력하거나 파일을 업로드해주세요.'
      return
    }

    try {
      uploading = true

      const requestBody = {
        title: title.trim(),
        content: content.trim(),
      }

      if (isEdit && doc) {
        // Update existing doc
        const response = await fetch(`/api/planner/products/${productId}/docs/${doc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '문서 수정에 실패했습니다.')
        }
      } else {
        // Create new doc
        const response = await fetch(`/api/planner/products/${productId}/docs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '문서 생성에 실패했습니다.')
        }
      }

      onsave()
      onclose()
    } catch (e) {
      error = e instanceof Error ? e.message : '문서 저장에 실패했습니다.'
      console.error('Failed to save doc:', e)
    } finally {
      uploading = false
    }
  }

  // Handle cancel
  function handleCancel() {
    if (!uploading) {
      onclose()
    }
  }

  // Handle keydown for ESC
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !uploading) {
      onclose()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<ThemeModal {open} size="lg" onclose={handleCancel}>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold" style:color="var(--color-text-primary)">
        {isEdit ? '문서 편집' : '새 문서 추가'}
      </h2>
    </div>

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
          placeholder="문서 제목을 입력하세요"
          required
          disabled={uploading}
        />
      </div>

      <!-- File Upload Section -->
      <div>
        <label
          for="file-dropzone"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text-primary)"
        >
          마크다운 파일 업로드 (선택사항)
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
            accept=".md"
          />

          {#if selectedFile}
            <div class="flex items-center gap-3">
              <FileTextIcon size={32} class="text-blue-600" />
              <div class="text-left flex-1">
                <p class="font-medium" style:color="var(--color-text-primary)">
                  {selectedFile.name}
                </p>
                <p class="text-sm" style:color="var(--color-text-secondary)">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onclick={() => {
                  selectedFile = null
                  content = isEdit ? doc?.content || '' : ''
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
          {:else}
            <div>
              <UploadIcon size={32} class="mx-auto mb-2 text-gray-400" />
              <p class="text-sm" style:color="var(--color-text-secondary)">
                .md 파일을 드래그하여 놓거나 클릭하여 선택하세요
              </p>
              <p class="text-xs mt-1" style:color="var(--color-text-tertiary)">
                마크다운 파일만 지원됩니다
              </p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Content editor -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label
            for="content"
            class="block text-sm font-medium"
            style:color="var(--color-text-primary)"
          >
            콘텐츠 *
          </label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={() => (showPreview = !showPreview)}
              class="flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition"
              style:border-color="var(--color-border)"
              style:color="var(--color-text-secondary)"
              disabled={uploading || !content.trim()}
            >
              {#if showPreview}
                <CodeIcon size={12} />
                <span>편집</span>
              {:else}
                <EyeIcon size={12} />
                <span>미리보기</span>
              {/if}
            </button>
          </div>
        </div>

        {#if showPreview && content.trim()}
          <div class="border rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto">
            <ThemeMarkdown {content} variant="compact" />
          </div>
        {:else}
          <textarea
            id="content"
            bind:value={content}
            class="w-full rounded-md border px-3 py-2 text-sm min-h-[200px] max-h-[400px] resize-y"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text-primary)"
            placeholder="마크다운 콘텐츠를 입력하거나 파일을 업로드하세요..."
            required
            disabled={uploading}
          ></textarea>
        {/if}
      </div>

      <!-- Upload Progress -->
      {#if uploading}
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: 100%"
            ></div>
          </div>
          <span class="text-sm" style:color="var(--color-text-secondary)">저장 중...</span>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4">
        <ThemeButton variant="ghost" onclick={handleCancel} disabled={uploading}>취소</ThemeButton>
        <ThemeButton type="submit" disabled={uploading || !title.trim() || !content.trim()}>
          {uploading ? '저장 중...' : isEdit ? '수정' : '추가'}
        </ThemeButton>
      </div>
    </form>
  </div>
</ThemeModal>
