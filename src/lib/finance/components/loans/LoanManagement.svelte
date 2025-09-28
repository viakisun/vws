<script lang="ts">
  import type { Account } from '$lib/finance/types'
  import { formatCurrency, formatDate } from '$lib/finance/utils'
  import { CalendarIcon, DollarSignIcon, PlusIcon, TrashIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // 대출 계획 타입
  interface LoanPlan {
    id: string
    type: 'execution' | 'repayment'
    amount: number
    interestRate: number
    term: number
    plannedDate: string
    actualDate?: string
    status: 'planned' | 'executed' | 'cancelled'
    description: string
    accountId?: string
    account?: Account
    notes?: string
    createdAt: string
    updatedAt: string
  }

  // State
  let loans = $state<LoanPlan[]>([])
  let accounts = $state<Account[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)
  let selectedType = $state<'execution' | 'repayment'>('execution')
  let selectedYear = $state(new Date().getFullYear())
  let selectedMonth = $state(new Date().getMonth() + 1)

  // 폼 데이터
  let formData = $state({
    type: 'execution' as 'execution' | 'repayment',
    amount: 0,
    interestRate: 0,
    term: 0,
    plannedDate: new Date().toISOString().split('T')[0],
    description: '',
    accountId: '',
    notes: '',
  })

  // 데이터 로드
  async function loadData() {
    try {
      isLoading = true
      error = null

      const [loansData, accountsData] = await Promise.all([
        fetch('/api/finance/loans')
          .then((res) => res.json())
          .then((res) => res.data),
        fetch('/api/finance/accounts')
          .then((res) => res.json())
          .then((res) => res.data),
      ])

      loans = loansData
      accounts = accountsData
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 대출 계획 생성
  async function createLoanPlan() {
    try {
      isLoading = true
      error = null

      const response = await fetch('/api/finance/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '대출 계획 생성에 실패했습니다.')
      }

      loans = [result.data, ...loans]

      // 폼 초기화
      formData = {
        type: 'execution',
        amount: 0,
        interestRate: 0,
        term: 0,
        plannedDate: new Date().toISOString().split('T')[0],
        description: '',
        accountId: '',
        notes: '',
      }

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '대출 계획 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 대출 계획 삭제
  async function deleteLoanPlan(loan: LoanPlan) {
    if (!confirm(`대출 계획 "${loan.description}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      isLoading = true
      error = null

      const response = await fetch(`/api/finance/loans/${loan.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '대출 계획 삭제에 실패했습니다.')
      }

      loans = loans.filter((l) => l.id !== loan.id)
    } catch (err) {
      error = err instanceof Error ? err.message : '대출 계획 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    loadData()
  })

  // 필터링된 대출 계획 목록
  let filteredLoans = $state<LoanPlan[]>([])
  let totalExecutionAmount = $state(0)
  let totalRepaymentAmount = $state(0)

  function handleFilterChange() {
    filteredLoans = loans.filter((loan) => {
      if (selectedType && loan.type !== selectedType) {
        return false
      }
      const loanYear = new Date(loan.plannedDate).getFullYear()
      const loanMonth = new Date(loan.plannedDate).getMonth() + 1

      if (selectedYear && loanYear !== selectedYear) {
        return false
      }
      if (selectedMonth && loanMonth !== selectedMonth) {
        return false
      }
      return true
    })

    totalExecutionAmount = filteredLoans
      .filter((l) => l.type === 'execution')
      .reduce((sum, l) => sum + l.amount, 0)

    totalRepaymentAmount = filteredLoans
      .filter((l) => l.type === 'repayment')
      .reduce((sum, l) => sum + l.amount, 0)
  }

  // 대출 타입별 색상
  function getTypeColor(type: string): string {
    return type === 'execution' ? 'text-blue-600' : 'text-green-600'
  }

  function getTypeBgColor(type: string): string {
    return type === 'execution' ? 'bg-blue-50' : 'bg-green-50'
  }

  function getTypeBorderColor(type: string): string {
    return type === 'execution' ? 'border-blue-200' : 'border-green-200'
  }
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">대출 계획 관리</h3>
      <p class="text-sm text-gray-500">
        총 {filteredLoans.length}개 계획 • 실행 {formatCurrency(totalExecutionAmount)} • 상환 {formatCurrency(
          totalRepaymentAmount,
        )}
      </p>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon size={16} class="mr-2" />
      새 계획
    </button>
  </div>

  <!-- 필터 -->
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 대출 타입 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">대출 타입</label>
        <select
          bind:value={selectedType}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 타입</option>
          <option value="execution">대출 실행</option>
          <option value="repayment">대출 상환</option>
        </select>
      </div>

      <!-- 연도 선택 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">연도</label>
        <select
          bind:value={selectedYear}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 연도</option>
          {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i) as year}
            <option value={year}>{year}년</option>
          {/each}
        </select>
      </div>

      <!-- 월 선택 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">월</label>
        <select
          bind:value={selectedMonth}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">모든 월</option>
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
            <option value={month}>{month}월</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 대출 계획 목록 -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">대출 계획을 불러오는 중...</span>
    </div>
  {:else if filteredLoans.length > 0}
    <div class="space-y-4">
      {#each filteredLoans as loan}
        <div class="bg-white rounded-lg border border-gray-200 p-6 {getTypeBorderColor(loan.type)}">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div
                class="w-3 h-3 rounded-full mr-3 {getTypeBgColor(loan.type)
                  .replace('bg-', 'bg-')
                  .replace('-50', '-500')}"
              ></div>
              <div>
                <h4 class="text-lg font-medium text-gray-900">{loan.description}</h4>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                  <span class="flex items-center">
                    <CalendarIcon size={14} class="mr-1" />
                    {formatDate(loan.plannedDate)}
                  </span>
                  {#if loan.account}
                    <span>• {loan.account.name}</span>
                  {/if}
                  {#if loan.interestRate > 0}
                    <span>• 이자율 {loan.interestRate}%</span>
                  {/if}
                  {#if loan.term > 0}
                    <span>• 기간 {loan.term}개월</span>
                  {/if}
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTypeBgColor(
                  loan.type,
                )} {getTypeColor(loan.type)}"
              >
                {loan.type === 'execution' ? '대출 실행' : '대출 상환'}
              </span>
              <button
                onclick={() => deleteLoanPlan(loan)}
                class="text-red-600 hover:text-red-900"
                title="삭제"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>

          <!-- 금액 및 상태 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <DollarSignIcon size={20} class="mr-2 {getTypeColor(loan.type)}" />
              <div class="text-2xl font-semibold {getTypeColor(loan.type)}">
                {formatCurrency(loan.amount)}
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">상태</div>
              <div class="text-sm font-medium text-gray-900">
                {loan.status === 'planned'
                  ? '계획됨'
                  : loan.status === 'executed'
                    ? '실행됨'
                    : '취소됨'}
              </div>
            </div>
          </div>

          {#if loan.notes}
            <div class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-sm text-gray-600">{loan.notes}</p>
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">대출 계획이 없습니다</h3>
      <p class="text-gray-500 mb-4">새 대출 계획을 설정하여 자금 계획을 관리하세요.</p>
      <button
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon size={16} class="mr-2" />
        첫 번째 대출 계획 설정
      </button>
    </div>
  {/if}
</div>

<!-- 대출 계획 추가 모달 -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">새 대출 계획 설정</h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          createLoanPlan()
        }}
      >
        <div class="space-y-4">
          <!-- 대출 타입 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">대출 타입</label>
            <select
              bind:value={formData.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="execution">대출 실행</option>
              <option value="repayment">대출 상환</option>
            </select>
          </div>

          <!-- 금액 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input
              type="number"
              bind:value={formData.amount}
              required
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- 이자율 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이자율 (%)</label>
            <input
              type="number"
              bind:value={formData.interestRate}
              min="0"
              max="100"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <!-- 기간 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">기간 (개월)</label>
            <input
              type="number"
              bind:value={formData.term}
              min="0"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- 계획 날짜 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">계획 날짜</label>
            <input
              type="date"
              bind:value={formData.plannedDate}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <input
              type="text"
              bind:value={formData.description}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 신규 사업자 대출 실행"
            />
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

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">메모 (선택사항)</label>
            <textarea
              bind:value={formData.notes}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="대출 계획에 대한 추가 메모"
            ></textarea>
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
            {isLoading ? '설정 중...' : '계획 설정'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
