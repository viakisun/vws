import { logger } from '$lib/utils/logger';
<script lang="ts">
  import { onMount } from 'svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    TrendingUpIcon,
    TrendingDownIcon,
    PlusIcon,
    EditIcon,
    FileTextIcon,
    BrainIcon,
    CreditCardIcon,
    PiggyBankIcon,
    ReceiptIcon,
    BarChart3Icon,
    PieChartIcon,
    TargetIcon,
    DollarSignIcon
  } from '@lucide/svelte'

  // 자금일보 데이터
  let fundsReport = $state({
    date: new Date().toISOString().split('T')[0],
    openingBalance: 50000000,
    closingBalance: 52000000,
    dailyInflow: 8000000,
    dailyOutflow: 6000000,
    netFlow: 2000000,
    transactions: [
      {
        id: 'txn-1',
        type: 'inflow',
        category: '매출',
        description: 'ABC 테크놀로지 계약금',
        amount: 5000000,
        time: '09:30',
        account: '주거래계좌'
      },
      {
        id: 'txn-2',
        type: 'outflow',
        category: '급여',
        description: '1월 급여 지급',
        amount: 3000000,
        time: '10:00',
        account: '급여계좌'
      },
      {
        id: 'txn-3',
        type: 'inflow',
        category: '투자',
        description: '투자 수익',
        amount: 2000000,
        time: '14:30',
        account: '투자계좌'
      },
      {
        id: 'txn-4',
        type: 'outflow',
        category: '운영비',
        description: '사무실 임대료',
        amount: 1500000,
        time: '16:00',
        account: '운영계좌'
      }
    ],
    accounts: [
      {
        id: 'acc-1',
        name: '주거래계좌',
        bank: 'KB국민은행',
        balance: 25000000,
        type: 'checking'
      },
      {
        id: 'acc-2',
        name: '급여계좌',
        bank: '신한은행',
        balance: 15000000,
        type: 'checking'
      },
      {
        id: 'acc-3',
        name: '투자계좌',
        bank: '하나은행',
        balance: 12000000,
        type: 'savings'
      }
    ]
  })

  // 탭 정의
  const tabs = [
    {
      id: 'funds-report',
      label: '자금일보',
      icon: FileTextIcon,
      badge: 'NEW'
    },
    {
      id: 'accounts',
      label: '계좌관리',
      icon: CreditCardIcon
    },
    {
      id: 'transactions',
      label: '거래내역',
      icon: ReceiptIcon
    },
    {
      id: 'budget',
      label: '예산관리',
      icon: TargetIcon
    },
    {
      id: 'reports',
      label: '보고서',
      icon: BarChart3Icon
    }
  ]

  let activeTab = $state('funds-report')

  // 통계 데이터
  const stats = [
    {
      title: '현재 잔고',
      value: formatCurrency(fundsReport.closingBalance),
      change: '+4%',
      changeType: 'positive' as const,
      icon: DollarSignIcon
    },
    {
      title: '일일 유입',
      value: formatCurrency(fundsReport.dailyInflow),
      change: '+12%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon
    },
    {
      title: '일일 유출',
      value: formatCurrency(fundsReport.dailyOutflow),
      change: '-3%',
      changeType: 'negative' as const,
      icon: TrendingDownIcon
    },
    {
      title: '순 유입',
      value: formatCurrency(fundsReport.netFlow),
      change: '+25%',
      changeType: 'positive' as const,
      icon: PiggyBankIcon
    }
  ]

  // 액션 버튼들
  const actions = [
    {
      label: '자금일보 생성',
      icon: FileTextIcon,
      onclick: () => generateFundsReport(),
      variant: 'primary' as const
    },
    {
      label: 'AI 분석',
      icon: BrainIcon,
      onclick: () => analyzeWithAI(),
      variant: 'success' as const
    }
  ]

  // 자금일보 생성
  function generateFundsReport() {
    logger.log('자금일보 생성')
  }

  // AI 분석
  function analyzeWithAI() {
    logger.log('AI 분석 실행')
  }

  // 거래 타입별 색상
  const getTransactionTypeColor = (type: string) => {
    return type === 'inflow' ? 'success' : 'error'
  }

  // 거래 타입별 아이콘
  const getTransactionTypeIcon = (type: string) => {
    return type === 'inflow' ? TrendingUpIcon : TrendingDownIcon
  }

  onMount(() => {
    logger.log('Finance 페이지 로드됨')
  })
</script>

<PageLayout
  title="재무관리"
  subtitle="자금일보, 계좌관리, 예산관리"
  {stats}
  {actions}
  searchPlaceholder="거래내역, 계좌명으로 검색..."
>
  <!-- 탭 시스템 -->
  <ThemeTabs
    {tabs}
    bind:activeTab
    variant="underline"
    size="md"
    class="mb-6">
    {#snippet children(tab: any)}
      {#if tab.id === 'funds-report'}
        <!-- 자금일보 탭 -->
        <ThemeSpacer size={6}>
          <!-- 자금일보 헤더 -->
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3
                  class="text-xl font-bold"
                  style:color="var(--color-text)">자금일보</h3>
                <p
                  class="text-sm"
                  style:color="var(--color-text-secondary)">
                  {formatDate(fundsReport.date)} 기준
                </p>
              </div>
              <div class="flex items-center gap-3">
                <input
                  type="date"
                  bind:value={fundsReport.date}
                  class="px-3 py-2 border rounded-md w-auto"
                  style:background="var(--color-surface)"
                  style:border-color="var(--color-border)"
                  style:color="var(--color-text)"
                />
                <ThemeButton
                  variant="primary"
                  size="sm"
                  onclick={generateFundsReport}>
                  <FileTextIcon
                    size={16}
                    class="mr-2" />
                  일보 생성
                </ThemeButton>
              </div>
            </div>

            <!-- 자금 현황 요약 -->
            <ThemeGrid
              cols={1}
              mdCols={4}
              gap={4}>
              <div
                class="p-4 rounded-lg text-center"
                style:background="var(--color-surface-elevated)"
              >
                <p
                  class="text-sm"
                  style:color="var(--color-text-secondary)">시작 잔고</p>
                <p
                  class="text-lg font-bold"
                  style:color="var(--color-text)">
                  {formatCurrency(fundsReport.openingBalance)}
                </p>
              </div>
              <div
                class="p-4 rounded-lg text-center"
                style:background="var(--color-surface-elevated)"
              >
                <p
                  class="text-sm"
                  style:color="var(--color-text-secondary)">일일 유입</p>
                <p
                  class="text-lg font-bold"
                  style:color="var(--color-success)">
                  +{formatCurrency(fundsReport.dailyInflow)}
                </p>
              </div>
              <div
                class="p-4 rounded-lg text-center"
                style:background="var(--color-surface-elevated)"
              >
                <p
                  class="text-sm"
                  style:color="var(--color-text-secondary)">일일 유출</p>
                <p
                  class="text-lg font-bold"
                  style:color="var(--color-error)">
                  -{formatCurrency(fundsReport.dailyOutflow)}
                </p>
              </div>
              <div
                class="p-4 rounded-lg text-center"
                style:background="var(--color-surface-elevated)"
              >
                <p
                  class="text-sm"
                  style:color="var(--color-text-secondary)">종료 잔고</p>
                <p
                  class="text-lg font-bold"
                  style:color="var(--color-primary)">
                  {formatCurrency(fundsReport.closingBalance)}
                </p>
              </div>
            </ThemeGrid>
          </ThemeCard>

          <!-- 계좌별 잔고 -->
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="계좌별 잔고 현황" />
            <ThemeSpacer size={4}>
              {#each fundsReport.accounts as account}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex items-center gap-3">
                    <CreditCardIcon
                      size={20}
                      style="color: var(--color-primary);" />
                    <div>
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">{account.name}</h4>
                      <p
                        class="text-sm"
                        style:color="var(--color-text-secondary)">
                        {account.bank}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p
                      class="text-lg font-bold"
                      style:color="var(--color-text)">
                      {formatCurrency(account.balance)}
                    </p>
                    <ThemeBadge variant={account.type === 'checking' ? 'primary' : 'success'}>
                      {account.type === 'checking' ? '당좌' : '저축'}
                    </ThemeBadge>
                  </div>
                </div>
              {/each}
            </ThemeSpacer>
          </ThemeCard>

          <!-- 일일 거래내역 -->
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="일일 거래내역" />
            <div class="space-y-3">
              {#each fundsReport.transactions as transaction}
                {@const IconComponent = getTransactionTypeIcon(transaction.type)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="p-2 rounded-full"
                      style:background="var(--color-surface)">
                      <IconComponent
                        size={16}
                        style="color: var(--color-primary);" />
                    </div>
                    <div>
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">
                        {transaction.description}
                      </h4>
                      <div
                        class="flex items-center gap-2 text-sm"
                        style:color="var(--color-text-secondary)"
                      >
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{transaction.time}</span>
                        <span>•</span>
                        <span>{transaction.account}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <p
                      class="text-lg font-bold"
                      style:color="var(--color-{getTransactionTypeColor(transaction.type)})"
                    >
                      {transaction.type === 'inflow' ? '+' : '-'}{formatCurrency(
                        transaction.amount
                      )}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>

          <!-- 자금 흐름 차트 -->
          <ThemeGrid
            cols={1}
            lgCols={2}
            gap={6}>
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="자금 흐름 분석" />
              <ThemeChartPlaceholder
                title="일일 자금 흐름"
                icon={BarChart3Icon} />
            </ThemeCard>

            <ThemeCard class="p-6">
              <ThemeSectionHeader title="계좌별 분포" />
              <ThemeChartPlaceholder
                title="계좌별 잔고 분포"
                icon={PieChartIcon} />
            </ThemeCard>
          </ThemeGrid>
        </ThemeSpacer>
      {:else if tab.id === 'accounts'}
        <!-- 계좌관리 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3
                class="text-lg font-semibold"
                style:color="var(--color-text)">계좌 관리</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                class="flex items-center gap-2">
                <PlusIcon size={16} />
                계좌 추가
              </ThemeButton>
            </div>

            <div class="space-y-4">
              {#each fundsReport.accounts as account}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex items-center gap-3">
                    <CreditCardIcon
                      size={20}
                      style="color: var(--color-primary);" />
                    <div>
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">{account.name}</h4>
                      <p
                        class="text-sm"
                        style:color="var(--color-text-secondary)">
                        {account.bank}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-lg font-bold"
                      style:color="var(--color-text)">
                      {formatCurrency(account.balance)}
                    </span>
                    <ThemeButton
                      variant="ghost"
                      size="sm">
                      <EditIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'transactions'}
        <!-- 거래내역 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3
                class="text-lg font-semibold"
                style:color="var(--color-text)">거래내역</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                class="flex items-center gap-2">
                <PlusIcon size={16} />
                거래 추가
              </ThemeButton>
            </div>

            <div class="space-y-4">
              {#each fundsReport.transactions as transaction}
                {@const IconComponent = getTransactionTypeIcon(transaction.type)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="p-2 rounded-full"
                      style:background="var(--color-surface)">
                      <IconComponent
                        size={16}
                        style="color: var(--color-primary);" />
                    </div>
                    <div>
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">
                        {transaction.description}
                      </h4>
                      <p
                        class="text-sm"
                        style:color="var(--color-text-secondary)">
                        {transaction.category} • {transaction.time} • {transaction.account}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-lg font-bold"
                      style:color="var(--color-{getTransactionTypeColor(transaction.type)})"
                    >
                      {transaction.type === 'inflow' ? '+' : '-'}{formatCurrency(
                        transaction.amount
                      )}
                    </span>
                    <ThemeButton
                      variant="ghost"
                      size="sm">
                      <EditIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'budget'}
        <!-- 예산관리 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="예산 관리" />
            <ThemeChartPlaceholder
              title="예산 현황"
              icon={TargetIcon} />
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'reports'}
        <!-- 보고서 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="재무 보고서" />
            <ThemeGrid
              cols={1}
              mdCols={2}
              gap={4}>
              <ThemeButton
                variant="secondary"
                class="flex items-center gap-2 p-4 h-auto">
                <FileTextIcon size={20} />
                <div class="text-left">
                  <div class="font-medium">월간 재무보고서</div>
                  <div class="text-sm opacity-70">월별 수입/지출 분석</div>
                </div>
              </ThemeButton>
              <ThemeButton
                variant="secondary"
                class="flex items-center gap-2 p-4 h-auto">
                <BarChart3Icon size={20} />
                <div class="text-left">
                  <div class="font-medium">자금흐름표</div>
                  <div class="text-sm opacity-70">현금흐름 분석</div>
                </div>
              </ThemeButton>
            </ThemeGrid>
          </ThemeCard>
        </ThemeSpacer>
      {/if}
    {/snippet}
  </ThemeTabs>
</PageLayout>
