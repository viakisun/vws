<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { DollarSignIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from '@lucide/svelte'

  interface DashboardStats {
    totalBalance: number
    activeAccounts: number
    monthlyIncome: number
    monthlyExpense: number
    netCashFlow: number
  }

  interface Props {
    stats: DashboardStats
  }

  const { stats }: Props = $props()

  // 디버깅
  $effect(() => {
    logger.info('📊 [FinanceOverviewCards] stats 업데이트:', stats)
  })

  // 금액 포맷팅 함수
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('ko-KR').format(num)
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- 총 잔액 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">총 잔액</p>
        <p class="text-2xl font-bold text-gray-900 mt-2">
          {formatCurrency(stats.totalBalance)}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {stats.activeAccounts}개 계좌
        </p>
      </div>
      <div class="p-3 bg-blue-100 rounded-lg">
        <WalletIcon class="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>

  <!-- 이번 달 수입 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">이번 달 수입</p>
        <p class="text-2xl font-bold text-green-600 mt-2">
          {formatCurrency(stats.monthlyIncome)}
        </p>
        <p class="text-sm text-gray-500 mt-1">Income</p>
      </div>
      <div class="p-3 bg-green-100 rounded-lg">
        <TrendingUpIcon class="w-6 h-6 text-green-600" />
      </div>
    </div>
  </div>

  <!-- 이번 달 지출 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">이번 달 지출</p>
        <p class="text-2xl font-bold text-red-600 mt-2">
          {formatCurrency(stats.monthlyExpense)}
        </p>
        <p class="text-sm text-gray-500 mt-1">Expense</p>
      </div>
      <div class="p-3 bg-red-100 rounded-lg">
        <TrendingDownIcon class="w-6 h-6 text-red-600" />
      </div>
    </div>
  </div>

  <!-- 순 현금 흐름 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">순 현금 흐름</p>
        <p
          class="text-2xl font-bold mt-2 {stats.netCashFlow >= 0
            ? 'text-blue-600'
            : 'text-red-600'}"
        >
          {formatCurrency(stats.netCashFlow)}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {stats.netCashFlow >= 0 ? '흑자' : '적자'}
        </p>
      </div>
      <div class="p-3 rounded-lg {stats.netCashFlow >= 0 ? 'bg-blue-100' : 'bg-red-100'}">
        <DollarSignIcon
          class="w-6 h-6 {stats.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}"
        />
      </div>
    </div>
  </div>
</div>
