<script lang="ts">
  import { dashboardService } from '$lib/finance/services'
  import type { FinanceDashboard } from '$lib/finance/types'
  import { formatAmount, formatCurrency, formatDate } from '$lib/finance/utils'
  import { AlertTriangleIcon, TrendingDownIcon, TrendingUpIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // Props
  interface Props {
    date?: string
  }

  let { date = new Date().toISOString().split('T')[0] }: Props = $props()

  // State
  let dashboardData = $state<FinanceDashboard | null>(null)
  let isLoading = $state(false)
  let error = $state<string | null>(null)

  // 데이터 로드
  async function loadDashboardData() {
    try {
      isLoading = true
      error = null

      const data = await dashboardService.getDashboardData(date)
      dashboardData = data

      // 트렌드 업데이트
      handleDashboardChange()
    } catch (err) {
      error = err instanceof Error ? err.message : '대시보드 데이터를 불러올 수 없습니다.'
      console.error('대시보드 데이터 로드 실패:', err)
    } finally {
      isLoading = false
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMount(() => {
    loadDashboardData()
  })

  // 날짜 변경 시 데이터 재로드
  function _updateData() {
    if (date) {
      loadDashboardData()
    }
  }

  // 현금흐름 트렌드 계산
  let netCashFlowTrend = $state<'positive' | 'negative' | 'neutral'>('neutral')

  // 트렌드 계산 함수
  function updateCashFlowTrend() {
    if (dashboardData) {
      netCashFlowTrend =
        dashboardData.netCashFlow > 0
          ? 'positive'
          : dashboardData.netCashFlow < 0
            ? 'negative'
            : 'neutral'
    } else {
      netCashFlowTrend = 'neutral'
    }
  }

  // 대시보드 데이터 변경 시 트렌드 업데이트 (이벤트 기반)
  function handleDashboardChange() {
    updateCashFlowTrend()
  }
</script>

{#if isLoading}
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
    <span class="ml-2 text-gray-500 text-sm">자금일보 데이터를 불러오는 중...</span>
  </div>
{:else if error}
  <div class="bg-red-50 border border-red-200 rounded-lg p-4">
    <div class="flex items-center">
      <AlertTriangleIcon size={20} class="text-red-600 mr-2" />
      <div class="text-red-600 text-sm font-medium">
        오류: {error}
      </div>
    </div>
    <button
      onclick={loadDashboardData}
      class="mt-2 text-red-600 text-sm underline hover:no-underline"
    >
      다시 시도
    </button>
  </div>
{:else if dashboardData}
  <div class="space-y-6">
    <!-- 이번달 자금 현황 -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">이번달 자금 현황</h3>
        <span class="text-sm text-gray-500">{formatDate(date, 'long')}</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- 현재 잔액 -->
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-semibold text-blue-600">
            {formatAmount(dashboardData.currentBalance)}
          </div>
          <div class="text-sm text-gray-600">현재 잔액</div>
        </div>

        <!-- 이번달 수입 -->
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-semibold text-green-600">
            {formatAmount(dashboardData.monthlyIncome)}
          </div>
          <div class="text-sm text-gray-600">이번달 수입</div>
        </div>

        <!-- 이번달 지출 -->
        <div class="text-center p-4 bg-red-50 rounded-lg">
          <div class="text-2xl font-semibold text-red-600">
            {formatAmount(dashboardData.monthlyExpense)}
          </div>
          <div class="text-sm text-gray-600">이번달 지출</div>
        </div>

        <!-- 순 현금흐름 -->
        <div
          class="text-center p-4 {netCashFlowTrend === 'positive'
            ? 'bg-green-50'
            : netCashFlowTrend === 'negative'
              ? 'bg-red-50'
              : 'bg-gray-50'} rounded-lg"
        >
          <div class="flex items-center justify-center">
            {#if netCashFlowTrend === 'positive'}
              <TrendingUpIcon size={20} class="text-green-600 mr-1" />
            {:else if netCashFlowTrend === 'negative'}
              <TrendingDownIcon size={20} class="text-red-600 mr-1" />
            {/if}
            <div
              class="text-2xl font-semibold {netCashFlowTrend === 'positive'
                ? 'text-green-600'
                : netCashFlowTrend === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-600'}"
            >
              {formatAmount(dashboardData.netCashFlow)}
            </div>
          </div>
          <div class="text-sm text-gray-600">순 현금흐름</div>
        </div>
      </div>
    </div>

    <!-- 계좌별 잔액 현황 -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">계좌별 잔액 현황</h3>

      {#if dashboardData.accountBalances.length > 0}
        <div class="space-y-3">
          {#each dashboardData.accountBalances as accountBalance}
            <div
              class="flex items-center justify-between p-3 border border-gray-100 rounded-lg {accountBalance.isLowBalance
                ? 'bg-red-50 border-red-200'
                : ''}"
            >
              <div class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full mr-3"
                  style="background-color: {accountBalance.account.bank?.color || '#6B7280'}"
                ></div>
                <div>
                  <div class="font-medium text-gray-900">{accountBalance.account.name}</div>
                  <div class="text-sm text-gray-500">{accountBalance.account.accountNumber}</div>
                </div>
              </div>
              <div class="text-right">
                <div
                  class="font-semibold {accountBalance.isLowBalance
                    ? 'text-red-600'
                    : 'text-gray-900'}"
                >
                  {formatCurrency(accountBalance.currentBalance)}
                </div>
                {#if accountBalance.isLowBalance}
                  <div class="text-xs text-red-500">잔액 부족</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-gray-400">
          <p>등록된 계좌가 없습니다</p>
          <p class="text-sm mt-1">새 계좌를 추가해보세요</p>
        </div>
      {/if}
    </div>

    <!-- 최근 거래 내역 -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">최근 거래 내역</h3>

      {#if dashboardData.recentTransactions.length > 0}
        <div class="space-y-3">
          {#each dashboardData.recentTransactions as transaction}
            <div class="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex items-center flex-1">
                <div
                  class="w-2 h-2 rounded-full mr-3 {transaction.type === 'income'
                    ? 'bg-green-500'
                    : transaction.type === 'expense'
                      ? 'bg-red-500'
                      : 'bg-blue-500'}"
                ></div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{transaction.description}</div>
                  <div class="text-sm text-gray-500 flex items-center gap-2">
                    <span>{transaction.account?.name}</span>
                    {#if transaction.counterparty}
                      <span class="text-gray-400">•</span>
                      <span class="text-blue-600 font-medium">{transaction.counterparty}</span>
                    {/if}
                    <span class="text-gray-400">•</span>
                    <span>{formatDate(transaction.transactionDate)}</span>
                  </div>
                </div>
              </div>
              <div class="text-right ml-4">
                <div
                  class="font-semibold {transaction.type === 'income'
                    ? 'text-green-600'
                    : transaction.type === 'expense'
                      ? 'text-red-600'
                      : 'text-blue-600'}"
                >
                  {#if transaction.deposits && transaction.deposits > 0}
                    +{formatCurrency(transaction.deposits)}
                  {:else if transaction.withdrawals && transaction.withdrawals > 0}
                    -{formatCurrency(transaction.withdrawals)}
                  {:else}
                    {transaction.type === 'income'
                      ? '+'
                      : transaction.type === 'expense'
                        ? '-'
                        : ''}{formatCurrency(transaction.amount)}
                  {/if}
                </div>
                <div class="text-xs text-gray-500 flex items-center gap-2">
                  <span class="px-2 py-1 bg-gray-100 rounded text-gray-600">{transaction.category?.name}</span>
                  {#if transaction.balance}
                    <span class="text-gray-400">•</span>
                    <span class="text-gray-600 font-medium">잔액: {formatCurrency(transaction.balance)}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-gray-400">
          <p>최근 거래 내역이 없습니다</p>
        </div>
      {/if}
    </div>

    <!-- 알림 및 상태 -->
    {#if dashboardData.alerts.length > 0}
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">알림</h3>
        <div class="space-y-2">
          {#each dashboardData.alerts as alert}
            <div class="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangleIcon size={16} class="text-yellow-600 mr-2" />
              <div class="text-sm text-yellow-800">{alert.message}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 마지막 업데이트 시간 -->
    <div class="text-center text-xs text-gray-400">
      마지막 업데이트: {formatDate(dashboardData.lastUpdated, 'time')}
    </div>
  </div>
{:else}
  <div class="text-center py-12 text-gray-400">
    <p>대시보드 데이터를 불러올 수 없습니다</p>
  </div>
{/if}
