<script lang="ts">
  import { onMount } from 'svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeStatCard from '$lib/components/ui/ThemeStatCard.svelte'
  import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte'
  import ThemeActivityItem from '$lib/components/ui/ThemeActivityItem.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeDropdown from '$lib/components/ui/ThemeDropdown.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    UsersIcon,
    BuildingIcon,
    X,
    PhoneIcon,
    MailIcon,
    CalendarIcon,
    PlusIcon,
    EyeIcon,
    EditIcon,
    TrashIcon,
    SearchIcon,
    FilterIcon,
    BarChart3Icon,
    FileTextIcon,
    PieChartIcon,
    MessageSquareIcon,
    StarIcon,
    TrendingUpIcon,
    TargetIcon
  } from '@lucide/svelte'

  // Mock CRM data
  let crmData = $state({
    customers: [
      {
        id: 'customer-1',
        name: 'ABC 테크놀로지',
        contact: '김영희',
        email: 'kim@abctech.com',
        phone: '02-1234-5678',
        industry: 'IT/소프트웨어',
        status: 'active',
        value: 50000000,
        lastContact: '2024-01-20',
        createdAt: '2024-01-15',
        notes: '스마트팩토리 솔루션 고객'
      },
      {
        id: 'customer-2',
        name: 'XYZ 제조',
        contact: '박민수',
        email: 'park@xyz.com',
        phone: '02-9876-5432',
        industry: '제조업',
        status: 'active',
        value: 30000000,
        lastContact: '2024-01-18',
        createdAt: '2024-01-10',
        notes: '자동화 시스템 고객'
      }
    ],
    interactions: [
      {
        id: 'interaction-1',
        customerId: 'customer-1',
        customerName: 'ABC 테크놀로지',
        type: 'call',
        subject: '스마트팩토리 솔루션 문의',
        description: '새로운 기능에 대한 문의 및 상담',
        date: '2024-01-20',
        user: '김영희',
        status: 'completed'
      },
      {
        id: 'interaction-2',
        customerId: 'customer-2',
        customerName: 'XYZ 제조',
        type: 'email',
        subject: '자동화 시스템 업그레이드',
        description: '기존 시스템 업그레이드 관련 이메일',
        date: '2024-01-18',
        user: '박민수',
        status: 'completed'
      }
    ],
    opportunities: [
      {
        id: 'opp-1',
        title: 'ABC 테크놀로지 스마트팩토리',
        customerId: 'customer-1',
        customerName: 'ABC 테크놀로지',
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
        customerId: 'customer-2',
        customerName: 'XYZ 제조',
        value: 30000000,
        stage: 'negotiation',
        probability: 50,
        expectedClose: '2024-02-28',
        owner: '박민수',
        createdAt: '2024-01-10'
      }
    ]
  })

  let selectedCustomer = $state<any>(null)
  let showCustomerModal = $state(false)
  let showCreateModal = $state(false)
  let searchTerm = $state('')
  let selectedStatus = $state('all')

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3Icon },
    { id: 'customers', label: '고객', icon: UsersIcon },
    { id: 'interactions', label: '상호작용', icon: MessageSquareIcon },
    { id: 'opportunities', label: '기회', icon: TargetIcon },
    { id: 'reports', label: '보고서', icon: FileTextIcon }
  ]

  let activeTab = $state('overview')

  // 통계 데이터
  const stats = [
    {
      title: '총 고객 수',
      value: crmData.customers.length,
      change: '+8%',
      changeType: 'positive' as const,
      icon: UsersIcon
    },
    {
      title: '활성 고객',
      value: crmData.customers.filter(c => c.status === 'active').length,
      change: '+2',
      changeType: 'positive' as const,
      icon: BuildingIcon
    },
    {
      title: '예상 매출',
      value: formatCurrency(crmData.opportunities.reduce((sum, opp) => sum + opp.value, 0)),
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon
    },
    {
      title: '고객 만족도',
      value: '92%',
      change: '+3%',
      changeType: 'positive' as const,
      icon: StarIcon
    }
  ]

  // 액션 버튼들
  const actions = [
    {
      label: '고객 추가',
      icon: PlusIcon,
      onclick: () => (showCreateModal = true),
      variant: 'primary' as const
    },
    {
      label: '상호작용 기록',
      icon: MessageSquareIcon,
      onclick: () => console.log('Record interaction'),
      variant: 'success' as const
    }
  ]

  // 필터링된 고객 데이터
  let filteredCustomers = $derived(() => {
    let customers = crmData.customers

    if (searchTerm) {
      customers = customers.filter(
        customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.industry.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedStatus !== 'all') {
      customers = customers.filter(customer => customer.status === selectedStatus)
    }

    return customers
  })

  // 상태별 색상
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      inactive: 'error',
      prospect: 'warning',
      churned: 'error'
    }
    return (colors as any)[status] || 'default'
  }

  // 상태별 라벨
  const getStatusLabel = (status: string) => {
    const labels = {
      active: '활성',
      inactive: '비활성',
      prospect: '잠재고객',
      churned: '이탈'
    }
    return (labels as any)[status] || status
  }

  // 상호작용 타입별 색상
  const getInteractionTypeColor = (type: string) => {
    const colors = {
      call: 'primary',
      email: 'info',
      meeting: 'success',
      note: 'warning'
    }
    return (colors as any)[type] || 'default'
  }

  // 상호작용 타입별 라벨
  const getInteractionTypeLabel = (type: string) => {
    const labels = {
      call: '전화',
      email: '이메일',
      meeting: '미팅',
      note: '메모'
    }
    return (labels as any)[type] || type
  }

  // 단계별 색상
  const getStageColor = (stage: string) => {
    const colors = {
      prospecting: 'info',
      qualification: 'primary',
      proposal: 'warning',
      negotiation: 'success',
      'closed-won': 'success',
      'closed-lost': 'error'
    }
    return (colors as any)[stage] || 'default'
  }

  // 단계별 라벨
  const getStageLabel = (stage: string) => {
    const labels = {
      prospecting: '탐색',
      qualification: '검증',
      proposal: '제안',
      negotiation: '협상',
      'closed-won': '성사',
      'closed-lost': '실패'
    }
    return (labels as any)[stage] || stage
  }

  // 고객 보기
  function viewCustomer(customer: any) {
    selectedCustomer = customer
    showCustomerModal = true
  }

  // 고객 삭제
  function deleteCustomer(customerId: string) {
    crmData.customers = crmData.customers.filter(customer => customer.id !== customerId)
  }

  onMount(() => {
    console.log('CRM 페이지 로드됨')
  })
</script>

<PageLayout
  title="고객관리 (CRM)"
  subtitle="고객 정보, 상호작용, 기회 관리"
  {stats}
  {actions}
  searchPlaceholder="고객명, 담당자, 업종으로 검색..."
>
  <!-- 탭 시스템 -->
  <ThemeTabs {tabs} bind:activeTab variant="underline" size="md" class="mb-6">
    {#snippet children(tab: any)}
      {#if tab.id === 'overview'}
        <!-- 개요 탭 -->
        <ThemeSpacer size={6}>
          <!-- 메인 대시보드 -->
          <ThemeGrid cols={1} lgCols={2} gap={6}>
            <!-- 고객 분포 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="고객 분포" />
              <ThemeChartPlaceholder title="고객 상태별 분포" icon={PieChartIcon} />
            </ThemeCard>

            <!-- 상호작용 현황 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="상호작용 현황" />
              <ThemeChartPlaceholder title="월별 상호작용 추이" icon={BarChart3Icon} />
            </ThemeCard>
          </ThemeGrid>

          <!-- 최근 상호작용 -->
          <ThemeGrid cols={1} lgCols={2} gap={6}>
            <!-- 최근 상호작용 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="최근 상호작용" />
              <ThemeSpacer size={4}>
                {#each crmData.interactions as interaction}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style="background: var(--color-surface-elevated);"
                  >
                    <div class="flex-1">
                      <h4 class="font-medium" style="color: var(--color-text);">
                        {interaction.subject}
                      </h4>
                      <p class="text-sm" style="color: var(--color-text-secondary);">
                        {interaction.customerName}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <ThemeBadge variant={getInteractionTypeColor(interaction.type)}>
                          {getInteractionTypeLabel(interaction.type)}
                        </ThemeBadge>
                        <span class="text-sm" style="color: var(--color-text-secondary);">
                          {interaction.user}
                        </span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xs" style="color: var(--color-text-secondary);">
                        {formatDate(interaction.date)}
                      </p>
                    </div>
                  </div>
                {/each}
              </ThemeSpacer>
            </ThemeCard>

            <!-- 진행중인 기회 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="진행중인 기회" />
              <ThemeSpacer size={4}>
                {#each crmData.opportunities as opportunity}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style="background: var(--color-surface-elevated);"
                  >
                    <div class="flex-1">
                      <h4 class="font-medium" style="color: var(--color-text);">
                        {opportunity.title}
                      </h4>
                      <p class="text-sm" style="color: var(--color-text-secondary);">
                        {opportunity.customerName}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <ThemeBadge variant={getStageColor(opportunity.stage)}>
                          {getStageLabel(opportunity.stage)}
                        </ThemeBadge>
                        <span class="text-sm font-medium" style="color: var(--color-primary);">
                          {formatCurrency(opportunity.value)} ({opportunity.probability}%)
                        </span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xs" style="color: var(--color-text-secondary);">
                        예상 마감: {formatDate(opportunity.expectedClose)}
                      </p>
                      <p class="text-xs" style="color: var(--color-text-secondary);">
                        담당: {opportunity.owner}
                      </p>
                    </div>
                  </div>
                {/each}
              </ThemeSpacer>
            </ThemeCard>
          </ThemeGrid>
        </ThemeSpacer>
      {:else if tab.id === 'customers'}
        <!-- 고객 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style="color: var(--color-text);">고객 목록</h3>
              <div class="flex items-center gap-2">
                <select
                  bind:value={selectedStatus}
                  class="px-3 py-2 border rounded-md"
                  style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
                >
                  <option value="all">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="prospect">잠재고객</option>
                  <option value="churned">이탈</option>
                </select>
              </div>
            </div>

            <div class="space-y-4">
              {#each filteredCustomers() as customer}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style="border-color: var(--color-border); background: var(--color-surface-elevated);"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <BuildingIcon size={20} style="color: var(--color-primary);" />
                      <h4 class="font-medium" style="color: var(--color-text);">{customer.name}</h4>
                      <ThemeBadge variant={getStatusColor(customer.status)}>
                        {getStatusLabel(customer.status)}
                      </ThemeBadge>
                    </div>
                    <div
                      class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
                      style="color: var(--color-text-secondary);"
                    >
                      <div class="flex items-center gap-2">
                        <UsersIcon size={16} />
                        {customer.contact}
                      </div>
                      <div class="flex items-center gap-2">
                        <MailIcon size={16} />
                        {customer.email}
                      </div>
                      <div class="flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {formatDate(customer.lastContact)}
                      </div>
                    </div>
                    {#if customer.notes}
                      <p class="text-sm mt-2" style="color: var(--color-text-secondary);">
                        {customer.notes}
                      </p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton variant="ghost" size="sm" onclick={() => viewCustomer(customer)}>
                      <EyeIcon size={16} />
                    </ThemeButton>
                    <ThemeButton variant="ghost" size="sm">
                      <EditIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => deleteCustomer(customer.id)}
                    >
                      <TrashIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'interactions'}
        <!-- 상호작용 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="고객 상호작용" />
            <ThemeSpacer size={4}>
              {#each crmData.interactions as interaction}
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  style="background: var(--color-surface-elevated);"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style="color: var(--color-text);">
                      {interaction.subject}
                    </h4>
                    <p class="text-sm" style="color: var(--color-text-secondary);">
                      {interaction.customerName} • {interaction.user}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <ThemeBadge variant={getInteractionTypeColor(interaction.type)}>
                        {getInteractionTypeLabel(interaction.type)}
                      </ThemeBadge>
                      <span class="text-sm" style="color: var(--color-text-secondary);">
                        {interaction.description}
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs" style="color: var(--color-text-secondary);">
                      {formatDate(interaction.date)}
                    </p>
                  </div>
                </div>
              {/each}
            </ThemeSpacer>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'opportunities'}
        <!-- 기회 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="영업 기회" />
            <ThemeSpacer size={4}>
              {#each crmData.opportunities as opportunity}
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  style="background: var(--color-surface-elevated);"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style="color: var(--color-text);">
                      {opportunity.title}
                    </h4>
                    <p class="text-sm" style="color: var(--color-text-secondary);">
                      {opportunity.customerName} • {opportunity.owner}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <ThemeBadge variant={getStageColor(opportunity.stage)}>
                        {getStageLabel(opportunity.stage)}
                      </ThemeBadge>
                      <span class="text-sm font-medium" style="color: var(--color-primary);">
                        {formatCurrency(opportunity.value)} ({opportunity.probability}%)
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs" style="color: var(--color-text-secondary);">
                      예상 마감: {formatDate(opportunity.expectedClose)}
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
            <ThemeSectionHeader title="CRM 보고서" />
            <ThemeGrid cols={1} mdCols={2} gap={4}>
              <ThemeButton variant="secondary" class="flex items-center gap-2 p-4 h-auto">
                <FileTextIcon size={20} />
                <div class="text-left">
                  <div class="font-medium">고객 분석 보고서</div>
                  <div class="text-sm opacity-70">고객별 상세 분석</div>
                </div>
              </ThemeButton>
              <ThemeButton variant="secondary" class="flex items-center gap-2 p-4 h-auto">
                <BarChart3Icon size={20} />
                <div class="text-left">
                  <div class="font-medium">상호작용 분석</div>
                  <div class="text-sm opacity-70">고객 상호작용 패턴 분석</div>
                </div>
              </ThemeButton>
            </ThemeGrid>
          </ThemeCard>
        </ThemeSpacer>
      {/if}
    {/snippet}
  </ThemeTabs>
</PageLayout>

<!-- 고객 상세 모달 -->
{#if showCustomerModal && selectedCustomer}
  <ThemeModal>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold" style="color: var(--color-text);">고객 상세 정보</h3>
      <button
        onclick={() => {
          showCustomerModal = false
          selectedCustomer = null
        }}
        class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        style="color: var(--color-text-secondary);"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">회사명</div>
          <p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.name}</p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">담당자</div>
          <p class="text-sm" style="color: var(--color-text-secondary);">
            {selectedCustomer.contact}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">이메일</div>
          <p class="text-sm" style="color: var(--color-text-secondary);">
            {selectedCustomer.email}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">
            전화번호
          </div>
          <p class="text-sm" style="color: var(--color-text-secondary);">
            {selectedCustomer.phone}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">업종</div>
          <p class="text-sm" style="color: var(--color-text-secondary);">
            {selectedCustomer.industry}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">
            고객 가치
          </div>
          <p class="text-sm font-medium" style="color: var(--color-primary);">
            {formatCurrency(selectedCustomer.value)}
          </p>
        </div>
      </div>
      <div>
        <div class="block text-sm font-medium mb-1" style="color: var(--color-text);">메모</div>
        <p class="text-sm" style="color: var(--color-text-secondary);">{selectedCustomer.notes}</p>
      </div>
    </div>
  </ThemeModal>
{/if}

<!-- 고객 생성 모달 -->
{#if showCreateModal}
  <ThemeModal>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold" style="color: var(--color-text);">새 고객 추가</h3>
      <button
        onclick={() => (showCreateModal = false)}
        class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        style="color: var(--color-text-secondary);"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
    <div class="space-y-4">
      <ThemeInput label="회사명" placeholder="회사명을 입력하세요" />
      <ThemeInput label="담당자명" placeholder="담당자명을 입력하세요" />
      <ThemeInput label="이메일" type="email" placeholder="이메일을 입력하세요" />
      <ThemeInput label="전화번호" placeholder="전화번호를 입력하세요" />
      <ThemeInput label="업종" placeholder="업종을 입력하세요" />
      <ThemeInput label="고객 가치" type="number" placeholder="고객 가치를 입력하세요" />
      <ThemeInput label="메모" placeholder="메모를 입력하세요" />
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton variant="secondary" onclick={() => (showCreateModal = false)}>취소</ThemeButton>
      <ThemeButton variant="primary">저장</ThemeButton>
    </div>
  </ThemeModal>
{/if}
