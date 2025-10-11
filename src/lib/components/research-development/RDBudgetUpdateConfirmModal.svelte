<script lang="ts">
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'

  // TypeScript interfaces for validation data
  interface BudgetUpdateValidationData {
    warnings: string[]
    recommendations?: string[]
    oldTotalBudget: number
    newTotalBudget: number
    totalBudgetChange: number
  }

  // Props
  interface Props {
    open: boolean
    onclose: () => void
    validationData: BudgetUpdateValidationData | null
    onConfirm: () => void
    onCancel: () => void
  }

  let { open = $bindable(false), onclose, validationData, onConfirm, onCancel }: Props = $props()
</script>

{#if open && validationData}
  <ThemeModal {open} {onclose}>
    <div class="max-w-2xl">
      <div class="mb-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <svg
              class="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">예산 수정 확인</h3>
        </div>

        <!-- Warnings Section -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 class="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h4>
          <ul class="space-y-1 text-sm text-yellow-700">
            {#each validationData.warnings as warning, i (i)}
              <li>• {warning}</li>
            {/each}
          </ul>
        </div>

        <!-- Recommendations Section (Optional) -->
        {#if validationData.recommendations && validationData.recommendations.length > 0}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 class="font-medium text-blue-800 mb-2">💡 권장사항</h4>
            <ul class="space-y-1 text-sm text-blue-700">
              {#each validationData.recommendations as recommendation, i (i)}
                <li>• {recommendation}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Budget Change Details -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 class="font-medium text-gray-800 mb-3">예산 변경 상세</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">기존 총 예산:</span>
              <span class="font-medium">{validationData.oldTotalBudget?.toLocaleString()}원</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">새 총 예산:</span>
              <span class="font-medium">{validationData.newTotalBudget?.toLocaleString()}원</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="text-gray-600">변경 금액:</span>
              <span
                class="font-medium {validationData.totalBudgetChange > 0
                  ? 'text-red-600'
                  : 'text-green-600'}"
              >
                {validationData.totalBudgetChange > 0
                  ? '+'
                  : ''}{validationData.totalBudgetChange?.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="text-sm text-gray-600 mb-4">
          연구개발비 변경 시 기존에 입력된 연구개발비 데이터에 영향을 줄 수 있습니다. 정말로 예산을
          수정하시겠습니까?
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3">
        <ThemeButton variant="ghost" onclick={onCancel}>취소</ThemeButton>
        <ThemeButton variant="primary" onclick={onConfirm}>예산 수정 진행</ThemeButton>
      </div>
    </div>
  </ThemeModal>
{/if}
