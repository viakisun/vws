<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import type { Customer, Opportunity, Transaction } from '$lib/sales/types'
  import { formatCurrency, formatDate } from '$lib/utils/format'

  let {
    customers = [],
    opportunities = [],
    transactions = [],
    getStatusColor,
    getStatusLabel,
  }: {
    customers: Customer[]
    opportunities: Opportunity[]
    transactions: Transaction[]
    getStatusColor: (status: string) => string
    getStatusLabel: (status: string) => string
  } = $props()
</script>

<ThemeSpacer size={6}>
  <!-- 핵심 지표 -->
  <ThemeGrid cols={1} lgCols={2} gap={6}>
    <!-- 매출 현황 -->
    <ThemeCard class="p-6">
      <ThemeSectionHeader title="매출 현황" />
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm" style:color="var(--color-text-secondary)">이번 달 매출</span>
          <span class="font-semibold" style:color="var(--color-success)">
            {formatCurrency(
              transactions
                .filter((t) => t.type === 'sales' && t.payment_status === 'paid')
                .reduce((sum, t) => sum + t.amount, 0),
            )}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm" style:color="var(--color-text-secondary)">미수금</span>
          <span class="font-semibold" style:color="var(--color-warning)">
            {formatCurrency(
              transactions
                .filter((t) => t.type === 'sales' && t.payment_status === 'pending')
                .reduce((sum, t) => sum + t.amount, 0),
            )}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm" style:color="var(--color-text-secondary)">연체금</span>
          <span class="font-semibold" style:color="var(--color-error)">
            {formatCurrency(
              transactions
                .filter((t) => t.type === 'sales' && t.payment_status === 'overdue')
                .reduce((sum, t) => sum + t.amount, 0),
            )}
          </span>
        </div>
      </div>
    </ThemeCard>

    <!-- 영업 기회 현황 -->
    <ThemeCard class="p-6">
      <ThemeSectionHeader title="영업 기회 현황" />
      <div class="space-y-4">
        {#each opportunities.filter((opp) => opp.status === 'active') as opportunity, i (i)}
          <div
            class="flex items-center justify-between p-3 rounded-lg"
            style:background="var(--color-surface-elevated)"
          >
            <div class="flex-1">
              <h4 class="font-medium" style:color="var(--color-text)">
                {opportunity.title}
              </h4>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                {customers.find((c) => c.id === opportunity.customer_id)?.name}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm font-medium" style:color="var(--color-primary)">
                  {formatCurrency(opportunity.value)}
                </span>
                <ThemeBadge variant="info">{opportunity.probability}%</ThemeBadge>
              </div>
            </div>
            <div class="text-right">
              <ThemeBadge variant={getStatusColor(opportunity.stage) as any}>
                {getStatusLabel(opportunity.stage)}
              </ThemeBadge>
            </div>
          </div>
        {/each}
      </div>
    </ThemeCard>
  </ThemeGrid>

  <!-- 최근 거래 내역 -->
  <ThemeCard class="p-6">
    <ThemeSectionHeader title="최근 거래 내역" />
    <div class="space-y-3">
      {#each transactions.slice(0, 5) as transaction, i (i)}
        <div
          class="flex items-center justify-between p-3 rounded-lg"
          style:background="var(--color-surface-elevated)"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium" style:color="var(--color-text)">
                {transaction.transaction_number}
              </span>
              <ThemeBadge variant={getStatusColor(transaction.payment_status) as any}>
                {getStatusLabel(transaction.payment_status)}
              </ThemeBadge>
            </div>
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {customers.find((c) => c.id === transaction.customer_id)?.name}
            </p>
            <p class="text-sm" style:color="var(--color-text-secondary)">
              {transaction.description}
            </p>
          </div>
          <div class="text-right">
            <span class="font-semibold" style:color="var(--color-primary)">
              {formatCurrency(transaction.amount)}
            </span>
            <p class="text-xs" style:color="var(--color-text-secondary)">
              {formatDate(transaction.transaction_date)}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </ThemeCard>
</ThemeSpacer>
