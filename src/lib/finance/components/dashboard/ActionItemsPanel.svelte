<script lang="ts">
  import { AlertCircleIcon, ClockIcon, TrendingDownIcon } from '@lucide/svelte'

  interface ActionItems {
    pendingTransactions: number
    todayTransactions: number
    lowBalanceAccounts: number
    total: number
  }

  interface Props {
    actionItems: ActionItems
    onNavigate: (tab: string) => void
  }

  const { actionItems, onNavigate }: Props = $props()
</script>

<div class="bg-white rounded-lg shadow p-6">
  <h3 class="text-lg font-semibold mb-4">처리 필요 항목</h3>

  <div class="space-y-3">
    <!-- 미처리 거래 -->
    <button
      type="button"
      onclick={() => onNavigate('transactions')}
      class="w-full p-3 rounded-lg border hover:border-orange-400 transition-colors {actionItems.pendingTransactions >
      0
        ? 'border-orange-400 bg-orange-50'
        : 'border-gray-200 bg-gray-50'}"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg {actionItems.pendingTransactions > 0
              ? 'bg-orange-100'
              : 'bg-gray-100'}"
          >
            <AlertCircleIcon
              class="w-5 h-5 {actionItems.pendingTransactions > 0
                ? 'text-orange-600'
                : 'text-gray-500'}"
            />
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900">미처리 거래</p>
            <p class="text-sm text-gray-600">승인 대기 중인 거래</p>
          </div>
        </div>
        <span
          class="text-2xl font-bold {actionItems.pendingTransactions > 0
            ? 'text-orange-600'
            : 'text-gray-500'}"
        >
          {actionItems.pendingTransactions}
        </span>
      </div>
    </button>

    <!-- 오늘 거래 -->
    <button
      type="button"
      onclick={() => onNavigate('transactions')}
      class="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 hover:border-blue-400 transition-colors"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gray-100">
            <ClockIcon class="w-5 h-5 text-gray-500" />
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900">오늘 거래</p>
            <p class="text-sm text-gray-600">오늘 발생한 거래</p>
          </div>
        </div>
        <span class="text-2xl font-bold text-gray-900">
          {actionItems.todayTransactions}
        </span>
      </div>
    </button>

    <!-- 잔액 부족 계좌 -->
    <button
      type="button"
      onclick={() => onNavigate('accounts')}
      class="w-full p-3 rounded-lg border hover:border-red-400 transition-colors {actionItems.lowBalanceAccounts >
      0
        ? 'border-red-400 bg-red-50'
        : 'border-gray-200 bg-gray-50'}"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg {actionItems.lowBalanceAccounts > 0
              ? 'bg-red-100'
              : 'bg-gray-100'}"
          >
            <TrendingDownIcon
              class="w-5 h-5 {actionItems.lowBalanceAccounts > 0
                ? 'text-red-600'
                : 'text-gray-500'}"
            />
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900">잔액 부족 계좌</p>
            <p class="text-sm text-gray-600">100만원 미만 계좌</p>
          </div>
        </div>
        <span
          class="text-2xl font-bold {actionItems.lowBalanceAccounts > 0
            ? 'text-red-600'
            : 'text-gray-500'}"
        >
          {actionItems.lowBalanceAccounts}
        </span>
      </div>
    </button>
  </div>

  {#if actionItems.total > 0}
    <div class="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
      <p class="text-sm text-orange-800 text-center">
        총 <span class="font-bold">{actionItems.total}건</span>의 처리가 필요합니다
      </p>
    </div>
  {/if}
</div>
