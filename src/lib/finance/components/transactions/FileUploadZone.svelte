<script lang="ts">
  interface Props {
    multiple?: boolean
    accept?: string
    selectedFiles: File[]
    onFileSelect: (files: File[]) => void
    disabled?: boolean
  }

  const {
    multiple = false,
    accept = '.xlsx,.xls,.csv',
    selectedFiles,
    onFileSelect,
    disabled = false,
  }: Props = $props()

  function handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files)
      onFileSelect(files)
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    if (disabled) return

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files)
      onFileSelect(files)
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
  }
</script>

<div
  class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center {disabled
    ? 'bg-gray-100 cursor-not-allowed'
    : 'hover:border-blue-400 cursor-pointer'}"
  ondrop={handleDrop}
  ondragover={handleDragOver}
  role="button"
  tabindex="0"
>
  <input
    type="file"
    {accept}
    {multiple}
    {disabled}
    oninput={handleFileInput}
    class="hidden"
    id="file-upload-{multiple ? 'multi' : 'single'}"
  />
  <label
    for="file-upload-{multiple ? 'multi' : 'single'}"
    class="cursor-pointer {disabled ? 'cursor-not-allowed' : ''}"
  >
    <div class="text-gray-600">
      {#if selectedFiles.length > 0}
        <p class="font-medium text-blue-600">
          {multiple
            ? `${selectedFiles.length}개 파일 선택됨`
            : selectedFiles[0]?.name || '파일을 선택하세요'}
        </p>
        {#if multiple && selectedFiles.length > 0}
          <ul class="mt-2 text-sm text-left max-h-32 overflow-y-auto">
            {#each selectedFiles as file}
              <li class="truncate">{file.name}</li>
            {/each}
          </ul>
        {/if}
      {:else}
        <p>파일을 드래그하거나 클릭하여 선택하세요</p>
        <p class="text-sm text-gray-400 mt-1">
          지원 형식: {accept}
        </p>
      {/if}
    </div>
  </label>
</div>
