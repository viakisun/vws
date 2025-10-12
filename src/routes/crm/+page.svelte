<script lang="ts">
  import { uploadCrmDocument } from '$lib/services/s3/s3-crm.service'
  import { pushToast } from '$lib/stores/toasts'
  import type { CRMData } from '$lib/types/crm'
  import { logger } from '$lib/utils/logger'

  import DocumentUploadWithOCR from '$lib/components/crm/DocumentUploadWithOCR.svelte'
  import OCRResultModal from '$lib/components/crm/OCRResultModal.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeInput from '$lib/components/ui/ThemeInput.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import type { BankAccountData, BusinessRegistrationData } from '$lib/services/ocr'
  import { formatCurrency, formatDate } from '$lib/utils/format'
  import { keyOf } from '$lib/utils/keyOf'
  import {
    BarChart3Icon,
    BuildingIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    MailIcon,
    MessageSquareIcon,
    PieChartIcon,
    PlusIcon,
    ScanIcon,
    StarIcon,
    TargetIcon,
    TrashIcon,
    TrendingUpIcon,
    UsersIcon,
    X,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'
  // Import CRM services

  // Real CRM data from API
  const crmData = $state<CRMData>({
    customers: [],
    interactions: [],
    opportunities: [],
    contracts: [],
    transactions: [],
  })

  let selectedCustomer = $state<any>(null)
  let showCustomerModal = $state(false)
  let showCreateModal = $state(false)
  const searchTerm = $state('')
  let selectedStatus = $state('all')

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3Icon },
    { id: 'customers', label: '고객', icon: UsersIcon },
    { id: 'interactions', label: '상호작용', icon: MessageSquareIcon },
    { id: 'opportunities', label: '기회', icon: TargetIcon },
    { id: 'reports', label: '보고서', icon: FileTextIcon },
  ]

  let activeTab = $state('overview')

  // OCR 모달 상태
  let showOcrUploadModal = $state(false)
  let showOcrResultModal = $state(false)
  let ocrBusinessData = $state<BusinessRegistrationData | null>(null)
  let ocrBankData = $state<BankAccountData | null>(null)
  let ocrBusinessFile = $state<File | null>(null)
  let ocrBankFile = $state<File | null>(null)

  // 편집 모달에서 사용할 파일
  let editBusinessFile = $state<File | null>(null)
  let editBankFile = $state<File | null>(null)

  function openOcrUploadModal() {
    showOcrUploadModal = true
  }

  function closeOcrUploadModal() {
    showOcrUploadModal = false
  }

  function handleOcrUploadComplete(data: {
    businessData: BusinessRegistrationData | null
    bankData: BankAccountData | null
    businessFile: File | null
    bankFile: File | null
  }) {
    ocrBusinessData = data.businessData
    ocrBankData = data.bankData
    ocrBusinessFile = data.businessFile
    ocrBankFile = data.bankFile

    showOcrUploadModal = false
    showOcrResultModal = true
  }

  async function handleOcrConfirm(data: {
    businessData: BusinessRegistrationData
    bankData: BankAccountData | null
  }) {
    try {
      // TODO: S3에 파일 업로드하고 URL 받기
      // 지금은 간단히 고객 생성만
      const response = await fetch('/api/crm/customers/from-ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData: data.businessData,
          bankData: data.bankData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '고객 생성 실패')
      }

      const result = await response.json()
      console.log('Customer created:', result.customer)

      // 모달 닫기
      showOcrResultModal = false

      // 성공 메시지 표시
      pushToast('고객이 성공적으로 생성되었습니다!', 'success')

      // 고객 목록 새로고침
      await loadCustomers()
    } catch (error) {
      console.error('Customer creation error:', error)
      pushToast(
        error instanceof Error ? error.message : '고객 생성 중 오류가 발생했습니다',
        'error',
      )
    }
  }

  // 고객 목록 로드
  async function loadCustomers() {
    try {
      const response = await fetch('/api/crm/customers', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('고객 목록을 불러오는데 실패했습니다')
      }

      const data = await response.json()

      crmData.customers = (data.data || []).map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        contact: customer.representative_name || customer.contact_person || '',
        email: customer.contact_email || '',
        phone: customer.contact_phone || '',
        industry: customer.business_type || customer.industry || '',
        status: customer.status || 'active',
        value: 0,
        lastContact: customer.updated_at?.split('T')[0] || '',
        createdAt: customer.created_at?.split('T')[0] || '',
        notes: customer.notes || '',
        businessNumber: customer.business_number || '',
        businessCategory: customer.business_category || '',
        address: customer.address || '',
        establishmentDate: customer.establishment_date || '',
        corporationStatus: customer.corporation_status || false,
        businessEntityType: customer.business_entity_type || 'individual',
        bankName: customer.bank_name || '',
        accountNumber: customer.account_number || '',
        accountHolder: customer.account_holder || '',
        ocrConfidence: customer.ocr_confidence || null,
        businessRegistrationFileUrl: customer.business_registration_file_url || '',
        bankAccountFileUrl: customer.bank_account_file_url || '',
        businessRegistrationS3Key: customer.business_registration_s3_key || '',
        bankAccountS3Key: customer.bank_account_s3_key || '',
      }))

      logger.log(`CRM 페이지 로드됨 - ${crmData.customers.length}명의 고객`)
    } catch (error) {
      console.error('Failed to load customers:', error)
      pushToast('고객 목록을 불러오는데 실패했습니다', 'error')
    }
  }

  // 고객 편집 (상세 정보 가져오기)
  async function editCustomer(customerId: string) {
    try {
      const response = await fetch(`/api/crm/customers/${customerId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('고객 정보를 불러오는데 실패했습니다')
      }

      const result = await response.json()
      const customerData = result.data || result

      selectedCustomer = {
        id: customerData.id,
        name: customerData.name,
        businessNumber: customerData.business_number,
        contact: customerData.contact_person || customerData.representative_name,
        phone: customerData.contact_phone || '',
        email: customerData.contact_email || '',
        industry: customerData.industry || customerData.business_type,
        address: customerData.address || '',
        status: customerData.status,
        businessEntityType: customerData.business_entity_type || 'individual',
        businessCategory: customerData.business_category || '',
        establishmentDate: customerData.establishment_date || '',
        bankName: customerData.bank_name || '',
        accountNumber: customerData.account_number || '',
        accountHolder: customerData.account_holder || '',
        businessRegistrationFileUrl: customerData.business_registration_file_url || null,
        bankAccountFileUrl: customerData.bank_account_file_url || null,
        businessRegistrationS3Key: customerData.business_registration_s3_key || null,
        bankAccountS3Key: customerData.bank_account_s3_key || null,
        notes: customerData.notes || '',
      }

      editBusinessFile = null
      editBankFile = null

      showCreateModal = true
    } catch (error) {
      console.error('Edit customer error:', error)
      pushToast(error instanceof Error ? error.message : '고객 정보를 불러올 수 없습니다', 'error')
    }
  }

  // 고객 저장 (파일 업로드 포함)
  async function handleCustomerSave(customer: any) {
    try {
      let businessRegistrationS3Key = customer.businessRegistrationS3Key
      let bankAccountS3Key = customer.bankAccountS3Key

      // 새로운 파일이 있으면 S3에 업로드
      if (editBusinessFile) {
        const result = await uploadCrmDocument(
          '1001',
          customer.id,
          'business-registration',
          editBusinessFile,
        )

        businessRegistrationS3Key = result.s3Key
        console.log('[CRM] Business registration uploaded:', result.s3Key)
      }

      if (editBankFile) {
        const result = await uploadCrmDocument('1001', customer.id, 'bank-account', editBankFile)

        bankAccountS3Key = result.s3Key
        console.log('[CRM] Bank account uploaded:', result.s3Key)
      }

      // DB 업데이트
      const response = await fetch(`/api/crm/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          business_number: customer.businessNumber,
          type: 'customer',
          contact_person: customer.contact,
          contact_phone: customer.phone,
          contact_email: customer.email,
          address: customer.address,
          industry: customer.industry,
          status: customer.status,
          business_entity_type: customer.businessEntityType,
          representative_name: customer.contact,
          business_type: customer.industry,
          business_category: customer.businessCategory,
          establishment_date: customer.establishmentDate,
          bank_name: customer.bankName,
          account_number: customer.accountNumber,
          account_holder: customer.accountHolder,
          business_registration_s3_key: businessRegistrationS3Key,
          bank_account_s3_key: bankAccountS3Key,
          notes: customer.notes,
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('고객 정보 저장 실패')
      }

      pushToast('고객 정보가 저장되었습니다', 'success')

      editBusinessFile = null
      editBankFile = null

      showCreateModal = false
      selectedCustomer = null

      await loadCustomers()
    } catch (error) {
      console.error('Customer save error:', error)
      pushToast(
        error instanceof Error ? error.message : '고객 정보 저장 중 오류가 발생했습니다',
        'error',
      )
    }
  }

  // 통계 데이터
  const stats = [
    {
      title: '총 고객 수',
      value: crmData.customers.length,
      change: '+8%',
      changeType: 'positive' as const,
      icon: UsersIcon,
    },
    {
      title: '활성 고객',
      value: crmData.customers.filter((c) => c.status === 'active').length,
      change: '+2',
      changeType: 'positive' as const,
      icon: BuildingIcon,
    },
    {
      title: '예상 매출',
      value: formatCurrency(crmData.opportunities.reduce((sum, opp) => sum + opp.value, 0)),
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUpIcon,
    },
    {
      title: '고객 만족도',
      value: '92%',
      change: '+3%',
      changeType: 'positive' as const,
      icon: StarIcon,
    },
  ]

  // 액션 버튼들
  const actions = [
    {
      label: '문서로 고객 추가 (OCR)',
      icon: ScanIcon,
      onclick: openOcrUploadModal,
      variant: 'primary' as const,
    },
    {
      label: '고객 추가',
      icon: PlusIcon,
      onclick: () => (showCreateModal = true),
      variant: 'secondary' as const,
    },
    {
      label: '상호작용 기록',
      icon: MessageSquareIcon,
      onclick: () => logger.log('Record interaction'),
      variant: 'success' as const,
    },
  ]

  // 필터링된 고객 데이터
  const filteredCustomers = $derived.by(() => {
    const list = crmData.customers ?? []

    const term = (searchTerm ?? '').trim().toLowerCase()
    let filtered = list

    if (term) {
      filtered = filtered.filter((customer) => {
        const name = (customer.name ?? '').toLowerCase()
        const contact = (customer.contact ?? '').toLowerCase()
        const industry = (customer.industry ?? '').toLowerCase()
        return name.includes(term) || contact.includes(term) || industry.includes(term)
      })
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === selectedStatus)
    }

    return filtered
  })

  // 상태별 색상
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      inactive: 'error',
      prospect: 'warning',
      churned: 'error',
    }
    return (colors as any)[status] || 'default'
  }

  // 상태별 라벨
  const getStatusLabel = (status: string) => {
    const labels = {
      active: '활성',
      inactive: '비활성',
      prospect: '잠재고객',
      churned: '이탈',
    }
    return (labels as any)[status] || status
  }

  // 상호작용 타입별 색상
  const getInteractionTypeColor = (type: string) => {
    const colors = {
      call: 'primary',
      email: 'info',
      meeting: 'success',
      note: 'warning',
    }
    return (colors as any)[type] || 'default'
  }

  // 상호작용 타입별 라벨
  const getInteractionTypeLabel = (type: string) => {
    const labels = {
      call: '전화',
      email: '이메일',
      meeting: '미팅',
      note: '메모',
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
      'closed-lost': 'error',
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
      'closed-lost': '실패',
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
    crmData.customers = crmData.customers.filter((customer) => customer.id !== customerId)
  }

  onMount(() => {
    loadCustomers()
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
                {#each crmData.interactions as interaction, i (i)}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style:background="var(--color-surface-elevated)"
                  >
                    <div class="flex-1">
                      <h4 class="font-medium" style:color="var(--color-text)">
                        {interaction.subject}
                      </h4>
                      <p class="text-sm" style:color="var(--color-text-secondary)">
                        {interaction.customerName}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <ThemeBadge variant={getInteractionTypeColor(interaction.type)}>
                          {getInteractionTypeLabel(interaction.type)}
                        </ThemeBadge>
                        <span class="text-sm" style:color="var(--color-text-secondary)">
                          {interaction.user}
                        </span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xs" style:color="var(--color-text-secondary)">
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
                {#each crmData.opportunities as opportunity, i (i)}
                  <div
                    class="flex items-center justify-between p-3 rounded-lg"
                    style:background="var(--color-surface-elevated)"
                  >
                    <div class="flex-1">
                      <h4 class="font-medium" style:color="var(--color-text)">
                        {opportunity.title}
                      </h4>
                      <p class="text-sm" style:color="var(--color-text-secondary)">
                        {opportunity.customerName}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <ThemeBadge variant={getStageColor(opportunity.stage)}>
                          {getStageLabel(opportunity.stage)}
                        </ThemeBadge>
                        <span class="text-sm font-medium" style:color="var(--color-primary)">
                          {formatCurrency(opportunity.value)} ({opportunity.probability}%)
                        </span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-xs" style:color="var(--color-text-secondary)">
                        예상 마감: {formatDate(
                          opportunity.expectedClose || opportunity.expected_close_date,
                        )}
                      </p>
                      <p class="text-xs" style:color="var(--color-text-secondary)">
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
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">고객 목록</h3>
              <div class="flex items-center gap-2">
                <select
                  bind:value={selectedStatus}
                  class="px-3 py-2 border rounded-md"
                  style:background="var(--color-surface)"
                  style:border-color="var(--color-border)"
                  style:color="var(--color-text)"
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
              {#each filteredCustomers as customer, i (keyOf(customer, i))}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                      <BuildingIcon size={20} style="color: var(--color-primary);" />
                      <h4 class="font-medium text-lg" style:color="var(--color-text)">
                        {customer.name}
                      </h4>
                      <ThemeBadge variant={getStatusColor(customer.status)}>
                        {getStatusLabel(customer.status)}
                      </ThemeBadge>
                      {#if customer.businessEntityType}
                        <span
                          class="text-xs px-2 py-0.5 rounded-full"
                          style:background="var(--color-surface)"
                          style:color="var(--color-text-secondary)"
                        >
                          {customer.businessEntityType === 'individual'
                            ? '개인'
                            : customer.businessEntityType === 'corporation'
                              ? '법인'
                              : customer.businessEntityType === 'nonprofit'
                                ? '비영리'
                                : customer.businessEntityType === 'public'
                                  ? '공공'
                                  : customer.businessEntityType === 'cooperative'
                                    ? '협동조합'
                                    : customer.businessEntityType === 'foreign'
                                      ? '외국기업'
                                      : customer.businessEntityType}
                        </span>
                      {/if}
                    </div>
                    <div
                      class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"
                      style:color="var(--color-text-secondary)"
                    >
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                          대표자
                        </span>
                        <div class="flex items-center gap-1.5">
                          <UsersIcon size={14} />
                          <span>{customer.contact || '-'}</span>
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                          사업자번호
                        </span>
                        <div class="flex items-center gap-1.5">
                          <FileTextIcon size={14} />
                          <span>{customer.businessNumber || '-'}</span>
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                          연락처
                        </span>
                        <div class="flex items-center gap-1.5">
                          <MailIcon size={14} />
                          <span>{customer.phone || customer.email || '-'}</span>
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                          업종/업태
                        </span>
                        <div class="flex items-center gap-1.5">
                          <BuildingIcon size={14} />
                          <span>
                            {customer.industry || '-'}
                            {#if customer.businessCategory}
                              / {customer.businessCategory}
                            {/if}
                          </span>
                        </div>
                      </div>
                    </div>
                    {#if customer.address}
                      <div class="mt-2 text-sm" style:color="var(--color-text-secondary)">
                        <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                          주소:
                        </span>
                        {customer.address}
                      </div>
                    {/if}
                    {#if customer.bankName || customer.accountNumber}
                      <div class="mt-2 text-sm" style:color="var(--color-text-secondary)">
                        <span class="text-xs font-medium" style:color="var(--color-text-tertiary)">
                          계좌:
                        </span>
                        {customer.bankName || ''}
                        {customer.accountNumber || ''}
                        {#if customer.accountHolder}
                          ({customer.accountHolder})
                        {/if}
                      </div>
                    {/if}
                    <!-- 첨부 파일 (항상 표시) -->
                    <div
                      class="flex items-center gap-3 mt-3 pt-3 border-t"
                      style:border-color="var(--color-border)"
                    >
                      <div class="text-xs font-medium" style:color="var(--color-text-secondary)">
                        첨부파일:
                      </div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <!-- 사업자등록증 -->
                        {#if customer.businessRegistrationS3Key}
                          <a
                            href="#"
                            onclick={(e) => {
                              e.preventDefault()
                              // TODO: 다운로드 함수 호출
                            }}
                            class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                            style:color="var(--color-primary)"
                          >
                            <FileTextIcon size={14} />
                            사업자등록증 ✓
                          </a>
                        {:else}
                          <span
                            class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          >
                            <FileTextIcon size={14} />
                            사업자등록증 (비어있음)
                          </span>
                        {/if}

                        <!-- 통장사본 -->
                        {#if customer.bankAccountS3Key}
                          <a
                            href="#"
                            onclick={(e) => {
                              e.preventDefault()
                              // TODO: 다운로드 함수 호출
                            }}
                            class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                            style:color="var(--color-primary)"
                          >
                            <FileTextIcon size={14} />
                            통장사본 ✓
                          </a>
                        {:else}
                          <span
                            class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          >
                            <FileTextIcon size={14} />
                            통장사본 (비어있음)
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton variant="ghost" size="sm" onclick={() => viewCustomer(customer)}>
                      <EyeIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={async () => {
                        await editCustomer(customer.id)
                      }}
                    >
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
              {#each crmData.interactions as interaction, i (i)}
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style:color="var(--color-text)">
                      {interaction.subject}
                    </h4>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {interaction.customerName} • {interaction.user}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <ThemeBadge variant={getInteractionTypeColor(interaction.type)}>
                        {getInteractionTypeLabel(interaction.type)}
                      </ThemeBadge>
                      <span class="text-sm" style:color="var(--color-text-secondary)">
                        {interaction.description}
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs" style:color="var(--color-text-secondary)">
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
              {#each crmData.opportunities as opportunity, i (i)}
                <div
                  class="flex items-center justify-between p-3 rounded-lg"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style:color="var(--color-text)">
                      {opportunity.title}
                    </h4>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {opportunity.customerName} • {opportunity.owner}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <ThemeBadge variant={getStageColor(opportunity.stage)}>
                        {getStageLabel(opportunity.stage)}
                      </ThemeBadge>
                      <span class="text-sm font-medium" style:color="var(--color-primary)">
                        {formatCurrency(opportunity.value)} ({opportunity.probability}%)
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs" style:color="var(--color-text-secondary)">
                      예상 마감: {formatDate(
                        opportunity.expectedClose || opportunity.expected_close_date,
                      )}
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
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">고객 상세 정보</h3>
      <button
        type="button"
        onclick={() => {
          showCustomerModal = false
          selectedCustomer = null
        }}
        class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        style:color="var(--color-text-secondary)"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">회사명</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.name}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">담당자</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.contact}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">이메일</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.email}
          </p>
        </div>
        <div>
          <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">전화번호</div>
          <p class="text-sm" style:color="var(--color-text-secondary)">
            {selectedCustomer.phone}
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
            고객 가치
          </div>
          <p class="text-sm font-medium" style:color="var(--color-primary)">
            {formatCurrency(selectedCustomer.value)}
          </p>
        </div>
      </div>
      <div>
        <div class="block text-sm font-medium mb-1" style:color="var(--color-text)">메모</div>
        <p class="text-sm" style:color="var(--color-text-secondary)">
          {selectedCustomer.notes}
        </p>
      </div>
    </div>
  </ThemeModal>
{/if}

<!-- 고객 편집 모달 -->
{#if showCreateModal && selectedCustomer}
  <ThemeModal>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold" style:color="var(--color-text)">고객 정보 수정</h3>
      <button
        type="button"
        onclick={() => {
          showCreateModal = false
          selectedCustomer = null
          editBusinessFile = null
          editBankFile = null
        }}
        class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        style:color="var(--color-text-secondary)"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
    <div class="space-y-4">
      <ThemeInput
        label="회사명"
        placeholder="회사명을 입력하세요"
        bind:value={selectedCustomer.name}
      />
      <ThemeInput
        label="사업자번호"
        placeholder="000-00-00000"
        bind:value={selectedCustomer.businessNumber}
      />
      <ThemeInput
        label="담당자명"
        placeholder="담당자명을 입력하세요"
        bind:value={selectedCustomer.contact}
      />
      <ThemeInput
        label="전화번호"
        placeholder="010-0000-0000"
        bind:value={selectedCustomer.phone}
      />
      <ThemeInput
        label="이메일"
        type="email"
        placeholder="email@example.com"
        bind:value={selectedCustomer.email}
      />
      <ThemeInput
        label="주소"
        placeholder="주소를 입력하세요"
        bind:value={selectedCustomer.address}
      />
      <ThemeInput
        label="업종"
        placeholder="업종을 입력하세요"
        bind:value={selectedCustomer.industry}
      />

      <div>
        <label class="block text-sm font-medium mb-1" style:color="var(--color-text)">
          사업자 유형
        </label>
        <select
          bind:value={selectedCustomer.businessEntityType}
          class="w-full px-3 py-2 border rounded-md"
          style:background="var(--color-surface)"
          style:border-color="var(--color-border)"
          style:color="var(--color-text)"
        >
          <option value="individual">개인사업자</option>
          <option value="corporation">법인사업자</option>
          <option value="nonprofit">비영리법인</option>
          <option value="public">공공기관</option>
          <option value="cooperative">협동조합</option>
          <option value="foreign">외국기업</option>
        </select>
      </div>

      <ThemeInput
        label="업태"
        placeholder="업태를 입력하세요"
        bind:value={selectedCustomer.businessCategory}
      />
      <ThemeInput
        label="설립일"
        type="text"
        placeholder="YYYY-MM-DD"
        bind:value={selectedCustomer.establishmentDate}
      />

      <div class="grid grid-cols-3 gap-4">
        <ThemeInput label="은행명" placeholder="은행명" bind:value={selectedCustomer.bankName} />
        <ThemeInput
          label="계좌번호"
          placeholder="계좌번호"
          bind:value={selectedCustomer.accountNumber}
        />
        <ThemeInput
          label="예금주"
          placeholder="예금주"
          bind:value={selectedCustomer.accountHolder}
        />
      </div>

      <!-- 파일 업로드 섹션 -->
      <div class="border-t pt-4" style:border-color="var(--color-border)">
        <div class="flex items-center justify-between mb-3">
          <label class="block text-sm font-medium" style:color="var(--color-text)">
            첨부 파일
          </label>
          {#if !selectedCustomer.businessRegistrationS3Key && !selectedCustomer.bankAccountS3Key}
            <span
              class="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              📎 첨부 파일 없음
            </span>
          {:else if !selectedCustomer.businessRegistrationS3Key || !selectedCustomer.bankAccountS3Key}
            <span
              class="text-xs px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
            >
              ⚠️ 일부 파일 누락
            </span>
          {:else}
            <span
              class="text-xs px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            >
              ✓ 모든 파일 업로드됨
            </span>
          {/if}
        </div>

        <div class="space-y-3">
          <!-- 사업자등록증 -->
          <div
            class="p-4 border rounded-lg"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <FileTextIcon size={16} style="color: var(--color-primary);" />
                <span class="text-sm font-medium" style:color="var(--color-text)">
                  사업자등록증
                </span>
                {#if !selectedCustomer.businessRegistrationS3Key}
                  <span
                    class="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    비어있음
                  </span>
                {:else}
                  <span
                    class="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    ✓ 업로드됨
                  </span>
                {/if}
              </div>
              {#if selectedCustomer.businessRegistrationS3Key}
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick={() => {
                      // TODO: 다운로드 함수 호출
                    }}
                    class="text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    style:color="var(--color-primary)"
                  >
                    다운로드
                  </button>
                  <button
                    type="button"
                    onclick={() => {
                      selectedCustomer.businessRegistrationS3Key = null
                      editBusinessFile = null
                    }}
                    class="text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                  >
                    삭제
                  </button>
                </div>
              {/if}
            </div>

            {#if !selectedCustomer.businessRegistrationS3Key}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onchange={(e) => {
                  const file = e.currentTarget.files?.[0]
                  if (file) {
                    editBusinessFile = file
                  }
                }}
                class="w-full text-sm"
                style:color="var(--color-text)"
              />
              <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
                PDF, JPG, PNG (최대 5MB)
              </p>
            {:else}
              <p class="text-xs" style:color="var(--color-text-secondary)">파일 업로드됨 ✓</p>
            {/if}

            {#if editBusinessFile}
              <p class="text-xs mt-2 text-green-600 dark:text-green-400">
                📎 {editBusinessFile.name} ({(editBusinessFile.size / 1024).toFixed(1)} KB)
              </p>
            {/if}
          </div>

          <!-- 통장사본 -->
          <div
            class="p-4 border rounded-lg"
            style:border-color="var(--color-border)"
            style:background="var(--color-surface)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <FileTextIcon size={16} style="color: var(--color-primary);" />
                <span class="text-sm font-medium" style:color="var(--color-text)">통장사본</span>
                {#if !selectedCustomer.bankAccountS3Key}
                  <span
                    class="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    비어있음
                  </span>
                {:else}
                  <span
                    class="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    ✓ 업로드됨
                  </span>
                {/if}
              </div>
              {#if selectedCustomer.bankAccountS3Key}
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick={() => {
                      // TODO: 다운로드 함수 호출
                    }}
                    class="text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    style:color="var(--color-primary)"
                  >
                    다운로드
                  </button>
                  <button
                    type="button"
                    onclick={() => {
                      selectedCustomer.bankAccountS3Key = null
                      editBankFile = null
                    }}
                    class="text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                  >
                    삭제
                  </button>
                </div>
              {/if}
            </div>

            {#if !selectedCustomer.bankAccountS3Key}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onchange={(e) => {
                  const file = e.currentTarget.files?.[0]
                  if (file) {
                    editBankFile = file
                  }
                }}
                class="w-full text-sm"
                style:color="var(--color-text)"
              />
              <p class="text-xs mt-1" style:color="var(--color-text-secondary)">
                PDF, JPG, PNG (최대 5MB)
              </p>
            {:else}
              <p class="text-xs" style:color="var(--color-text-secondary)">파일 업로드됨 ✓</p>
            {/if}

            {#if editBankFile}
              <p class="text-xs mt-2 text-green-600 dark:text-green-400">
                📎 {editBankFile.name} ({(editBankFile.size / 1024).toFixed(1)} KB)
              </p>
            {/if}
          </div>
        </div>
      </div>

      <ThemeInput
        label="메모"
        placeholder="메모를 입력하세요"
        bind:value={selectedCustomer.notes}
      />
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <ThemeButton
        variant="secondary"
        onclick={() => {
          showCreateModal = false
          selectedCustomer = null
          editBusinessFile = null
          editBankFile = null
        }}>취소</ThemeButton
      >
      <ThemeButton
        variant="primary"
        onclick={async () => {
          if (selectedCustomer) {
            await handleCustomerSave(selectedCustomer)
          }
        }}
      >
        저장
      </ThemeButton>
    </div>
  </ThemeModal>
{/if}

<!-- OCR 업로드 모달 -->
{#if showOcrUploadModal}
  <ThemeModal open={showOcrUploadModal} onclose={closeOcrUploadModal}>
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">문서로 고객 추가</h2>
      <DocumentUploadWithOCR onComplete={handleOcrUploadComplete} onCancel={closeOcrUploadModal} />
    </div>
  </ThemeModal>
{/if}

<!-- OCR 결과 확인 모달 -->
<OCRResultModal
  open={showOcrResultModal}
  businessData={ocrBusinessData}
  bankData={ocrBankData}
  onClose={() => (showOcrResultModal = false)}
  onConfirm={handleOcrConfirm}
/>
