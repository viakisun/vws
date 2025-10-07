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

<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <h3 class="text-lg font-semibold mb-4">처리 필요 항목</h3>

  <div class="space-y-3">
    <!-- 미처리 거래 -->
    <button
      type="button"
      onclick={() => onNavigate('transactions')}
      class="w-full p-3 rounded-lg border hover:border-orange-400 transition-colors {actionItems.pendingTransactions >
      0
        ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg {actionItems.pendingTransactions > 0
              ? 'bg-orange-100 dark:bg-orange-900/50'
              : 'bg-gray-100 dark:bg-gray-800'}"
          >
            <AlertCircleIcon
              class="w-5 h-5 {actionItems.pendingTransactions > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400'}"
            />
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900 dark:text-gray-100">미처리 거래</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">승인 대기 중인 거래</p>
          </div>
        </div>
        <span
          class="text-2xl font-bold {actionItems.pendingTransactions > 0
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-gray-500 dark:text-gray-400'}"
        >
          {actionItems.pendingTransactions}
        </span>
      </div>
    </button>

    <!-- 오늘 거래 -->
    <button
      type="button"
      onclick={() => onNavigate('transactions')}
      class="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-blue-400 transition-colors"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <ClockIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900 dark:text-gray-100">오늘 거래</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">오늘 발생한 거래</p>
          </div>
        </div>
        <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
        ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg {actionItems.lowBalanceAccounts > 0
              ? 'bg-red-100 dark:bg-red-900/50'
              : 'bg-gray-100 dark:bg-gray-800'}"
          >
            <TrendingDownIcon
              class="w-5 h-5 {actionItems.lowBalanceAccounts > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'}"
            />
          </div>
          <div class="text-left">
            <p class="font-medium text-gray-900 dark:text-gray-100">잔액 부족 계좌</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">100만원 미만 계좌</p>
          </div>
        </div>
        <span
          class="text-2xl font-bold {actionItems.lowBalanceAccounts > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400'}"
        >
          {actionItems.lowBalanceAccounts}
        </span>
      </div>
    </button>
  </div>

  {#if actionItems.total > 0}
    <div
      class="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800"
    >
      <p class="text-sm text-orange-800 dark:text-orange-200 text-center">
        총 <span class="font-bold">{actionItems.total}건</span>의 처리가 필요합니다
      </p>
    </div>
  {/if}
</div>
