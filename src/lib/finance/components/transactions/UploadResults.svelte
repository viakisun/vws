<script lang="ts">
  interface UploadResult {
    fileName: string
    success: boolean
    message?: string
    detectedBank?: string
    data?: {
      created?: number
      updated?: number
      skipped?: number
    }
  }

  interface Props {
    results: UploadResult[]
  }

  const { results }: Props = $props()
</script>

{#if results && results.length > 0}
  <div class="mt-4 space-y-2">
    <h4 class="font-medium text-gray-700">업로드 결과</h4>
    {#each results as result}
      <div
        class="p-3 rounded-lg border {result.success
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'}"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="font-medium {result.success ? 'text-green-800' : 'text-red-800'}">
              {result.fileName}
            </p>
            {#if result.detectedBank}
              <p class="text-sm text-gray-600">감지된 은행: {result.detectedBank}</p>
            {/if}
            {#if result.message}
              <p class="text-sm {result.success ? 'text-green-700' : 'text-red-700'}">
                {result.message}
              </p>
            {/if}
            {#if result.success && result.data}
              <p class="text-sm text-gray-600 mt-1">
                생성: {result.data.created || 0}건
                {#if result.data.updated}
                  | 수정: {result.data.updated}건
                {/if}
                {#if result.data.skipped}
                  | 건너뜀: {result.data.skipped}건
                {/if}
              </p>
            {/if}
          </div>
          <div class="ml-3">
            {#if result.success}
              <svg
                class="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            {:else}
              <svg
                class="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
