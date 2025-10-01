<script lang="ts">
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import type { Contract, Customer, Opportunity, Transaction } from '$lib/sales/types'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import { keyOf } from '$lib/utils/keyOf'
  import { logger } from '$lib/utils/logger'
  import {
    BarChart3Icon,
    BuildingIcon,
    CalendarIcon,
    CreditCardIcon,
    DollarSignIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    PlusIcon,
    TargetIcon,
    TrashIcon,
    TrendingUpIcon,
    UsersIcon,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // 영업관리 데이터 상태
  let salesData = $state<{
    customers: Customer[]
    opportunities: Opportunity[]
    contracts: Contract[]
    transactions: Transaction[]
  }>({
    customers: [],
    opportunities: [],
    contracts: [],
    transactions: [],
  })

  // 모달 상태
  let selectedCustomer = $state<Customer | null>(null)
  let _selectedOpportunity = $state<Opportunity | null>(null)
  let _selectedContract = $state<Contract | null>(null)
  let showCustomerModal = $state(false)
  let _showOpportunityModal = $state(false)
  let _showContractModal = $state(false)
  let showCreateModal = $state(false)
  let showEditModal = $state(false)
  let showDeleteConfirm = $state(false)
  let customerToDelete = $state<Customer | null>(null)
  let editingCustomer = $state<Customer | null>(null)
  let createModalType = $state<'customer' | 'opportunity' | 'contract' | 'transaction'>('customer')

  // 폼 데이터 상태
  let customerFormData = $state<{
    name: string
    business_number: string
    type: 'customer' | 'supplier' | 'both'
    contact_person: string
    contact_phone: string
    contact_email: string
    industry: string
    payment_terms: number
  }>({
    name: '',
    business_number: '',
    type: 'customer',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    industry: '',
    payment_terms: 30,
  })

  let opportunityFormData = $state<{
    title: string
    customer_id: string
    type: 'sales' | 'purchase'
    expected_amount: number
    probability: number
    stage: string
    expected_close_date: string
  }>({
    title: '',
    customer_id: '',
    type: 'sales',
    expected_amount: 0,
    probability: 0,
    stage: 'prospecting',
    expected_close_date: '',
  })

  let contractFormData = $state<{
    title: string
    customer_id: string
    type: 'sales' | 'purchase'
    amount: number
    start_date: string
    end_date: string
  }>({
    title: '',
    customer_id: '',
    type: 'sales',
    amount: 0,
    start_date: '',
    end_date: '',
  })

  let transactionFormData = $state<{
    description: string
    customer_id: string
    type: 'sales' | 'purchase'
    amount: number
    transaction_date: string
    due_date: string
    payment_status: string
  }>({
    description: '',
    customer_id: '',
    type: 'sales',
    amount: 0,
    transaction_date: '',
    due_date: '',
    payment_status: 'pending',
  })

  // 검색 및 필터
  let searchTerm = $state('')
  let selectedType = $state('all')

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '대시보드', icon: BarChart3Icon },
    { id: 'customers', label: '거래처', icon: BuildingIcon },
    { id: 'opportunities', label: '영업기회', icon: TargetIcon },
    { id: 'contracts', label: '계약', icon: FileTextIcon },
    { id: 'transactions', label: '거래내역', icon: DollarSignIcon },
  ]

  let activeTab = $state('overview')

  // 통계 데이터 계산
  const stats = $derived(() => {
    const totalCustomers = salesData.customers.length
    const activeOpportunities = salesData.opportunities.filter(
      (opp) => opp.status === 'active',
    ).length
    const totalSalesValue = salesData.opportunities.reduce((sum, opp) => sum + opp.value, 0)
    const monthlyRevenue = salesData.transactions
      .filter((t) => t.payment_status === 'paid' && t.type === 'sales')
      .reduce((sum, t) => sum + t.amount, 0)
    const _paymentOverdue = salesData.transactions
      .filter((t) => t.payment_status === 'overdue')
      .reduce((sum, t) => sum + t.amount, 0)
    const _conversionRate =
      (salesData.opportunities.filter((opp) => opp.stage === 'closed-won').length /
        Math.max(salesData.opportunities.length, 1)) *
      100

    return [
      {
        title: '총 거래처',
        value: totalCustomers,
        change: '+2',
        changeType: 'positive' as const,
        icon: BuildingIcon,
      },
      {
        title: '진행중인 기회',
        value: activeOpportunities,
        change: '+1',
        changeType: 'positive' as const,
        icon: TargetIcon,
      },
      {
        title: '예상 매출',
        value: formatCurrency(totalSalesValue),
        change: '+15%',
        changeType: 'positive' as const,
        icon: DollarSignIcon,
      },
      {
        title: '월 매출',
        value: formatCurrency(monthlyRevenue),
        change: '+8%',
        changeType: 'positive' as const,
        icon: TrendingUpIcon,
      },
    ]
  })

  // 액션 버튼들 (제거됨)
  const actions: any[] = []

  // 필터링된 데이터
  let filteredCustomers = $derived.by(() => {
    let customers = salesData.customers

    if (searchTerm) {
      customers = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.industry?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedType !== 'all') {
      customers = customers.filter((customer) => customer.type === selectedType)
    }

    return customers
  })

  // 상태별 색상
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      inactive: 'error',
      prospecting: 'info',
      proposal: 'warning',
      negotiation: 'primary',
      'closed-won': 'success',
      'closed-lost': 'error',
      pending: 'warning',
      paid: 'success',
      overdue: 'error',
    }
    return colors[status] || 'default'
  }

  // 상태별 라벨
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '활성',
      inactive: '비활성',
      prospecting: '탐색',
      proposal: '제안',
      negotiation: '협상',
      'closed-won': '성사',
      'closed-lost': '실패',
      pending: '대기',
      paid: '완료',
      overdue: '연체',
    }
    return labels[status] || status
  }

  // 타입별 라벨
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer: '고객',
      supplier: '공급업체',
      both: '고객/공급업체',
      sales: '매출',
      purchase: '매입',
    }
    return labels[type] || type
  }

  // 거래처 보기
  function viewCustomer(customer: Customer) {
    selectedCustomer = customer
    showCustomerModal = true
  }

  // 영업기회 보기
  function viewOpportunity(opportunity: Opportunity) {
    _selectedOpportunity = opportunity
    _showOpportunityModal = true
  }

  // 계약 보기
  function viewContract(contract: Contract) {
    _selectedContract = contract
    _showContractModal = true
  }

  // 거래처 수정
  function editCustomer(customer: Customer) {
    editingCustomer = customer
    customerFormData = {
      name: customer.name,
      business_number: customer.business_number,
      type: customer.type,
      contact_person: customer.contact_person || '',
      contact_phone: customer.contact_phone || '',
      contact_email: customer.contact_email || '',
      industry: customer.industry || '',
      payment_terms: customer.payment_terms || 30,
    }
    showEditModal = true
  }

  // 거래처 삭제 확인
  function confirmDeleteCustomer(customer: Customer) {
    customerToDelete = customer
    showDeleteConfirm = true
  }

  // 거래처 삭제 실행
  function handleDeleteCustomer() {
    if (customerToDelete) {
      const customerId = customerToDelete.id
      salesData.customers = salesData.customers.filter((customer) => customer.id !== customerId)
      showDeleteConfirm = false
      customerToDelete = null
    }
  }

  // 거래처 업데이트
  async function updateCustomer() {
    try {
      // 필수 필드 검증
      if (!customerFormData.name || !customerFormData.business_number) {
        alert('회사명과 사업자번호는 필수입니다.')
        return
      }

      console.log('업데이트할 데이터:', customerFormData)

      if (!editingCustomer) {
        alert('수정할 거래처를 찾을 수 없습니다.')
        return
      }

      const response = await fetch(`/api/sales/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerFormData),
      })

      const result = await response.json()
      console.log('서버 응답:', result)

      if (response.ok) {
        if (result.success) {
          // 목록 새로고침
          await loadCustomers()
          showEditModal = false
          editingCustomer = null
          resetCustomerForm()
          alert('거래처가 성공적으로 수정되었습니다.')
        } else {
          alert(result.error || '거래처 수정에 실패했습니다.')
        }
      } else {
        alert(result.error || '거래처 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('거래처 수정 오류:', error)
      alert('거래처 수정 중 오류가 발생했습니다.')
    }
  }

  // 폼 저장 함수들
  async function saveCustomer() {
    try {
      // 필수 필드 검증
      if (!customerFormData.name || !customerFormData.business_number) {
        alert('회사명과 사업자번호는 필수입니다.')
        return
      }

      console.log('전송할 데이터:', customerFormData)

      const response = await fetch('/api/sales/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerFormData),
      })

      const result = await response.json()
      console.log('서버 응답:', result)

      if (response.ok) {
        if (result.success) {
          // 목록 새로고침
          await loadCustomers()
          showCreateModal = false
          resetCustomerForm()
          alert('거래처가 성공적으로 생성되었습니다.')
        } else {
          alert(result.error || '거래처 저장에 실패했습니다.')
        }
      } else {
        alert(result.error || '거래처 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('거래처 저장 오류:', error)
      alert('거래처 저장 중 오류가 발생했습니다.')
    }
  }

  async function saveOpportunity() {
    try {
      const response = await fetch('/api/sales/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opportunityFormData),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.success) {
          await loadOpportunities()
          showCreateModal = false
          resetOpportunityForm()
          alert('영업기회가 성공적으로 생성되었습니다.')
        } else {
          alert(result.error || '영업기회 저장에 실패했습니다.')
        }
      } else {
        alert(result.error || '영업기회 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('영업기회 저장 오류:', error)
      alert('영업기회 저장 중 오류가 발생했습니다.')
    }
  }

  async function saveContract() {
    try {
      const response = await fetch('/api/sales/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractFormData),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.success) {
          await loadContracts()
          showCreateModal = false
          resetContractForm()
          alert('계약이 성공적으로 생성되었습니다.')
        } else {
          alert(result.error || '계약 저장에 실패했습니다.')
        }
      } else {
        alert(result.error || '계약 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('계약 저장 오류:', error)
      alert('계약 저장 중 오류가 발생했습니다.')
    }
  }

  async function saveTransaction() {
    try {
      const response = await fetch('/api/sales/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionFormData),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.success) {
          await loadTransactions()
          showCreateModal = false
          resetTransactionForm()
          alert('거래가 성공적으로 생성되었습니다.')
        } else {
          alert(result.error || '거래 저장에 실패했습니다.')
        }
      } else {
        alert(result.error || '거래 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('거래 저장 오류:', error)
      alert('거래 저장 중 오류가 발생했습니다.')
    }
  }

  // 폼 리셋 함수들
  function resetCustomerForm() {
    customerFormData = {
      name: '',
      business_number: '',
      type: 'customer',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      industry: '',
      payment_terms: 30,
    }
  }

  function resetOpportunityForm() {
    opportunityFormData = {
      title: '',
      customer_id: '',
      type: 'sales',
      expected_amount: 0,
      probability: 0,
      stage: 'prospecting',
      expected_close_date: '',
    }
  }

  function resetContractForm() {
    contractFormData = {
      title: '',
      customer_id: '',
      type: 'sales',
      amount: 0,
      start_date: '',
      end_date: '',
    }
  }

  function resetTransactionForm() {
    transactionFormData = {
      description: '',
      customer_id: '',
      type: 'sales',
      amount: 0,
      transaction_date: '',
      due_date: '',
      payment_status: 'pending',
    }
  }

  // 저장 함수 선택
  function handleSave() {
    switch (createModalType) {
      case 'customer':
        saveCustomer()
        break
      case 'opportunity':
        saveOpportunity()
        break
      case 'contract':
        saveContract()
        break
      case 'transaction':
        saveTransaction()
        break
    }
  }

  // 데이터 로드 함수들
  async function loadCustomers() {
    try {
      const response = await fetch('/api/sales/customers')
      const result = await response.json()
      console.log('거래처 로드 결과:', result)
      if (result.success) {
        salesData.customers = result.data
        console.log('로드된 거래처 수:', result.data.length)
      }
    } catch (error) {
      console.error('거래처 로드 실패:', error)
    }
  }

  async function loadOpportunities() {
    try {
      const response = await fetch('/api/sales/opportunities')
      const result = await response.json()
      if (result.success) {
        salesData.opportunities = result.data
      }
    } catch (error) {
      console.error('영업기회 로드 실패:', error)
    }
  }

  async function loadContracts() {
    try {
      const response = await fetch('/api/sales/contracts')
      const result = await response.json()
      if (result.success) {
        salesData.contracts = result.data
      }
    } catch (error) {
      console.error('계약 로드 실패:', error)
    }
  }

  async function loadTransactions() {
    try {
      const response = await fetch('/api/sales/transactions')
      const result = await response.json()
      if (result.success) {
        salesData.transactions = result.data
      }
    } catch (error) {
      console.error('거래 내역 로드 실패:', error)
    }
  }

  async function loadAllData() {
    await Promise.all([loadCustomers(), loadOpportunities(), loadContracts(), loadTransactions()])
  }

  onMount(() => {
    logger.log('영업관리 페이지 로드됨')
    loadAllData()
  })
</script>

<PageLayout
  title="영업관리"
  subtitle="거래처 관리, 영업기회 추적, 매출 분석"
  {stats}
  {actions}
  searchPlaceholder="거래처명, 담당자, 업종으로 검색..."
>
  <!-- 탭 시스템 -->
  <ThemeTabs {tabs} bind:activeTab variant="underline" size="md" class="mb-6">
    {#snippet children(tab: { id: string; label: string })}
      {#if tab.id === 'overview'}
        <!-- 대시보드 탭 -->
        <ThemeSpacer size={6}>
          <!-- 핵심 지표 -->
          <ThemeGrid cols={1} lgCols={2} gap={6}>
            <!-- 매출 현황 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="매출 현황" />
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm" style:color="var(--color-text-secondary)">이번 달 매출</span
                  >
                  <span class="font-semibold" style:color="var(--color-success)">
                    {formatCurrency(
                      salesData.transactions
                        .filter((t) => t.type === 'sales' && t.payment_status === 'paid')
                        .reduce((sum, t) => sum + t.amount, 0),
                    )}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm" style:color="var(--color-text-secondary)">미수금</span>
                  <span class="font-semibold" style:color="var(--color-warning)">
                    {formatCurrency(
                      salesData.transactions
                        .filter((t) => t.type === 'sales' && t.payment_status === 'pending')
                        .reduce((sum, t) => sum + t.amount, 0),
                    )}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm" style:color="var(--color-text-secondary)">연체금</span>
                  <span class="font-semibold" style:color="var(--color-error)">
                    {formatCurrency(
                      salesData.transactions
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
                {#each salesData.opportunities.filter((opp) => opp.status === 'active') as opportunity, i (i)}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style:background="var(--color-surface-elevated)"
                  >
                    <div class="flex-1">
                      <h4 class="font-medium" style:color="var(--color-text)">
                        {opportunity.title}
                      </h4>
                      <p class="text-sm" style:color="var(--color-text-secondary)">
                        {salesData.customers.find((c) => c.id === opportunity.customer_id)?.name}
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
              {#each salesData.transactions.slice(0, 5) as transaction, i (i)}
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
                      {salesData.customers.find((c) => c.id === transaction.customer_id)?.name}
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
      {:else if tab.id === 'customers'}
        <!-- 거래처 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">거래처 목록</h3>
              <div class="flex items-center gap-2">
                <select
                  bind:value={selectedType}
                  class="px-3 py-2 border rounded-md text-sm"
                  style:background="var(--color-surface)"
                  style:border-color="var(--color-border)"
                  style:color="var(--color-text)"
                >
                  <option value="all">전체</option>
                  <option value="customer">고객</option>
                  <option value="supplier">공급업체</option>
                  <option value="both">고객/공급업체</option>
                </select>
                <ThemeButton
                  variant="primary"
                  size="sm"
                  onclick={() => {
                    createModalType = 'customer'
                    showCreateModal = true
                  }}
                >
                  <PlusIcon class="w-4 h-4" />
                  거래처 추가
                </ThemeButton>
              </div>
            </div>

            <div class="space-y-4">
              {#each filteredCustomers as customer, i (keyOf(customer, i))}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <BuildingIcon size={20} style="color: var(--color-primary);" />
                      <h4 class="font-medium" style:color="var(--color-text)">{customer.name}</h4>
                      <ThemeBadge variant={getStatusColor(customer.status) as any}>
                        {getStatusLabel(customer.status)}
                      </ThemeBadge>
                      <ThemeBadge variant="info">
                        {getTypeLabel(customer.type)}
                      </ThemeBadge>
                    </div>
                    <div
                      class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
                      style:color="var(--color-text-secondary)"
                    >
                      <div class="flex items-center gap-2">
                        <UsersIcon size={16} />
                        {customer.contact_person}
                      </div>
                      <div class="flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {customer.contact_phone}
                      </div>
                      <div class="flex items-center gap-2">
                        <CreditCardIcon size={16} />
                        {customer.payment_terms}일
                      </div>
                    </div>
                    {#if customer.industry}
                      <p class="text-sm mt-2" style:color="var(--color-text-secondary)">
                        업종: {customer.industry}
                      </p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton variant="ghost" size="sm" onclick={() => viewCustomer(customer)}>
                      <EyeIcon size={16} />
                    </ThemeButton>
                    <ThemeButton variant="ghost" size="sm" onclick={() => editCustomer(customer)}>
                      <EditIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => confirmDeleteCustomer(customer)}
                    >
                      <TrashIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'opportunities'}
        <!-- 영업기회 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">영업 기회</h3>
              <ThemeButton
                variant="success"
                size="sm"
                onclick={() => {
                  createModalType = 'opportunity'
                  showCreateModal = true
                }}
              >
                <TargetIcon class="w-4 h-4" />
                영업기회 추가
              </ThemeButton>
            </div>
            <div class="space-y-4">
              {#each salesData.opportunities as opportunity, i (i)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style:color="var(--color-text)">{opportunity.title}</h4>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {salesData.customers.find((c) => c.id === opportunity.customer_id)?.name}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <ThemeBadge variant={getStatusColor(opportunity.stage) as any}>
                        {getStatusLabel(opportunity.stage)}
                      </ThemeBadge>
                      <span class="text-sm font-medium" style:color="var(--color-primary)">
                        {formatCurrency(opportunity.value)} ({opportunity.probability}%)
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs" style:color="var(--color-text-secondary)">
                      예상 마감: {opportunity.expected_close_date
                        ? formatDate(opportunity.expected_close_date)
                        : '-'}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => viewOpportunity(opportunity)}
                      >
                        <EyeIcon size={16} />
                      </ThemeButton>
                      <ThemeButton variant="ghost" size="sm">
                        <EditIcon size={16} />
                      </ThemeButton>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'contracts'}
        <!-- 계약 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">계약 목록</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                onclick={() => {
                  createModalType = 'contract'
                  showCreateModal = true
                }}
              >
                <FileTextIcon class="w-4 h-4" />
                계약 추가
              </ThemeButton>
            </div>
            <div class="space-y-4">
              {#each salesData.contracts as contract, i (i)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <FileTextIcon size={20} style="color: var(--color-primary);" />
                      <h4 class="font-medium" style:color="var(--color-text)">{contract.title}</h4>
                      <ThemeBadge variant={getStatusColor(contract.status) as any}>
                        {getStatusLabel(contract.status)}
                      </ThemeBadge>
                    </div>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {salesData.customers.find((c) => c.id === contract.customer_id)?.name} • {contract.contract_number}
                    </p>
                    <div
                      class="flex items-center gap-4 mt-1 text-sm"
                      style:color="var(--color-text-secondary)"
                    >
                      <span>총액: {formatCurrency(contract.total_amount)}</span>
                      <span>지급액: {formatCurrency(contract.paid_amount)}</span>
                      <span
                        >잔액: {formatCurrency(contract.total_amount - contract.paid_amount)}</span
                      >
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs" style:color="var(--color-text-secondary)">
                      계약기간: {contract.start_date ? formatDate(contract.start_date) : '-'} ~ {contract.end_date
                        ? formatDate(contract.end_date)
                        : '-'}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                      <ThemeButton variant="ghost" size="sm" onclick={() => viewContract(contract)}>
                        <EyeIcon size={16} />
                      </ThemeButton>
                      <ThemeButton variant="ghost" size="sm">
                        <EditIcon size={16} />
                      </ThemeButton>
                    </div>
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
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">거래 내역</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                onclick={() => {
                  createModalType = 'transaction'
                  showCreateModal = true
                }}
              >
                <DollarSignIcon class="w-4 h-4" />
                거래 추가
              </ThemeButton>
            </div>
            <div class="space-y-4">
              {#each salesData.transactions as transaction, i (i)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <DollarSignIcon size={20} style="color: var(--color-primary);" />
                      <h4 class="font-medium" style:color="var(--color-text)">
                        {transaction.transaction_number}
                      </h4>
                      <ThemeBadge variant={getStatusColor(transaction.payment_status) as any}>
                        {getStatusLabel(transaction.payment_status)}
                      </ThemeBadge>
                      <ThemeBadge variant="info">
                        {getTypeLabel(transaction.type)}
                      </ThemeBadge>
                    </div>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {salesData.customers.find((c) => c.id === transaction.customer_id)?.name}
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
                      거래일: {formatDate(transaction.transaction_date)}
                    </p>
                    {#if transaction.due_date}
                      <p class="text-xs" style:color="var(--color-text-secondary)">
                        만료일: {formatDate(transaction.due_date)}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {/if}
    {/snippet}
  </ThemeTabs>
</PageLayout>

<!-- 거래처 상세 모달 -->
{#if showCustomerModal && selectedCustomer}
  <ThemeModal
    open={showCustomerModal}
    onclose={() => {
      showCustomerModal = false
      selectedCustomer = null
    }}
  >
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">거래처 상세 정보</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">회사명</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">{selectedCustomer.name}</p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">타입</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {getTypeLabel(selectedCustomer.type)}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">담당자</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.contact_person}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">연락처</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.contact_phone}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">이메일</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.contact_email}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">업종</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.industry}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            결제 조건
          </div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.payment_terms}일
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">상태</div>
          <ThemeBadge variant={getStatusColor(selectedCustomer.status) as any}>
            {getStatusLabel(selectedCustomer.status)}
          </ThemeBadge>
        </div>
      </div>
    </div>
  </ThemeModal>
{/if}

<!-- 생성 모달 -->
{#if showCreateModal}
  <ThemeModal
    open={showCreateModal}
    onclose={() => {
      showCreateModal = false
      resetCustomerForm()
      resetOpportunityForm()
      resetContractForm()
      resetTransactionForm()
    }}
  >
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">
        {#if createModalType === 'customer'}새 거래처 추가{:else if createModalType === 'opportunity'}새
          영업기회 추가{:else if createModalType === 'contract'}새 계약 추가{:else}새 거래 내역 추가{/if}
      </h3>

      {#if createModalType === 'customer'}
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >회사명 *</label
          >
          <input
            type="text"
            placeholder="회사명을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.name}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >사업자번호 *</label
          >
          <input
            type="text"
            placeholder="사업자번호를 입력하세요 (예: 123-45-67890)"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.business_number}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >타입 (선택사항)</label
          >
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.type}
          >
            <option value="customer">고객</option>
            <option value="supplier">공급업체</option>
            <option value="both">고객/공급업체</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >담당자 (선택사항)</label
          >
          <input
            type="text"
            placeholder="담당자명을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.contact_person}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >연락처 (선택사항)</label
          >
          <input
            type="text"
            placeholder="연락처를 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.contact_phone}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >이메일 (선택사항)</label
          >
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.contact_email}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
            >업종 (선택사항)</label
          >
          <input
            type="text"
            placeholder="업종을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.industry}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            결제 조건 (선택사항)
          </div>
          <input
            type="number"
            placeholder="결제 조건 (일)"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={customerFormData.payment_terms}
          />
        </div>
      {:else if createModalType === 'opportunity'}
        <ThemeInput
          label="제목"
          placeholder="영업기회 제목을 입력하세요"
          bind:value={opportunityFormData.title}
        />
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">거래처</div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={opportunityFormData.customer_id}
          >
            {#each salesData.customers as customer}
              <option value={customer.id}>{customer.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">타입</div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={opportunityFormData.type}
          >
            <option value="sales">매출</option>
            <option value="purchase">매입</option>
          </select>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            예상 금액
          </div>
          <input
            type="number"
            placeholder="예상 금액을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={opportunityFormData.expected_amount}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            성공 확률 (%)
          </div>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="성공 확률을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={opportunityFormData.probability}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            예상 마감일
          </div>
          <input
            type="date"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={opportunityFormData.expected_close_date}
          />
        </div>
      {:else if createModalType === 'contract'}
        <ThemeInput
          label="계약명"
          placeholder="계약명을 입력하세요"
          bind:value={contractFormData.title}
        />
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">거래처</div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={contractFormData.customer_id}
          >
            {#each salesData.customers as customer}
              <option value={customer.id}>{customer.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">타입</div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={contractFormData.type}
          >
            <option value="sales">매출</option>
            <option value="purchase">매입</option>
          </select>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            계약 금액
          </div>
          <input
            type="number"
            placeholder="계약 금액을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={contractFormData.amount}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            계약 시작일
          </div>
          <input
            type="date"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={contractFormData.start_date}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            계약 종료일
          </div>
          <input
            type="date"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={contractFormData.end_date}
          />
        </div>
      {:else if createModalType === 'transaction'}
        <ThemeInput
          label="거래 설명"
          placeholder="거래 설명을 입력하세요"
          bind:value={transactionFormData.description}
        />
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">거래처</div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={transactionFormData.customer_id}
          >
            {#each salesData.customers as customer}
              <option value={customer.id}>{customer.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            거래 타입
          </div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={transactionFormData.type}
          >
            <option value="sales">매출</option>
            <option value="purchase">매입</option>
          </select>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            거래 금액
          </div>
          <input
            type="number"
            placeholder="거래 금액을 입력하세요"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={transactionFormData.amount}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">거래일</div>
          <input
            type="date"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={transactionFormData.transaction_date}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            만료일 (선택사항)
          </div>
          <input
            type="date"
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={transactionFormData.due_date}
          />
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            결제 상태
          </div>
          <select
            class="w-full px-3 py-2 border rounded-md"
            style:background="var(--color-surface)"
            style:border-color="var(--color-border)"
            style:color="var(--color-text)"
            bind:value={transactionFormData.payment_status}
          >
            <option value="pending">대기</option>
            <option value="paid">완료</option>
            <option value="overdue">연체</option>
          </select>
        </div>
      {/if}
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton variant="secondary" onclick={() => (showCreateModal = false)}>취소</ThemeButton>
      <ThemeButton variant="primary" onclick={handleSave}>저장</ThemeButton>
    </div>
  </ThemeModal>
{/if}

<!-- 거래처 수정 모달 -->
{#if showEditModal && editingCustomer}
  <ThemeModal
    open={showEditModal}
    size="lg"
    onclose={() => {
      showEditModal = false
      editingCustomer = null
      resetCustomerForm()
    }}
  >
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">거래처 수정</h3>

      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >회사명 *</label
        >
        <input
          type="text"
          placeholder="회사명을 입력하세요"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.name}
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >사업자번호 *</label
        >
        <input
          type="text"
          placeholder="사업자번호를 입력하세요 (예: 123-45-67890)"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.business_number}
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >타입 (선택사항)</label
        >
        <select
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.type}
        >
          <option value="customer">고객</option>
          <option value="supplier">공급업체</option>
          <option value="both">고객/공급업체</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >담당자 (선택사항)</label
        >
        <input
          type="text"
          placeholder="담당자명을 입력하세요"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.contact_person}
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >연락처 (선택사항)</label
        >
        <input
          type="text"
          placeholder="연락처를 입력하세요"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.contact_phone}
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >이메일 (선택사항)</label
        >
        <input
          type="email"
          placeholder="이메일을 입력하세요"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.contact_email}
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >업종 (선택사항)</label
        >
        <input
          type="text"
          placeholder="업종을 입력하세요"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.industry}
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)"
          >결제 조건 (선택사항)</label
        >
        <input
          type="number"
          placeholder="결제 조건 (일)"
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
          bind:value={customerFormData.payment_terms}
        />
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton
        variant="secondary"
        onclick={() => {
          showEditModal = false
          editingCustomer = null
          resetCustomerForm()
        }}
      >
        취소
      </ThemeButton>
      <ThemeButton variant="primary" onclick={updateCustomer}>수정</ThemeButton>
    </div>
  </ThemeModal>
{/if}

<!-- 삭제 확인 모달 -->
{#if showDeleteConfirm && customerToDelete}
  <ThemeModal
    open={showDeleteConfirm}
    onclose={() => {
      showDeleteConfirm = false
      customerToDelete = null
    }}
  >
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">거래처 삭제 확인</h3>
      <div class="text-center">
        <div class="mb-4">
          <TrashIcon size={48} class="mx-auto text-red-500" />
        </div>
        <p class="text-lg font-medium mb-2" style:color="var(--color-text)">
          '{customerToDelete.name}' 거래처를 삭제하시겠습니까?
        </p>
        <p class="text-sm" style:color="var(--color-text-secondary)">
          이 작업은 되돌릴 수 없습니다.
        </p>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton
        variant="secondary"
        onclick={() => {
          showDeleteConfirm = false
          customerToDelete = null
        }}
      >
        취소
      </ThemeButton>
      <ThemeButton variant="error" onclick={handleDeleteCustomer}>삭제</ThemeButton>
    </div>
  </ThemeModal>
{/if}
