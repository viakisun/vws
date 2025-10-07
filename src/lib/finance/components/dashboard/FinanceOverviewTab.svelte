<script lang="ts">
  import ActionItemsPanel from './ActionItemsPanel.svelte'
  import FinanceOverviewCards from './FinanceOverviewCards.svelte'
  import RecentAccountsPanel from './RecentAccountsPanel.svelte'
  import type { Account } from '$lib/finance/types'

  interface DashboardStats {
    totalBalance: number
    activeAccounts: number
    monthlyIncome: number
    monthlyExpense: number
    netCashFlow: number
  }

  interface ActionItems {
    pendingTransactions: number
    todayTransactions: number
    lowBalanceAccounts: number
    total: number
  }

  interface Props {
    stats: DashboardStats
    actionItems: ActionItems
    accounts: Account[]
    onNavigate: (tab: string) => void
  }

  let { stats, actionItems, accounts, onNavigate }: Props = $props()
</script>

<div class="space-y-6">
  <!-- 개요 카드 -->
  <FinanceOverviewCards {stats} />

  <!-- 액션 아이템 & 주요 계좌 -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- 처리 필요 항목 -->
    <div class="lg:col-span-1">
      <ActionItemsPanel {actionItems} {onNavigate} />
    </div>

    <!-- 주요 계좌 -->
    <div class="lg:col-span-2">
      <RecentAccountsPanel {accounts} {onNavigate} />
    </div>
  </div>
</div>
