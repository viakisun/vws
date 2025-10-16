<script lang="ts">
  import type { CRMStats } from '$lib/types/crm'
  import {
    UsersIcon,
    FileTextIcon,
    TrendingUpIcon,
    TargetIcon,
    DollarSignIcon,
    ArrowUpIcon,
    ArrowDownIcon,
  } from 'lucide-svelte'

  interface Props {
    stats: CRMStats
  }

  const { stats }: Props = $props()

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('ko-KR').format(num)
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- 총 고객 수 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">총 고객 수</p>
        <p class="text-2xl font-bold text-gray-900 mt-2">
          {formatNumber(stats.totalCustomers)}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          활성 {stats.activeCustomers}개
        </p>
      </div>
      <div class="p-3 bg-blue-100 /50 rounded-lg">
        <UsersIcon class="w-6 h-6 text-blue-600 " />
      </div>
    </div>
  </div>

  <!-- 활성 계약 총액 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">활성 계약 총액</p>
        <p class="text-2xl font-bold text-green-600 mt-2">
          {formatCurrency(stats.totalRevenueContracts)}
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {stats.activeContracts}개 계약
        </p>
      </div>
      <div class="p-3 bg-green-100 /50 rounded-lg">
        <FileTextIcon class="w-6 h-6 text-green-600 " />
      </div>
    </div>
  </div>

  <!-- 순 계약 가치 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">순 계약 가치</p>
        <p
          class="text-2xl font-bold mt-2 {stats.netContractValue >= 0
            ? 'text-orange-600 '
            : 'text-red-600 '}"
        >
          {formatCurrency(stats.netContractValue)}
        </p>
        <p class="text-sm text-gray-500 mt-1">수령 - 지급</p>
      </div>
      <div
        class="p-3 rounded-lg {stats.netContractValue >= 0
          ? 'bg-orange-100 /50'
          : 'bg-red-100 /50'}"
      >
        <DollarSignIcon
          class="w-6 h-6 {stats.netContractValue >= 0 ? 'text-orange-600 ' : 'text-red-600 '}"
        />
      </div>
    </div>
  </div>

  <!-- 진행 중인 영업 기회 -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">진행 중인 기회</p>
        <p class="text-2xl font-bold text-purple-600 mt-2">
          {formatNumber(stats.openOpportunities)}건
        </p>
        <p class="text-sm text-gray-500 mt-1">
          {formatCurrency(stats.totalOpportunityAmount)}
        </p>
      </div>
      <div class="p-3 bg-purple-100 /50 rounded-lg">
        <TargetIcon class="w-6 h-6 text-purple-600 " />
      </div>
    </div>
  </div>
</div>

<!-- 추가 통계 (2줄 그리드) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
  <!-- 이번 달 신규 고객 -->
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <p class="text-xs font-medium text-gray-600">이번 달 신규 고객</p>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-xl font-bold text-gray-900">
            {formatNumber(stats.newCustomersThisMonth)}
          </p>
          {#if stats.newCustomersGrowth !== 0}
            <div
              class="flex items-center gap-0.5 text-xs font-medium {stats.newCustomersGrowth > 0
                ? 'text-green-600'
                : 'text-red-600'}"
            >
              {#if stats.newCustomersGrowth > 0}
                <ArrowUpIcon class="w-3 h-3" />
                <span>+{stats.newCustomersGrowth.toFixed(0)}%</span>
              {:else}
                <ArrowDownIcon class="w-3 h-3" />
                <span>{stats.newCustomersGrowth.toFixed(0)}%</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- 지급 예정 총액 -->
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex-1">
      <p class="text-xs font-medium text-gray-600">지급 예정 총액</p>
      <p class="text-xl font-bold text-red-600 mt-1">
        {formatCurrency(stats.totalExpenseContracts)}
      </p>
    </div>
  </div>

  <!-- 갱신 예정 계약 -->
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex-1">
      <p class="text-xs font-medium text-gray-600">30일 내 갱신 예정</p>
      <p class="text-xl font-bold text-yellow-600 mt-1">
        {formatNumber(stats.contractsToRenew)}건
      </p>
    </div>
  </div>
</div>
