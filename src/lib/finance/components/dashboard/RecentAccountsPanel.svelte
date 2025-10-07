<script lang="ts">
  import type { Account } from '$lib/finance/types'
  import { BuildingIcon, CheckCircleIcon, AlertCircleIcon } from '@lucide/svelte'

  interface Props {
    accounts: Account[]
    onNavigate: (tab: string) => void
  }

  let { accounts, onNavigate }: Props = $props()

  // 금액 포맷팅 함수
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  // 계좌번호 포맷팅
  function formatAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber
    return accountNumber.slice(-4).padStart(accountNumber.length, '*')
  }

  // 계좌 상태에 따른 색상
  function getAccountStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'text-green-600 dark:text-green-400',
      inactive: 'text-gray-500 dark:text-gray-500',
      suspended: 'text-yellow-600 dark:text-yellow-400',
      closed: 'text-red-600 dark:text-red-400',
    }
    return colors[status] || 'text-gray-500'
  }

  function getAccountStatusIcon(status: string) {
    return status === 'active' ? CheckCircleIcon : AlertCircleIcon
  }

  function getAccountStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: '정상',
      inactive: '비활성',
      suspended: '일시정지',
      closed: '폐쇄',
    }
    return labels[status] || status
  }

  // 대시보드 태그가 있는 계좌만 필터링
  const dashboardAccounts = $derived(
    accounts
      .filter((account) => account.tags?.some((tag) => tag.tagType === 'dashboard'))
      .slice(0, 5),
  )
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold">주요 계좌</h3>
    <button
      type="button"
      onclick={() => onNavigate('accounts')}
      class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      전체 보기
    </button>
  </div>

  <div class="space-y-3">
    {#each dashboardAccounts as account (account.id)}
      <button
        type="button"
        onclick={() => onNavigate('accounts')}
        class="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- 왼쪽: 계좌 정보 -->
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- 은행 아이콘 -->
            <div
              class="p-2 rounded-lg flex-shrink-0"
              style:background-color="{account.bank?.color}20"
            >
              <BuildingIcon class="w-5 h-5" style="color: {account.bank?.color || '#3B82F6'}" />
            </div>

            <div class="text-left flex-1 min-w-0">
              <!-- 계좌명과 은행명 -->
              <div class="flex items-center gap-2 mb-1">
                <p class="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {account.name}
                </p>
                {#if account.isPrimary}
                  <span
                    class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex-shrink-0"
                  >
                    주계좌
                  </span>
                {/if}
              </div>

              <!-- 은행명과 계좌번호 -->
              <div class="flex items-center gap-2 mb-2">
                {#if account.bank}
                  <span
                    class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded flex-shrink-0"
                    style:background-color="{account.bank.color}20"
                    style:color={account.bank.color}
                  >
                    {account.bank.name}
                  </span>
                {/if}
                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {formatAccountNumber(account.accountNumber)}
                </p>
              </div>

              <!-- 태그 -->
              {#if account.tags && account.tags.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each account.tags.slice(0, 3) as tag}
                    <span
                      class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded"
                      style:background-color="{tag.color}20"
                      style:color={tag.color}
                    >
                      {tag.name}
                    </span>
                  {/each}
                  {#if account.tags.length > 3}
                    <span class="text-xs text-gray-500">+{account.tags.length - 3}</span>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <!-- 오른쪽: 잔액과 상태 -->
          <div class="text-right flex-shrink-0">
            <p
              class="font-bold text-lg {(account.balance || 0) >= 0
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-red-600 dark:text-red-400'}"
            >
              {formatCurrency(account.balance || 0)}
            </p>
            <div class="flex items-center gap-1 mt-1 justify-end">
              {#if account.status}
                {@const StatusIcon = getAccountStatusIcon(account.status)}
                <StatusIcon class="w-4 h-4 {getAccountStatusColor(account.status)}" />
              {/if}
              <p class="text-sm {getAccountStatusColor(account.status)}">
                {getAccountStatusLabel(account.status)}
              </p>
            </div>
          </div>
        </div>
      </button>
    {:else}
      <div class="text-center py-8 text-gray-500 dark:text-gray-500">
        대시보드 태그가 설정된 주요 계좌가 없습니다
      </div>
    {/each}
  </div>
</div>
