<script lang="ts">
  import { RefreshCwIcon, ShieldAlertIcon, ShieldCheckIcon } from '@lucide/svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'
  import ThemeEmployeeDropdown from '../ui/ThemeEmployeeDropdown.svelte'
  import ThemeModal from '../ui/ThemeModal.svelte'

  interface EvidenceCategory {
    id: number
    name: string
  }

  interface EvidenceForm {
    categoryId: number | string
    name: string
    description: string
    budgetAmount: number | string
    assigneeId: number | string
    dueDate: string
  }

  interface ValidationResult {
    validation: {
      isValid: boolean
      message: string
      warnings?: string[]
    }
  }

  interface Employee {
    id: string | number
    first_name?: string
    last_name?: string
    name?: string
    korean_name?: string
    formatted_name?: string
    department?: string
    position?: string
  }

  interface Props {
    visible: boolean
    evidenceForm: EvidenceForm
    evidenceCategories: EvidenceCategory[]
    availableEmployees: Employee[]
    isValidatingEvidence: boolean
    evidenceValidation: ValidationResult | null
    isUpdating: boolean
    onclose: () => void
    onvalidate: () => void
    onsubmit: () => void
  }

  let {
    visible = $bindable(),
    evidenceForm = $bindable(),
    evidenceCategories,
    availableEmployees,
    isValidatingEvidence,
    evidenceValidation,
    isUpdating,
    onclose,
    onvalidate,
    onsubmit,
  }: Props = $props()

  // 직원 데이터를 ThemeEmployeeDropdown 형식으로 변환
  const formattedEmployees = $derived(
    availableEmployees.map((emp) => ({
      id: String(emp.id),
      name: emp.korean_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      first_name: emp.first_name,
      last_name: emp.last_name,
    })),
  )

  // 담당자 ID를 string으로 변환 (computed)
  let assigneeIdString = $derived(String(evidenceForm.assigneeId || ''))

  // 담당자 변경 핸들러
  function handleAssigneeChange(assigneeId: string) {
    evidenceForm.assigneeId = assigneeId ? Number(assigneeId) : ''
    onvalidate()
  }
</script>

<!-- 증빙 추가 모달 -->
{#if visible}
  <ThemeModal open={visible} {onclose}>
    <div class="p-6 max-w-2xl">
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900">증빙 항목 추가</h3>
      </div>

      <div class="space-y-4">
        <!-- 증빙 카테고리 선택 -->
        <div>
          <label for="evidence-category" class="block text-sm font-medium text-gray-700 mb-1">
            증빙 카테고리 *
          </label>
          <select
            id="evidence-category"
            bind:value={evidenceForm.categoryId}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">카테고리를 선택하세요</option>
            {#each evidenceCategories as category, i (i)}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <!-- 증빙 항목명 -->
        <div>
          <label for="evidence-name" class="block text-sm font-medium text-gray-700 mb-1">
            증빙 항목명 *
          </label>
          <input
            id="evidence-name"
            type="text"
            bind:value={evidenceForm.name}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 박기선 (2025-01), 모터 10개, 출장비 (국내)"
            required
          />
        </div>

        <!-- 설명 -->
        <div>
          <label for="evidence-description" class="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            id="evidence-description"
            bind:value={evidenceForm.description}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="증빙 항목에 대한 상세 설명"
          ></textarea>
        </div>

        <!-- 예산액 -->
        <div>
          <label for="evidence-budget-amount" class="block text-sm font-medium text-gray-700 mb-1">
            예산액 *
          </label>
          <input
            id="evidence-budget-amount"
            type="number"
            bind:value={evidenceForm.budgetAmount}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            required
          />
        </div>

        <!-- 담당자 -->
        <div>
          <label for="evidence-assignee" class="block text-sm font-medium text-gray-700 mb-1">
            담당자
          </label>
          <ThemeEmployeeDropdown
            id="evidence-assignee"
            value={assigneeIdString}
            employees={formattedEmployees}
            placeholder="담당자를 선택하세요"
            showDepartment={true}
            showPosition={false}
            onchange={handleAssigneeChange}
          />
        </div>

        <!-- 마감일 -->
        <div>
          <label for="evidence-due-date" class="block text-sm font-medium text-gray-700 mb-1">
            마감일
          </label>
          <input
            id="evidence-due-date"
            type="date"
            bind:value={evidenceForm.dueDate}
            onchange={onvalidate}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- 재직 기간 검증 결과 (인건비인 경우에만 표시) -->
        {#if evidenceForm.categoryId && evidenceCategories.find((cat) => cat.id === evidenceForm.categoryId)?.name === '인건비'}
          {#if isValidatingEvidence}
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div class="flex items-center space-x-2">
                <RefreshCwIcon class="h-4 w-4 text-gray-600 animate-spin" />
                <span class="text-sm text-gray-700">재직 기간 검증 중...</span>
              </div>
            </div>
          {:else if evidenceValidation}
            <div
              class="p-3 border rounded-md {evidenceValidation.validation.isValid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'}"
            >
              <div class="flex items-center space-x-2 mb-2">
                {#if evidenceValidation.validation.isValid}
                  <ShieldCheckIcon class="h-4 w-4 text-green-600" />
                  <span class="text-sm font-medium text-green-800">재직 기간 검증 통과</span>
                {:else}
                  <ShieldAlertIcon class="h-4 w-4 text-red-600" />
                  <span class="text-sm font-medium text-red-800">재직 기간 검증 실패</span>
                {/if}
              </div>
              <p
                class="text-sm {evidenceValidation.validation.isValid
                  ? 'text-green-700'
                  : 'text-red-700'}"
              >
                {evidenceValidation.validation.message}
              </p>
              {#if evidenceValidation.validation.warnings && evidenceValidation.validation.warnings.length > 0}
                <div class="mt-2">
                  {#each evidenceValidation.validation.warnings as warning, i (i)}
                    <p class="text-sm text-yellow-700">⚠️ {warning}</p>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>

      <!-- 액션 버튼 -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
        <ThemeButton variant="ghost" onclick={onclose}>취소</ThemeButton>
        <ThemeButton
          onclick={onsubmit}
          disabled={isUpdating ||
            (evidenceValidation !== null && !evidenceValidation.validation.isValid)}
        >
          {isUpdating ? '추가 중...' : '추가'}
        </ThemeButton>
      </div>
    </div>
  </ThemeModal>
{/if}
