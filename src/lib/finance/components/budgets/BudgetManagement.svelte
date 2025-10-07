<script lang="ts">
  import { onMount } from 'svelte'
  import type {
    Budget,
    TransactionCategory,
    Account,
    CreateBudgetRequest,
  } from '$lib/finance/types'
  import { formatCurrency } from '$lib/finance/utils'
  import { PlusIcon, TrashIcon } from '@lucide/svelte'

  // ============================================================================
  // Constants
  // ============================================================================

  const CURRENT_YEAR = new Date().getFullYear()
  const CURRENT_MONTH = new Date().getMonth() + 1
  const YEAR_RANGE = 5 // 현재 연도 기준 ±2년
  const MONTHS_IN_YEAR = 12

  const UTILIZATION_THRESHOLDS = {
    DANGER: 100,
    WARNING: 80,
  } as const

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /** 예산 사용률에 따른 텍스트 색상 반환 */
  function getUtilizationColor(rate: number): string {
    if (rate >= UTILIZATION_THRESHOLDS.DANGER) return 'text-red-600'
    if (rate >= UTILIZATION_THRESHOLDS.WARNING) return 'text-yellow-600'
    return 'text-green-600'
  }

  /** 예산 사용률에 따른 배경 색상 반환 */
  function getUtilizationBgColor(rate: number): string {
    if (rate >= UTILIZATION_THRESHOLDS.DANGER) return 'bg-red-50'
    if (rate >= UTILIZATION_THRESHOLDS.WARNING) return 'bg-yellow-50'
    return 'bg-green-50'
  }

  /** 예산 사용률에 따른 진행바 색상 반환 */
  function getProgressBarColor(rate: number): string {
    if (rate >= UTILIZATION_THRESHOLDS.DANGER) return 'bg-red-500'
    if (rate >= UTILIZATION_THRESHOLDS.WARNING) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  /** 예산 사용률 계산 */
  function calculateUtilizationRate(actual: number, planned: number): number {
    return planned > 0 ? (actual / planned) * 100 : 0
  }

  /** 초기 폼 데이터 생성 */
  function createInitialFormData(): CreateBudgetRequest {
    return {
      name: '',
      type: 'expense',
      period: 'monthly',
      year: CURRENT_YEAR,
      month: CURRENT_MONTH,
      plannedAmount: 0,
      categoryId: '',
      accountId: '',
      description: '',
      tags: [],
      isRecurring: false,
    }
  }

  /** 연도 목록 생성 */
  function generateYearOptions(): number[] {
    return Array.from({ length: YEAR_RANGE }, (_, i) => CURRENT_YEAR - 2 + i)
  }

  /** 월 목록 생성 */
  function generateMonthOptions(): number[] {
    return Array.from({ length: MONTHS_IN_YEAR }, (_, i) => i + 1)
  }

  // ============================================================================
  // ============================================================================
  // State
  // ============================================================================

  // Data state
  let budgets = $state<Budget[]>([])
  let categories = $state<TransactionCategory[]>([])
  let accounts = $state<Account[]>([])

  // UI state
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)

  // Filter state
  let selectedPeriod = $state<'monthly' | 'quarterly' | 'yearly'>('monthly')
  let selectedYear = $state(CURRENT_YEAR)
  let selectedMonth = $state(CURRENT_MONTH)

  // Computed state
  let filteredBudgets = $state<Budget[]>([])
  let totalPlanned = $state(0)
  let totalActual = $state(0)
  let utilizationRate = $state(0)

  // Form state
  let formData = $state<CreateBudgetRequest>(createInitialFormData())

  // ============================================================================
  // Data Loading
  // ============================================================================

  /** API에서 데이터 fetch */
  async function fetchData<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint)
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || `${endpoint} 데이터를 불러올 수 없습니다.`)
    }
    return result.data
  }

  /** 모든 필요한 데이터 로드 */
  async function loadData() {
    try {
      isLoading = true
      error = null

      const [budgetsData, categoriesData, accountsData] = await Promise.all([
        fetchData<Budget[]>('/api/finance/budgets'),
        fetchData<TransactionCategory[]>('/api/finance/categories'),
        fetchData<Account[]>('/api/finance/accounts'),
      ])

      budgets = budgetsData
      categories = categoriesData
      accounts = accountsData

      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // ============================================================================
  // Budget Operations
  // ============================================================================

  /** 새 예산 생성 */
  async function createBudget() {
    try {
      isLoading = true
      error = null

      const response = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '예산 생성에 실패했습니다.')
      }

      budgets = [result.data, ...budgets]
      formData = createInitialFormData()
      showAddModal = false
      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '예산 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  /** 예산 삭제 */
  async function deleteBudget(budget: Budget) {
    if (!confirm(`예산 "${budget.name}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      isLoading = true
      error = null

      const response = await fetch(`/api/finance/budgets/${budget.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '예산 삭제에 실패했습니다.')
      }

      budgets = budgets.filter((b) => b.id !== budget.id)
      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '예산 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // ============================================================================
  // Filtering & Statistics
  // ============================================================================
  // ============================================================================
  // Filtering & Statistics
  // ============================================================================

  /** 필터에 맞는 예산만 필터링 */
  function filterBudgets(): Budget[] {
    return budgets.filter((budget) => {
      if (budget.year !== selectedYear) return false

      if (selectedPeriod === 'monthly' && budget.period === 'monthly') {
        return budget.month === selectedMonth
      }

      if (selectedPeriod === 'quarterly' && budget.period === 'quarterly') {
        return true // 같은 연도의 분기별 예산
      }

      if (selectedPeriod === 'yearly' && budget.period === 'yearly') {
        return true // 같은 연도의 연별 예산
      }

      return false
    })
  }

  /** 통계 계산 */
  function calculateStatistics(budgets: Budget[]): {
    totalPlanned: number
    totalActual: number
    utilizationRate: number
  } {
    const totalPlanned = budgets.reduce((sum, budget) => sum + budget.plannedAmount, 0)
    const totalActual = budgets.reduce((sum, budget) => sum + budget.actualAmount, 0)
    const utilizationRate = calculateUtilizationRate(totalActual, totalPlanned)

    return { totalPlanned, totalActual, utilizationRate }
  }

  /** 필터링 및 통계 업데이트 */
  function updateFilteredData() {
    filteredBudgets = filterBudgets()
    const stats = calculateStatistics(filteredBudgets)
    totalPlanned = stats.totalPlanned
    totalActual = stats.totalActual
    utilizationRate = stats.utilizationRate
  }

  /** 필터 변경 핸들러 */
  function handleFilterChange() {
    updateFilteredData()
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  onMount(() => {
    loadData()
  })
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">예산 관리</h3>
      <p class="text-sm text-gray-500">
        총 {filteredBudgets.length}개 예산 • 계획 {formatCurrency(totalPlanned)} • 실제 {formatCurrency(
          totalActual,
        )} • 사용률 {utilizationRate.toFixed(1)}%
      </p>
    </div>
    <button
      type="button"
      onclick={() => (showAddModal = true)}
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon size={16} class="mr-2" />
      새 예산
    </button>
  </div>

  <!-- 필터 -->
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 기간 선택 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">예산 기간</label>
        <select
          bind:value={selectedPeriod}
          onchange={handleFilterChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="monthly">월별</option>
          <option value="quarterly">분기별</option>
          <option value="yearly">연별</option>
        </select>
      </div>

      <!-- 연도 선택 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">연도</label>
        <select
          bind:value={selectedYear}
          onchange={handleFilterChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {#each generateYearOptions() as year}
            <option value={year}>{year}년</option>
          {/each}
        </select>
      </div>

      <!-- 월 선택 (월별 예산인 경우) -->
      {#if selectedPeriod === 'monthly'}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">월</label>
          <select
            bind:value={selectedMonth}
            onchange={handleFilterChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {#each generateMonthOptions() as month}
              <option value={month}>{month}월</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
  </div>

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 예산 목록 -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">예산 정보를 불러오는 중...</span>
    </div>
  {:else if filteredBudgets.length > 0}
    <div class="space-y-4">
      {#each filteredBudgets as budget}
        {@const budgetUtilization = calculateUtilizationRate(
          budget.actualAmount,
          budget.plannedAmount,
        )}
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="text-lg font-medium text-gray-900">{budget.name}</h4>
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span>{budget.categoryId ? '카테고리 연결됨' : '카테고리 없음'}</span>
                {#if budget.accountId}
                  <span>• 계좌 연결됨</span>
                {/if}
                <span
                  >• {budget.year}년 {budget.month
                    ? `${budget.month}월`
                    : budget.quarter
                      ? `Q${budget.quarter}`
                      : ''}</span
                >
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                type="button"
                onclick={() => deleteBudget(budget)}
                class="text-red-600 hover:text-red-900"
                title="삭제"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>

          <!-- 예산 진행률 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">계획 금액</span>
              <span class="font-medium text-gray-900">{formatCurrency(budget.plannedAmount)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">실제 사용</span>
              <span class="font-medium text-gray-900">{formatCurrency(budget.actualAmount)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">사용률</span>
              <span class="font-medium {getUtilizationColor(budgetUtilization)}">
                {budgetUtilization.toFixed(1)}%
              </span>
            </div>

            <!-- 진행률 바 -->
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full {getProgressBarColor(budgetUtilization)}"
                style:width="{Math.min(budgetUtilization, 100)}%"
              ></div>
            </div>
          </div>

          {#if budget.description}
            <div class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-sm text-gray-600">{budget.description}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">예산이 없습니다</h3>
      <p class="text-gray-500 mb-4">새 예산을 설정하여 지출을 관리하세요.</p>
      <button
        type="button"
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon size={16} class="mr-2" />
        첫 번째 예산 설정
      </button>
    </div>
  {/if}
</div>

<!-- 예산 추가 모달 -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">새 예산 설정</h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          createBudget()
        }}
      >
        <div class="space-y-4">
          <!-- 예산명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">예산명</label>
            <input
              type="text"
              bind:value={formData.name}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 월급여 예산"
            />
          </div>

          <!-- 예산 타입 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">예산 타입</label>
            <select
              bind:value={formData.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="income">수입</option>
              <option value="expense">지출</option>
              <option value="investment">투자</option>
            </select>
          </div>

          <!-- 예산 기간 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">예산 기간</label>
            <select
              bind:value={formData.period}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">월별</option>
              <option value="quarterly">분기별</option>
              <option value="yearly">연별</option>
            </select>
          </div>

          <!-- 연도 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">연도</label>
            <select
              bind:value={formData.year}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {#each generateYearOptions() as year}
                <option value={year}>{year}년</option>
              {/each}
            </select>
          </div>

          <!-- 월 (월별 예산인 경우) -->
          {#if formData.period === 'monthly'}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">월</label>
              <select
                bind:value={formData.month}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {#each generateMonthOptions() as month}
                  <option value={month}>{month}월</option>
                {/each}
              </select>
            </div>
          {/if}

          <!-- 계획 금액 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">계획 금액</label>
            <input
              type="number"
              bind:value={formData.plannedAmount}
              required
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- 카테고리 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리 (선택사항)</label>
            <select
              bind:value={formData.categoryId}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">카테고리를 선택하세요</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <!-- 계좌 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">계좌 (선택사항)</label>
            <select
              bind:value={formData.accountId}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">계좌를 선택하세요</option>
              {#each accounts as account}
                <option value={account.id}>{account.name}</option>
              {/each}
            </select>
          </div>

          <!-- 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
            <textarea
              bind:value={formData.description}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예산에 대한 추가 설명"
            ></textarea>
          </div>

          <!-- 정기 예산 여부 -->
          <div class="flex items-center">
            <input
              type="checkbox"
              bind:checked={formData.isRecurring}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-700">정기 예산으로 설정</label>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onclick={() => (showAddModal = false)}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '설정 중...' : '예산 설정'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
