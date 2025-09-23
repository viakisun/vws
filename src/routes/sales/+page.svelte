import { logger } from '$lib/utils/logger';
<script lang="ts">
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import { onMount } from 'svelte'
  // import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'
  import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte'
  // import ThemeActivityItem from '$lib/components/ui/ThemeActivityItem.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  // import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    BarChart3Icon,
    BuildingIcon,
    CalendarIcon,
    DollarSignIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    PieChartIcon,
    PlusIcon,
    TargetIcon,
    TrashIcon,
    TrendingUpIcon,
    UsersIcon
  } from '@lucide/svelte'

  // Mock sales data
  let salesData = $state({
    leads: [
      {
        id: 'lead-1',
        company: 'ABC 테크놀로지',
        contact: '김영희',
        position: 'CTO',
        email: 'kim@abctech.com',
        phone: '02-1234-5678',
        industry: 'IT/소프트웨어',
        status: 'qualified',
        value: 50000000,
        probability: 70,
        source: '웹사이트',
        createdAt: '2024-01-15',
        lastContact: '2024-01-20',
        notes: '스마트팩토리 솔루션에 관심'
      },
      {
        id: 'lead-2',
        company: 'XYZ 제조',
        contact: '박민수',
        position: '대표이사',
        email: 'park@xyz.com',
        phone: '02-9876-5432',
        industry: '제조업',
        status: 'proposal',
        value: 30000000,
        probability: 50,
        source: '추천',
        createdAt: '2024-01-10',
        lastContact: '2024-01-18',
        notes: '자동화 시스템 도입 검토 중'
      }
    ],
    opportunities: [
      {
        id: 'opp-1',
        title: 'ABC 테크놀로지 스마트팩토리',
        company: 'ABC 테크놀로지',
        value: 50000000,
        stage: 'proposal',
        probability: 70,
        expectedClose: '2024-02-15',
        owner: '김영희',
        createdAt: '2024-01-15'
      },
      {
        id: 'opp-2',
        title: 'XYZ 제조 스마트팩토리',
        company: 'XYZ 제조',
        value: 30000000,
        stage: 'negotiation',
        probability: 50,
        expectedClose: '2024-02-28',
        owner: '박민수',
        createdAt: '2024-01-10'
      }
    ],
    deals: [
      {
        id: 'deal-1',
        title: 'DEF 스타트업 핀테크 솔루션',
        company: 'DEF 스타트업',
        value: 15000000,
        stage: 'closed-won',
        closedDate: '2024-01-20',
        owner: '이지은'
      }
    ]
  })

  let selectedLead = $state<any>(null)
  let showLeadModal = $state(false)
  let showCreateModal = $state(false)
  let searchTerm = $state('')
  let selectedStatus = $state('all')

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3Icon },
    { id: 'leads', label: '리드', icon: UsersIcon },
    { id: 'opportunities', label: '기회', icon: TargetIcon },
    { id: 'deals', label: '거래', icon: DollarSignIcon },
    { id: 'reports', label: '보고서', icon: FileTextIcon }
  ]

  let activeTab = $state('overview')

  // 통계 데이터
  const stats = [
    {
      title: '총 리드 수',
      value: salesData.leads.length,
      change: '+12%',
      changeType: 'positive' as const,
      icon: UsersIcon
    },
    {
      title: '진행중인 기회',
      value: salesData.opportunities.length,
      change: '+3',
      changeType: 'positive' as const,
      icon: TargetIcon
    },
    {
      title: '예상 매출',
      value: formatCurrency(salesData.opportunities.reduce((sum, opp) => sum + opp.value, 0)),
      change: '+25%',
      changeType: 'positive' as const,
      icon: DollarSignIcon
    },
    {
      title: '성공률',
      value: '68%',
      change: '+5%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon
    }
  ]

  // 액션 버튼들
  const actions = [
    {
      label: '리드 추가',
      icon: PlusIcon,
      onclick: () => (showCreateModal = true),
      variant: 'primary' as const
    },
    {
      label: '기회 생성',
      icon: TargetIcon,
      onclick: () => logger.log('Create opportunity'),
      variant: 'success' as const
    }
  ]

  // 필터링된 리드 데이터
  let filteredLeads = $derived(() => {
    let leads = salesData.leads

    if (searchTerm) {
      leads = leads.filter(
        (lead: any) =>
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.industry.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedStatus !== 'all') {
      leads = leads.filter((lead: any) => lead.status === selectedStatus)
    }

    return leads
  })

  // 상태별 색상
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'info',
      qualified: 'primary',
      proposal: 'warning',
      negotiation: 'success',
      'closed-won': 'success',
      'closed-lost': 'error'
    }
    return colors[status] || 'default'
  }

  // 상태별 라벨
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: '신규',
      qualified: '검증됨',
      proposal: '제안',
      negotiation: '협상',
      'closed-won': '성사',
      'closed-lost': '실패'
    }
    return labels[status] || status
  }

  // 단계별 색상
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: 'info',
      qualification: 'primary',
      proposal: 'warning',
      negotiation: 'success',
      'closed-won': 'success',
      'closed-lost': 'error'
    }
    return colors[stage] || 'default'
  }

  // 단계별 라벨
  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      prospecting: '탐색',
      qualification: '검증',
      proposal: '제안',
      negotiation: '협상',
      'closed-won': '성사',
      'closed-lost': '실패'
    }
    return labels[stage] || stage
  }

  // 리드 보기
  function viewLead(lead: any) {
    selectedLead = lead
    showLeadModal = true
  }

  // 리드 삭제
  function deleteLead(leadId: string) {
    salesData.leads = salesData.leads.filter(lead => lead.id !== leadId)
  }

  onMount(() => {
    logger.log('Sales 페이지 로드됨')
  })
</script>

<PageLayout
  title="영업관리"
  subtitle="리드 관리, 기회 추적, 매출 분석"
  {stats}
  {actions}
  searchPlaceholder="회사명, 담당자, 업종으로 검색..."
>
  <!-- 탭 시스템 -->
  <ThemeTabs
    {tabs}
    bind:activeTab
    variant="underline"
    size="md"
    class="mb-6">
    {#snippet children(tab: { id: string; label: string })}
      {#if tab.id === 'overview'}
        <!-- 개요 탭 -->
        <ThemeSpacer size={6}>
          <!-- 메인 대시보드 -->
          <ThemeGrid
            cols={1}
            lgCols={2}
            gap={6}>
            <!-- 영업 성과 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="영업 성과" />
              <ThemeChartPlaceholder
                title="월별 매출 추이"
                icon={TrendingUpIcon} />
            </ThemeCard>

            <!-- 리드 현황 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="리드 현황" />
              <ThemeChartPlaceholder
                title="리드 상태별 분포"
                icon={PieChartIcon} />
            </ThemeCard>
          </ThemeGrid>

          <!-- 기회 현황 -->
          <ThemeGrid
            cols={1}
            lgCols={2}
            gap={6}>
            <!-- 진행중인 기회 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="진행중인 기회" />
              <ThemeSpacer size={4}>
                {#each salesData.opportunities as opportunity, i (i)}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style:background="var(--color-surface-elevated)"
                  >
                    <div class="flex-1">
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">
                        {opportunity.title}
                      </h4>
                      <p
                        class="text-sm"
                        style:color="var(--color-text-secondary)">
                        {opportunity.company}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <span
                          class="text-sm font-medium"
                          style:color="var(--color-primary)">
                          {formatCurrency(opportunity.value)}
                        </span>
                        <ThemeBadge variant="info">{opportunity.probability}%</ThemeBadge>
                      </div>
                    </div>
                    <div class="text-right">
                      <p
                        class="text-xs"
                        style:color="var(--color-text-secondary)">
                        예상 마감: {formatDate(opportunity.expectedClose)}
                      </p>
                      <p
                        class="text-xs"
                        style:color="var(--color-text-secondary)">
                        담당: {opportunity.owner}
                      </p>
                    </div>
                  </div>
                {/each}
              </ThemeSpacer>
            </ThemeCard>

            <!-- 최근 성사된 거래 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="최근 성사된 거래" />
              <ThemeSpacer size={4}>
                {#each salesData.deals as deal, i (i)}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style:background="var(--color-surface-elevated)"
                  >
                    <div class="flex-1">
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">{deal.title}</h4>
                      <p
                        class="text-sm"
                        style:color="var(--color-text-secondary)">
                        {deal.company}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <span
                          class="text-sm font-medium"
                          style:color="var(--color-success)">
                          {formatCurrency(deal.value)}
                        </span>
                        <ThemeBadge variant="success">성사</ThemeBadge>
                      </div>
                    </div>
                    <div class="text-right">
                      <p
                        class="text-xs"
                        style:color="var(--color-text-secondary)">
                        성사일: {formatDate(deal.closedDate)}
                      </p>
                      <p
                        class="text-xs"
                        style:color="var(--color-text-secondary)">
                        담당: {deal.owner}
                      </p>
                    </div>
                  </div>
                {/each}
              </ThemeSpacer>
            </ThemeCard>
          </ThemeGrid>
        </ThemeSpacer>
      {:else if tab.id === 'leads'}
        <!-- 리드 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3
                class="text-lg font-semibold"
                style:color="var(--color-text)">리드 목록</h3>
              <div class="flex items-center gap-2">
                <select
                  bind:value={selectedStatus}
                  class="px-3 py-2 border rounded-md text-sm"
                  style:background="var(--color-surface)"
                  style:border-color="var(--color-border)"
                  style:color="var(--color-text)"
                >
                  <option value="all">전체</option>
                  <option value="new">신규</option>
                  <option value="qualified">검증됨</option>
                  <option value="proposal">제안</option>
                  <option value="negotiation">협상</option>
                </select>
              </div>
            </div>

            <div class="space-y-4">
              {#each filteredLeads() as lead}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <BuildingIcon
                        size={20}
                        style="color: var(--color-primary);" />
                      <h4
                        class="font-medium"
                        style:color="var(--color-text)">{lead.company}</h4>
                      <ThemeBadge variant={getStatusColor(lead.status) as any}>
                        {getStatusLabel(lead.status)}
                      </ThemeBadge>
                    </div>
                    <div
                      class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
                      style:color="var(--color-text-secondary)"
                    >
                      <div class="flex items-center gap-2">
                        <UsersIcon size={16} />
                        {lead.contact} ({lead.position})
                      </div>
                      <div class="flex items-center gap-2">
                        <DollarSignIcon size={16} />
                        {formatCurrency(lead.value)} ({lead.probability}%)
                      </div>
                      <div class="flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {formatDate(lead.lastContact)}
                      </div>
                    </div>
                    {#if lead.notes}
                      <p
                        class="text-sm mt-2"
                        style:color="var(--color-text-secondary)">
                        {lead.notes}
                      </p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => viewLead(lead)}>
                      <EyeIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm">
                      <EditIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => deleteLead(lead.id)}>
                      <TrashIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'opportunities'}
        <!-- 기회 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="영업 기회" />
            <ThemeSpacer size={4}>
              {#each salesData.opportunities as opportunity, i (i)}
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4
                      class="font-medium"
                      style:color="var(--color-text)">
                      {opportunity.title}
                    </h4>
                    <p
                      class="text-sm"
                      style:color="var(--color-text-secondary)">
                      {opportunity.company} • {opportunity.owner}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <ThemeBadge variant={getStageColor(opportunity.stage) as any}>
                        {getStageLabel(opportunity.stage)}
                      </ThemeBadge>
                      <span
                        class="text-sm font-medium"
                        style:color="var(--color-primary)">
                        {formatCurrency(opportunity.value)} ({opportunity.probability}%)
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p
                      class="text-xs"
                      style:color="var(--color-text-secondary)">
                      예상 마감: {formatDate(opportunity.expectedClose)}
                    </p>
                  </div>
                </div>
              {/each}
            </ThemeSpacer>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'deals'}
        <!-- 거래 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="최근 거래" />
            <ThemeSpacer size={4}>
              {#each salesData.deals as deal, i (i)}
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4
                      class="font-medium"
                      style:color="var(--color-text)">{deal.title}</h4>
                    <p
                      class="text-sm"
                      style:color="var(--color-text-secondary)">
                      {deal.company} • {deal.owner}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        class="text-sm font-medium"
                        style:color="var(--color-success)">
                        {formatCurrency(deal.value)}
                      </span>
                      <ThemeBadge variant="success">성사</ThemeBadge>
                    </div>
                  </div>
                  <div class="text-right">
                    <p
                      class="text-xs"
                      style:color="var(--color-text-secondary)">
                      성사일: {formatDate(deal.closedDate)}
                    </p>
                    <p
                      class="text-xs"
                      style:color="var(--color-text-secondary)">
                      담당: {deal.owner}
                    </p>
                  </div>
                </div>
              {/each}
            </ThemeSpacer>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'reports'}
        <!-- 보고서 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="영업 보고서" />
            <ThemeGrid
              cols={1}
              mdCols={2}
              gap={4}>
              <ThemeButton
                variant="secondary"
                class="flex items-center gap-2 p-4 h-auto">
                <FileTextIcon size={20} />
                <div class="text-left">
                  <div class="font-medium">월간 영업보고서</div>
                  <div class="text-sm opacity-70">월별 영업 성과 분석</div>
                </div>
              </ThemeButton>
              <ThemeButton
                variant="secondary"
                class="flex items-center gap-2 p-4 h-auto">
                <BarChart3Icon size={20} />
                <div class="text-left">
                  <div class="font-medium">매출 분석</div>
                  <div class="text-sm opacity-70">매출 추이 및 분석</div>
                </div>
              </ThemeButton>
            </ThemeGrid>
          </ThemeCard>
        </ThemeSpacer>
      {/if}
    {/snippet}
  </ThemeTabs>
</PageLayout>

<!-- 리드 상세 모달 -->
{#if showLeadModal && selectedLead}
  <ThemeModal open={showLeadModal}>
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h3
          class="text-lg font-semibold"
          style:color="var(--color-text)">리드 상세 정보</h3>
        <button type="button"
          onclick={() => {
            showLeadModal = false
            selectedLead = null
          }}
          class="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text)">회사명</div>
          <p
            class="text-sm"
            style:color="var(--color-text-secondary)">{selectedLead.company}</p>
        </div>
        <div>
          <div
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text)">담당자</div>
          <p
            class="text-sm"
            style:color="var(--color-text-secondary)">
            {selectedLead.contact} ({selectedLead.position})
          </p>
        </div>
        <div>
          <div
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text)">이메일</div>
          <p
            class="text-sm"
            style:color="var(--color-text-secondary)">{selectedLead.email}</p>
        </div>
        <div>
          <div
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text)">전화번호</div>
          <p
            class="text-sm"
            style:color="var(--color-text-secondary)">{selectedLead.phone}</p>
        </div>
        <div>
          <div
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text)">업종</div>
          <p
            class="text-sm"
            style:color="var(--color-text-secondary)">{selectedLead.industry}</p>
        </div>
        <div>
          <div
            class="block text-sm font-medium mb-1"
            style:color="var(--color-text)">
            예상 매출
          </div>
          <p
            class="text-sm font-medium"
            style:color="var(--color-primary)">
            {formatCurrency(selectedLead.value)}
          </p>
        </div>
      </div>
      <div>
        <div
          class="block text-sm font-medium mb-1"
          style:color="var(--color-text)">메모</div>
        <p
          class="text-sm"
          style:color="var(--color-text-secondary)">{selectedLead.notes}</p>
      </div>
    </div>
  </ThemeModal>
{/if}

<!-- 리드 생성 모달 -->
{#if showCreateModal}
  <ThemeModal open={showCreateModal}>
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h3
          class="text-lg font-semibold"
          style:color="var(--color-text)">새 리드 추가</h3>
        <button type="button"
          onclick={() => (showCreateModal = false)}
          class="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <ThemeInput
        label="회사명"
        placeholder="회사명을 입력하세요" />
      <ThemeInput
        label="담당자명"
        placeholder="담당자명을 입력하세요" />
      <ThemeInput
        label="직책"
        placeholder="직책을 입력하세요" />
      <ThemeInput
        label="이메일"
        type="email"
        placeholder="이메일을 입력하세요" />
      <ThemeInput
        label="전화번호"
        placeholder="전화번호를 입력하세요" />
      <ThemeInput
        label="업종"
        placeholder="업종을 입력하세요" />
      <ThemeInput
        label="예상 매출"
        type="number"
        placeholder="예상 매출을 입력하세요" />
      <ThemeInput
        label="메모"
        placeholder="메모를 입력하세요" />
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton
        variant="secondary"
        onclick={() => (showCreateModal = false)}>취소</ThemeButton>
      <ThemeButton variant="primary">저장</ThemeButton>
    </div>
  </ThemeModal>
{/if}
