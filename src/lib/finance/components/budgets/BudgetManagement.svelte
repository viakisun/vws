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

  // State
  let budgets = $state<Budget[]>([])
  let categories = $state<TransactionCategory[]>([])
  let accounts = $state<Account[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)
  let selectedPeriod = $state('monthly')
  let selectedYear = $state(new Date().getFullYear())
  let selectedMonth = $state(new Date().getMonth() + 1)

  // 폼 데이터
  let formData = $state<CreateBudgetRequest>({
    name: '',
    type: 'expense',
    period: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    plannedAmount: 0,
    categoryId: '',
    accountId: '',
    description: '',
    tags: [],
    isRecurring: false,
  })

  // 데이터 로드
  async function loadData() {
    try {
      isLoading = true
      error = null

      const [budgetsData, categoriesData, accountsData] = await Promise.all([
        fetch('/api/finance/budgets')
          .then((res) => res.json())
          .then((res) => res.data),
        fetch('/api/finance/categories')
          .then((res) => res.json())
          .then((res) => res.data),
        fetch('/api/finance/accounts')
          .then((res) => res.json())
          .then((res) => res.data),
      ])

      budgets = budgetsData
      categories = categoriesData
      accounts = accountsData

      // 필터링된 데이터 업데이트
      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 예산 생성
  async function createBudget() {
    try {
      isLoading = true
      error = null

      const response = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '예산 생성에 실패했습니다.')
      }

      budgets = [result.data, ...budgets]

      // 폼 초기화
      formData = {
        name: '',
        type: 'expense',
        period: 'monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        plannedAmount: 0,
        categoryId: '',
        accountId: '',
        description: '',
        tags: [],
        isRecurring: false,
      }

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '예산 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 예산 삭제
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
    } catch (err) {
      error = err instanceof Error ? err.message : '예산 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    loadData()
  })

  // 필터링된 예산 목록 및 통계
  let filteredBudgets = $state<Budget[]>([])
  let totalPlanned = $state(0)
  let totalActual = $state(0)
  let utilizationRate = $state(0)

  // 필터링 및 통계 계산 함수
  function updateFilteredData() {
    filteredBudgets = budgets.filter((budget) => {
      if (selectedPeriod === 'monthly' && budget.period === 'monthly') {
        return budget.year === selectedYear && budget.month === selectedMonth
      }
      return budget.year === selectedYear
    })

    totalPlanned = filteredBudgets.reduce((sum, budget) => sum + budget.plannedAmount, 0)
    totalActual = filteredBudgets.reduce((sum, budget) => sum + budget.actualAmount, 0)
    utilizationRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0
  }

  // 필터 변경 시 데이터 업데이트 (이벤트 기반)
  function handleFilterChange() {
    updateFilteredData()
  }

  // 예산 사용률에 따른 색상
  function getUtilizationColor(rate: number): string {
    if (rate >= 100) return 'text-red-600'
    if (rate >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  function getUtilizationBgColor(rate: number): string {
    if (rate >= 100) return 'bg-red-50'
    if (rate >= 80) return 'bg-yellow-50'
    return 'bg-green-50'
  }
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
          {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i) as year}
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
            {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
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
              <span
                class="font-medium {getUtilizationColor(
                  (budget.actualAmount / budget.plannedAmount) * 100,
                )}"
              >
                {((budget.actualAmount / budget.plannedAmount) * 100).toFixed(1)}%
              </span>
            </div>

            <!-- 진행률 바 -->
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full {getUtilizationBgColor(
                  (budget.actualAmount / budget.plannedAmount) * 100,
                )
                  .replace('bg-', 'bg-')
                  .replace('-50', '-500')}"
                style="width: {Math.min((budget.actualAmount / budget.plannedAmount) * 100, 100)}%"
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
              {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i) as year}
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
                {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
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
