<script lang="ts">
  import { onMount } from 'svelte'
  import type {
    Transaction,
    Account,
    TransactionCategory,
    CreateTransactionRequest,
  } from '$lib/finance/types'
  import { transactionService, accountService } from '$lib/finance/services'
  import {
    formatCurrency,
    formatDate,
    formatTransactionType,
    formatTransactionStatus,
  } from '$lib/finance/utils'

  // 추가 유틸리티 함수
  function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 금액 포맷팅 함수
  function formatAmountInput(value: number): string {
    return value.toLocaleString('ko-KR')
  }

  // 금액 파싱 함수 (콤마 제거)
  function parseAmountInput(value: string): number {
    return parseInt(value.replace(/,/g, '')) || 0
  }

  // 현재 날짜/시간을 UTC timestamp로 반환
  function getCurrentUTCTimestamp(): string {
    return new Date().toISOString()
  }

  // datetime-local 값을 UTC timestamp로 변환
  function convertToUTCTimestamp(datetimeLocal: string): string {
    if (!datetimeLocal) return getCurrentUTCTimestamp()
    return new Date(datetimeLocal).toISOString()
  }

  // UTC timestamp를 datetime-local 형식으로 변환
  function convertToDateTimeLocal(timestamp: string): string {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // 금액 입력 처리
  function handleAmountInput(event: Event) {
    const target = event.target as HTMLInputElement
    const value = target.value.replace(/,/g, '')
    const numValue = parseInt(value) || 0
    formData.amount = numValue
    amountInput = formatAmountInput(numValue)
  }

  // 날짜/시간 입력 처리
  function handleDateTimeInput(event: Event) {
    const target = event.target as HTMLInputElement
    formData.transactionDate = convertToUTCTimestamp(target.value)
  }
  import { PlusIcon, SearchIcon, FilterIcon, EditIcon, TrashIcon } from '@lucide/svelte'

  // State
  let transactions = $state<Transaction[]>([])
  let accounts = $state<Account[]>([])
  let categories = $state<TransactionCategory[]>([])
  let isLoading = $state(false)
  let error = $state<string | null>(null)
  let showAddModal = $state(false)

  // 필터
  let searchTerm = $state('')
  let selectedAccount = $state('')
  let selectedCategory = $state('')
  let selectedType = $state('')
  let dateFrom = $state('')
  let dateTo = $state('')

  // 날짜 범위 프리셋
  let selectedDateRange = $state('1W') // 기본값: 1주일

  // 날짜 범위 설정 함수
  function setDateRange(range: string) {
    selectedDateRange = range
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    switch (range) {
      case '1D':
        dateFrom = today
        dateTo = today
        break
      case '1W':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFrom = weekAgo.toISOString().split('T')[0]
        dateTo = today
        break
      case '1M':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFrom = monthAgo.toISOString().split('T')[0]
        dateTo = today
        break
      case '3M':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFrom = threeMonthsAgo.toISOString().split('T')[0]
        dateTo = today
        break
      case 'ALL':
        dateFrom = ''
        dateTo = ''
        break
    }
  }

  // 폼 데이터
  let formData = $state<CreateTransactionRequest>({
    accountId: '',
    categoryId: '',
    amount: 0,
    type: 'expense',
    description: '',
    transactionDate: getCurrentUTCTimestamp(),
    referenceNumber: '',
    notes: '',
    tags: [],
  })

  // 금액 입력을 위한 별도 상태 (포맷팅된 문자열)
  let amountInput = $state('0')

  // 날짜/시간 입력을 위한 별도 상태 (datetime-local 형식)
  let dateTimeInput = $state(convertToDateTimeLocal(getCurrentUTCTimestamp()))

  // 데이터 로드
  async function loadData() {
    try {
      isLoading = true
      error = null

      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        transactionService.getTransactions({ limit: 100 }),
        accountService.getAccounts(),
        fetch('/api/finance/categories')
          .then((res) => res.json())
          .then((res) => res.data),
      ])

      transactions = transactionsData.transactions
      accounts = accountsData
      categories = categoriesData

      // 필터링된 데이터 업데이트
      updateFilteredData()
    } catch (err) {
      error = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      console.error('데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 거래 생성
  async function createTransaction() {
    try {
      isLoading = true
      error = null

      await transactionService.createTransaction(formData)

      // 거래 생성 후 완전한 데이터 새로고침
      await loadData()

      // 폼 초기화
      formData = {
        accountId: '',
        categoryId: '',
        amount: 0,
        type: 'expense',
        description: '',
        transactionDate: getCurrentUTCTimestamp(),
        referenceNumber: '',
        notes: '',
        tags: [],
      }
      amountInput = '0'
      dateTimeInput = convertToDateTimeLocal(getCurrentUTCTimestamp())

      showAddModal = false
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 생성에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 거래 수정
  let showEditModal = $state(false)
  let editingTransaction = $state<Transaction | null>(null)

  function editTransaction(transaction: Transaction) {
    editingTransaction = transaction
    formData = {
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      referenceNumber: transaction.referenceNumber || '',
      notes: transaction.notes || '',
      tags: transaction.tags || [],
    }
    amountInput = formatAmountInput(transaction.amount)
    dateTimeInput = convertToDateTimeLocal(transaction.transactionDate)
    showEditModal = true
  }

  async function updateTransaction() {
    if (!editingTransaction) return

    try {
      isLoading = true
      error = null

      await transactionService.updateTransaction(editingTransaction.id, {
        ...formData,
        id: editingTransaction.id,
      })

      // 거래 수정 후 완전한 데이터 새로고침
      await loadData()

      showEditModal = false
      editingTransaction = null
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 수정에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 거래 삭제
  async function deleteTransaction(transaction: Transaction) {
    if (!confirm(`거래 "${transaction.description}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    try {
      isLoading = true
      error = null

      await transactionService.deleteTransaction(transaction.id)

      // 거래 삭제 후 완전한 데이터 새로고침
      await loadData()
    } catch (err) {
      error = err instanceof Error ? err.message : '거래 삭제에 실패했습니다.'
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    // 기본 날짜 범위 설정 (1주일)
    setDateRange('1W')
    loadData()
  })

  // 필터링된 거래 목록 및 통계
  let filteredTransactions = $state<Transaction[]>([])
  let totalIncome = $state(0)
  let totalExpense = $state(0)
  let netAmount = $state(0)

  // 필터링 및 통계 계산 함수
  function updateFilteredData() {
    filteredTransactions = transactions.filter((transaction) => {
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (selectedAccount && transaction.accountId !== selectedAccount) {
        return false
      }
      if (selectedCategory && transaction.categoryId !== selectedCategory) {
        return false
      }
      if (selectedType && transaction.type !== selectedType) {
        return false
      }
      if (dateFrom && transaction.transactionDate.split('T')[0] < dateFrom) {
        return false
      }
      if (dateTo && transaction.transactionDate.split('T')[0] > dateTo) {
        return false
      }
      return true
    })

    totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    netAmount = totalIncome - totalExpense
  }

  // 필터 변경 시 데이터 업데이트 (이벤트 기반)
  function handleFilterChange() {
    updateFilteredData()
  }
</script>

<div class="space-y-6">
  <!-- 헤더 -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium text-gray-900">거래 내역 관리</h3>
      <p class="text-sm text-gray-500">
        총 {filteredTransactions.length}건 • 수입 {formatCurrency(totalIncome)} • 지출 {formatCurrency(
          totalExpense,
        )} • 순이익 {formatCurrency(netAmount)}
      </p>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <PlusIcon size={16} class="mr-2" />
      새 거래
    </button>
  </div>

  <!-- 개선된 필터 섹션 -->
  <div class="space-y-4">
    <!-- 날짜 범위 필터 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-gray-700">날짜 범위</h4>
        <span class="text-xs text-gray-500">
          {dateFrom && dateTo ? `${dateFrom} ~ ${dateTo}` : '전체 기간'}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => {
            setDateRange('1D')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '1D'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 1일
        </button>
        <button
          onclick={() => {
            setDateRange('1W')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '1W'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 1주
        </button>
        <button
          onclick={() => {
            setDateRange('1M')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '1M'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 1개월
        </button>
        <button
          onclick={() => {
            setDateRange('3M')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          '3M'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          최근 3개월
        </button>
        <button
          onclick={() => {
            setDateRange('ALL')
            handleFilterChange()
          }}
          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {selectedDateRange ===
          'ALL'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        >
          전체
        </button>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <div class="space-y-4">
        <!-- 검색창 -->
        <div class="relative">
          <SearchIcon
            size={20}
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            bind:value={searchTerm}
            oninput={handleFilterChange}
            placeholder="거래 설명으로 검색하세요..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
        </div>

        <!-- 추가 필터 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 계좌 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">계좌</label>
            <select
              bind:value={selectedAccount}
              onchange={handleFilterChange}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">모든 계좌</option>
              {#each accounts as account}
                <option value={account.id}>{account.name}</option>
              {/each}
            </select>
          </div>

          <!-- 카테고리 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              bind:value={selectedCategory}
              onchange={handleFilterChange}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">모든 카테고리</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <!-- 거래 타입 필터 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 타입</label>
            <select
              bind:value={selectedType}
              onchange={handleFilterChange}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">모든 타입</option>
              <option value="income">수입</option>
              <option value="expense">지출</option>
              <option value="transfer">이체</option>
              <option value="adjustment">조정</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 에러 표시 -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="text-red-600 text-sm font-medium">{error}</div>
    </div>
  {/if}

  <!-- 계좌별 거래 목록 -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      <span class="ml-2 text-gray-500 text-sm">거래 내역을 불러오는 중...</span>
    </div>
  {:else if accounts.length > 0}
    <div class="space-y-6">
      {#each accounts as account}
        {@const accountTransactions = filteredTransactions.filter(
          (t) => t.accountId === account.id,
        )}
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <!-- 계좌 헤더 -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-lg font-medium text-gray-900">{account.name}</h4>
                <p class="text-sm text-gray-500">
                  {account.bank?.name || '알 수 없음'} • {account.accountNumber} • 잔액: {formatCurrency(
                    account.balance,
                  )}
                </p>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-500">거래 건수: {accountTransactions.length}건</div>
                <div class="text-sm font-medium text-gray-900">
                  순이익: {formatCurrency(
                    accountTransactions.reduce(
                      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                      0,
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <!-- 거래 목록 -->
          {#if accountTransactions.length > 0}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >날짜/시간</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >금액</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >잔액</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >적요</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >카테고리</th
                    >
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >액션</th
                    >
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each accountTransactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()) as transaction, index}
                    {@const runningBalance =
                      Number(account.balance) -
                      accountTransactions
                        .slice(0, index)
                        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)}
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {formatDate(transaction.transactionDate)}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatTime(transaction.transactionDate)}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="text-sm font-medium {transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'}"
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(
                            transaction.amount,
                          )}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm font-medium text-gray-900"
                          >{formatCurrency(runningBalance)}</span
                        >
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">{transaction.description}</div>
                        {#if transaction.referenceNumber}
                          <div class="text-xs text-gray-500">
                            참조: {transaction.referenceNumber}
                          </div>
                        {/if}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div
                            class="w-3 h-3 rounded-full mr-2"
                            style="background-color: {transaction.category?.color || '#6B7280'}"
                          ></div>
                          <span class="text-sm text-gray-900"
                            >{transaction.category?.name || '알 수 없음'}</span
                          >
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center space-x-2">
                          <button
                            onclick={() => editTransaction(transaction)}
                            class="text-indigo-600 hover:text-indigo-900"
                            title="수정"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            onclick={() => deleteTransaction(transaction)}
                            class="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="text-gray-400 text-lg mb-2">📊</div>
              <p class="text-gray-500">이 계좌에 거래 내역이 없습니다.</p>
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">계좌가 없습니다</h3>
      <p class="text-gray-500 mb-4">먼저 계좌를 추가해주세요.</p>
    </div>
  {/if}
</div>

<!-- 거래 추가 모달 -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">새 거래 추가</h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          createTransaction()
        }}
      >
        <div class="space-y-4">
          <!-- 거래 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 설명</label>
            <input
              type="text"
              bind:value={formData.description}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 월급, 사무실 임대료"
            />
          </div>

          <!-- 금액 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input
              type="text"
              bind:value={amountInput}
              oninput={handleAmountInput}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- 거래 타입 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 타입</label>
            <select
              bind:value={formData.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="income">수입</option>
              <option value="expense">지출</option>
              <option value="transfer">이체</option>
              <option value="adjustment">조정</option>
            </select>
          </div>

          <!-- 계좌 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">계좌</label>
            <select
              bind:value={formData.accountId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">계좌를 선택하세요</option>
              {#each accounts as account}
                <option value={account.id}>{account.name}</option>
              {/each}
            </select>
          </div>

          <!-- 카테고리 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              bind:value={formData.categoryId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">카테고리를 선택하세요</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <!-- 거래 날짜 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 날짜/시간</label>
            <input
              type="datetime-local"
              bind:value={dateTimeInput}
              oninput={handleDateTimeInput}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- 참조번호 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">참조번호 (선택사항)</label>
            <input
              type="text"
              bind:value={formData.referenceNumber}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: T20241201001"
            />
          </div>

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">메모 (선택사항)</label>
            <textarea
              bind:value={formData.notes}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="거래에 대한 추가 메모"
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
            {isLoading ? '추가 중...' : '거래 추가'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- 거래 수정 모달 -->
{#if showEditModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">거래 수정</h3>

      <form
        onsubmit={(e) => {
          e.preventDefault()
          updateTransaction()
        }}
      >
        <div class="space-y-4">
          <!-- 거래 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 설명</label>
            <input
              type="text"
              bind:value={formData.description}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 월급, 사무실 임대료"
            />
          </div>

          <!-- 금액 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input
              type="text"
              bind:value={amountInput}
              oninput={handleAmountInput}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <!-- 거래 타입 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 타입</label>
            <select
              bind:value={formData.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="income">수입</option>
              <option value="expense">지출</option>
              <option value="transfer">이체</option>
              <option value="adjustment">조정</option>
            </select>
          </div>

          <!-- 계좌 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">계좌</label>
            <select
              bind:value={formData.accountId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">계좌를 선택하세요</option>
              {#each accounts as account}
                <option value={account.id}>{account.name}</option>
              {/each}
            </select>
          </div>

          <!-- 카테고리 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              bind:value={formData.categoryId}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">카테고리를 선택하세요</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <!-- 거래 날짜 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">거래 날짜/시간</label>
            <input
              type="datetime-local"
              bind:value={dateTimeInput}
              oninput={handleDateTimeInput}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- 참조번호 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">참조번호 (선택사항)</label>
            <input
              type="text"
              bind:value={formData.referenceNumber}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: T20241201001"
            />
          </div>

          <!-- 메모 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">메모 (선택사항)</label>
            <textarea
              bind:value={formData.notes}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="거래에 대한 추가 메모"
            ></textarea>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onclick={() => (showEditModal = false)}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '수정 중...' : '거래 수정'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
