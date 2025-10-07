<script lang="ts">
  /**
   * Sales Management Page - Orchestrator
   *
   * Architecture:
   * - useSalesManagement hook: 비즈니스 로직
   * - salesStore: 상태 관리
   * - salesService: API 호출
   * - Components: UI 렌더링
   */

  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import CustomerList from '$lib/sales/components/CustomerList.svelte'
  import SalesDashboard from '$lib/sales/components/SalesDashboard.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { useSalesManagement } from '$lib/sales/hooks/useSalesManagement.svelte'
  import { getStatusColor, getStatusLabel, getTypeLabel } from '$lib/sales/utils/sales-helpers'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import {
    BarChart3Icon,
    BuildingIcon,
    DollarSignIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    TargetIcon,
    TrashIcon,
    TrendingUpIcon,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'

  // ============================================================================
  // Initialize Hook
  // ============================================================================

  const sales = useSalesManagement()
  const { store, filteredCustomers } = sales

  // ============================================================================
  // Tabs Configuration
  // ============================================================================

  const tabs = [
    { id: 'overview', label: '대시보드', icon: BarChart3Icon },
    { id: 'customers', label: '거래처', icon: BuildingIcon },
    { id: 'opportunities', label: '영업기회', icon: TargetIcon },
    { id: 'contracts', label: '계약', icon: FileTextIcon },
    { id: 'transactions', label: '거래내역', icon: DollarSignIcon },
  ]

  let activeTab = $state('overview')

  // ============================================================================
  // Stats Calculation
  // ============================================================================

  const stats = $derived([
    {
      title: '총 거래처',
      value: store.data.customers.length,
      change: '+2',
      changeType: 'positive' as const,
      icon: BuildingIcon,
    },
    {
      title: '진행중인 기회',
      value: store.data.opportunities.filter((opp) => opp.status === 'active').length,
      change: '+1',
      changeType: 'positive' as const,
      icon: TargetIcon,
    },
    {
      title: '예상 매출',
      value: formatCurrency(store.data.opportunities.reduce((sum, opp) => sum + opp.value, 0)),
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSignIcon,
    },
    {
      title: '월 매출',
      value: formatCurrency(
        store.data.transactions
          .filter((t) => t.payment_status === 'paid' && t.type === 'sales')
          .reduce((sum, t) => sum + t.amount, 0),
      ),
      change: '+8%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon,
    },
  ])

  // ============================================================================
  // Lifecycle
  // ============================================================================

  onMount(() => {
    sales.loadAllData()
  })
</script>

<PageLayout
  title="영업관리"
  subtitle="거래처 관리, 영업기회 추적, 매출 분석"
  {stats}
  actions={[]}
  searchPlaceholder="거래처명, 담당자, 업종으로 검색..."
>
  <!-- 탭 시스템 -->
  <ThemeTabs {tabs} bind:activeTab variant="underline" size="md" class="mb-6">
    {#snippet children(tab: { id: string; label: string })}
      {#if tab.id === 'overview'}
        <!-- 대시보드 탭 -->
        <SalesDashboard
          customers={store.data.customers}
          opportunities={store.data.opportunities}
          transactions={store.data.transactions}
          {getStatusColor}
          {getStatusLabel}
        />
      {:else if tab.id === 'customers'}
        <!-- 거래처 탭 -->
        <ThemeSpacer size={6}>
          <CustomerList
            customers={filteredCustomers}
            selectedType={store.filters.selectedType}
            {getStatusColor}
            {getStatusLabel}
            {getTypeLabel}
            onView={(customer) => store.openCustomerModal(customer)}
            onEdit={(customer) => store.openEditModal(customer)}
            onDelete={(customer) => store.openDeleteConfirm(customer)}
            onAdd={() => store.openCreateModal('customer')}
            onTypeChange={(type) => (store.filters.selectedType = type)}
          />
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
                onclick={() => store.openCreateModal('opportunity')}
              >
                <TargetIcon class="w-4 h-4" />
                영업기회 추가
              </ThemeButton>
            </div>
            <div class="space-y-4">
              {#each store.data.opportunities as opportunity, i (i)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style:color="var(--color-text)">{opportunity.title}</h4>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {store.data.customers.find((c) => c.id === opportunity.customer_id)?.name}
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
                        onclick={() => store.openOpportunityModal(opportunity)}
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
                onclick={() => store.openCreateModal('contract')}
              >
                <FileTextIcon class="w-4 h-4" />
                계약 추가
              </ThemeButton>
            </div>
            <div class="space-y-4">
              {#each store.data.contracts as contract, i (i)}
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
                      {store.data.customers.find((c) => c.id === contract.customer_id)?.name} • {contract.contract_number}
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
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => store.openContractModal(contract)}
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
      {:else if tab.id === 'transactions'}
        <!-- 거래내역 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">거래 내역</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                onclick={() => store.openCreateModal('transaction')}
              >
                <DollarSignIcon class="w-4 h-4" />
                거래 추가
              </ThemeButton>
            </div>
            <div class="space-y-4">
              {#each store.data.transactions as transaction, i (i)}
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
                      {store.data.customers.find((c) => c.id === transaction.customer_id)?.name}
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
{#if store.modals.showCustomerModal && store.selected.customer}
  <ThemeModal open={store.modals.showCustomerModal} onclose={() => store.closeCustomerModal()}>
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">거래처 상세 정보</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">회사명</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {store.selected.customer.name}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">타입</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {getTypeLabel(store.selected.customer.type)}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">담당자</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {store.selected.customer.contact_person}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">연락처</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {store.selected.customer.contact_phone}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">이메일</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {store.selected.customer.contact_email}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">업종</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {store.selected.customer.industry}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">
            결제 조건
          </div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {store.selected.customer.payment_terms}일
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">상태</div>
          <ThemeBadge variant={getStatusColor(store.selected.customer.status) as any}>
            {getStatusLabel(store.selected.customer.status)}
          </ThemeBadge>
        </div>
      </div>
    </div>
  </ThemeModal>
{/if}

<!-- 생성/수정 모달은 너무 길어서 별도 컴포넌트로 분리 권장 -->
<!-- 지금은 빠른 진행을 위해 간단하게만 구현 -->
{#if store.modals.showCreateModal}
  <ThemeModal open={store.modals.showCreateModal} onclose={() => store.closeCreateModal()}>
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">
        {#if store.createModalType === 'customer'}새 거래처 추가{:else if store.createModalType === 'opportunity'}새
          영업기회 추가{:else if store.createModalType === 'contract'}새 계약 추가{:else}새 거래
          내역 추가{/if}
      </h3>

      {#if store.createModalType === 'customer'}
        <ThemeInput label="회사명 *" bind:value={store.forms.customer.name} />
        <ThemeInput label="사업자번호 *" bind:value={store.forms.customer.business_number} />
        <ThemeInput label="담당자" bind:value={store.forms.customer.contact_person} />
        <ThemeInput label="연락처" bind:value={store.forms.customer.contact_phone} />
        <ThemeInput label="이메일" bind:value={store.forms.customer.contact_email} />
        <ThemeInput label="업종" bind:value={store.forms.customer.industry} />
      {:else if store.createModalType === 'opportunity'}
        <ThemeInput label="제목" bind:value={store.forms.opportunity.title} />
        <select
          bind:value={store.forms.opportunity.customer_id}
          class="w-full px-3 py-2 border rounded-md"
        >
          {#each store.data.customers as customer}
            <option value={customer.id}>{customer.name}</option>
          {/each}
        </select>
      {:else if store.createModalType === 'contract'}
        <ThemeInput label="계약명" bind:value={store.forms.contract.title} />
        <select
          bind:value={store.forms.contract.customer_id}
          class="w-full px-3 py-2 border rounded-md"
        >
          {#each store.data.customers as customer}
            <option value={customer.id}>{customer.name}</option>
          {/each}
        </select>
      {:else if store.createModalType === 'transaction'}
        <ThemeInput label="거래 설명" bind:value={store.forms.transaction.description} />
        <select
          bind:value={store.forms.transaction.customer_id}
          class="w-full px-3 py-2 border rounded-md"
        >
          {#each store.data.customers as customer}
            <option value={customer.id}>{customer.name}</option>
          {/each}
        </select>
      {/if}
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton variant="secondary" onclick={() => store.closeCreateModal()}>취소</ThemeButton>
      <ThemeButton variant="primary" onclick={sales.handleSave}>저장</ThemeButton>
    </div>
  </ThemeModal>
{/if}

<!-- 수정 모달 -->
{#if store.modals.showEditModal && store.selected.editingCustomer}
  <ThemeModal open={store.modals.showEditModal} size="lg" onclose={() => store.closeEditModal()}>
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">거래처 수정</h3>
      <ThemeInput label="회사명 *" bind:value={store.forms.customer.name} />
      <ThemeInput label="사업자번호 *" bind:value={store.forms.customer.business_number} />
      <ThemeInput label="담당자" bind:value={store.forms.customer.contact_person} />
      <ThemeInput label="연락처" bind:value={store.forms.customer.contact_phone} />
      <ThemeInput label="이메일" bind:value={store.forms.customer.contact_email} />
      <ThemeInput label="업종" bind:value={store.forms.customer.industry} />
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton variant="secondary" onclick={() => store.closeEditModal()}>취소</ThemeButton>
      <ThemeButton variant="primary" onclick={sales.updateCustomer}>수정</ThemeButton>
    </div>
  </ThemeModal>
{/if}

<!-- 삭제 확인 모달 -->
{#if store.modals.showDeleteConfirm && store.selected.customerToDelete}
  <ThemeModal open={store.modals.showDeleteConfirm} onclose={() => store.closeDeleteConfirm()}>
    <div class="space-y-4">
      <h3 class="text-lg font-semibold mb-4" style:color="var(--color-text)">거래처 삭제 확인</h3>
      <div class="text-center">
        <div class="mb-4">
          <TrashIcon size={48} class="mx-auto text-red-500" />
        </div>
        <p class="text-lg font-medium mb-2" style:color="var(--color-text)">
          '{store.selected.customerToDelete.name}' 거래처를 삭제하시겠습니까?
        </p>
        <p class="text-sm" style:color="var(--color-text-secondary)">
          이 작업은 되돌릴 수 없습니다.
        </p>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton variant="secondary" onclick={() => store.closeDeleteConfirm()}>취소</ThemeButton>
      <ThemeButton variant="error" onclick={sales.deleteCustomer}>삭제</ThemeButton>
    </div>
  </ThemeModal>
{/if}
