<script lang="ts">
  import ThemeModal from '../ui/ThemeModal.svelte'
  import ThemeButton from '../ui/ThemeButton.svelte'

  interface BudgetForm {
    periodNumber: number
    startDate: string
    endDate: string
    personnelCostCash: string
    researchMaterialCostCash: string
    researchActivityCostCash: string
    researchStipendCash: string
    indirectCostCash: string
    personnelCostInKind: string
    researchMaterialCostInKind: string
    researchActivityCostInKind: string
    researchStipendInKind: string
    indirectCostInKind: string
  }

  interface Props {
    open: boolean
    editingBudget?: any
    budgetForm: BudgetForm
    onclose: () => void
    onsubmit: () => void
    oncancel: () => void
    formatNumber: (value: string | number, isInput: boolean) => string
    handleNumberInput: (e: Event, callback: (value: string) => void) => void
  }

  let {
    open = $bindable(),
    editingBudget = $bindable(null),
    budgetForm = $bindable(),
    onclose,
    onsubmit,
    oncancel,
    formatNumber,
    handleNumberInput,
  }: Props = $props()
</script>

<!-- 사업비 추가/편집 모달 -->
<ThemeModal {open} {onclose} size="lg">
  <div class="space-y-6">
    <!-- 모달 제목 -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900">
        {editingBudget ? '사업비 편집' : '사업비 추가'}
      </h3>
    </div>

    <!-- 기본 정보 -->
    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label for="pm-budget-period-number" class="block text-sm font-medium text-gray-700 mb-1"
            >연차 번호 *</label
          >
          <input
            id="pm-budget-period-number"
            type="number"
            bind:value={budgetForm.periodNumber}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="10"
          />
        </div>
        <div>
          <label for="pm-budget-start-date" class="block text-sm font-medium text-gray-700 mb-1"
            >시작일 *</label
          >
          <input
            id="pm-budget-start-date"
            type="date"
            bind:value={budgetForm.startDate}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="pm-budget-end-date" class="block text-sm font-medium text-gray-700 mb-1"
            >종료일 *</label
          >
          <input
            id="pm-budget-end-date"
            type="date"
            bind:value={budgetForm.endDate}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <!-- 직접비 -->
    <div class="space-y-4">
      <h4 class="text-lg font-medium text-gray-900">직접비</h4>

      <!-- 인건비 -->
      <div class="space-y-2">
        <div class="block text-sm font-medium text-gray-700">인건비</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="pm-budget-personnel-cash" class="block text-xs text-gray-500 mb-1"
              >현금 (천원)</label
            >
            <input
              id="pm-budget-personnel-cash"
              type="text"
              value={formatNumber(budgetForm.personnelCostCash, false)}
              oninput={(e) => handleNumberInput(e, (v) => (budgetForm.personnelCostCash = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label for="pm-budget-personnel-in-kind" class="block text-xs text-gray-500 mb-1"
              >현물 (천원)</label
            >
            <input
              id="pm-budget-personnel-in-kind"
              type="text"
              value={formatNumber(budgetForm.personnelCostInKind, false)}
              oninput={(e) => handleNumberInput(e, (v) => (budgetForm.personnelCostInKind = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <!-- 연구재료비 -->
      <div class="space-y-2">
        <div class="block text-sm font-medium text-gray-700">연구재료비</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="pm-budget-research-material-cash" class="block text-xs text-gray-500 mb-1"
              >현금 (천원)</label
            >
            <input
              id="pm-budget-research-material-cash"
              type="text"
              value={formatNumber(budgetForm.researchMaterialCostCash, false)}
              oninput={(e) =>
                handleNumberInput(e, (v) => (budgetForm.researchMaterialCostCash = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label
              for="pm-budget-research-material-in-kind"
              class="block text-xs text-gray-500 mb-1">현물 (천원)</label
            >
            <input
              id="pm-budget-research-material-in-kind"
              type="text"
              value={formatNumber(budgetForm.researchMaterialCostInKind, false)}
              oninput={(e) =>
                handleNumberInput(e, (v) => (budgetForm.researchMaterialCostInKind = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <!-- 연구활동비 -->
      <div class="space-y-2">
        <div class="block text-sm font-medium text-gray-700">연구활동비</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="pm-budget-research-activity-cash" class="block text-xs text-gray-500 mb-1"
              >현금 (천원)</label
            >
            <input
              id="pm-budget-research-activity-cash"
              type="text"
              value={formatNumber(budgetForm.researchActivityCostCash, false)}
              oninput={(e) =>
                handleNumberInput(e, (v) => (budgetForm.researchActivityCostCash = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label
              for="pm-budget-research-activity-in-kind"
              class="block text-xs text-gray-500 mb-1">현물 (천원)</label
            >
            <input
              id="pm-budget-research-activity-in-kind"
              type="text"
              value={formatNumber(budgetForm.researchActivityCostInKind, false)}
              oninput={(e) =>
                handleNumberInput(e, (v) => (budgetForm.researchActivityCostInKind = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 연구수당 -->
    <div class="space-y-4">
      <h4 class="text-lg font-medium text-gray-900">연구수당</h4>
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="pm-budget-research-stipend-cash"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              연구수당 (현금)
            </label>
            <input
              id="pm-budget-research-stipend-cash"
              type="text"
              value={formatNumber(budgetForm.researchStipendCash, false)}
              oninput={(e) => handleNumberInput(e, (v) => (budgetForm.researchStipendCash = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label
              for="pm-budget-research-stipend-in-kind"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              연구수당 (현물)
            </label>
            <input
              id="pm-budget-research-stipend-in-kind"
              type="text"
              value={formatNumber(budgetForm.researchStipendInKind, false)}
              oninput={(e) => handleNumberInput(e, (v) => (budgetForm.researchStipendInKind = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 간접비 -->
    <div class="space-y-4">
      <h4 class="text-lg font-medium text-gray-900">간접비</h4>
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="pm-budget-indirect-cash" class="block text-xs text-gray-500 mb-1"
              >현금 (천원)</label
            >
            <input
              id="pm-budget-indirect-cash"
              type="text"
              value={formatNumber(budgetForm.indirectCostCash, false)}
              oninput={(e) => handleNumberInput(e, (v) => (budgetForm.indirectCostCash = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label for="pm-budget-indirect-in-kind" class="block text-xs text-gray-500 mb-1"
              >현물 (천원)</label
            >
            <input
              id="pm-budget-indirect-in-kind"
              type="text"
              value={formatNumber(budgetForm.indirectCostInKind, false)}
              oninput={(e) => handleNumberInput(e, (v) => (budgetForm.indirectCostInKind = v))}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-end space-x-3 mt-6">
    <ThemeButton variant="ghost" onclick={oncancel}>취소</ThemeButton>
    <ThemeButton onclick={onsubmit}>
      {editingBudget ? '수정' : '추가'}
    </ThemeButton>
  </div>
</ThemeModal>
