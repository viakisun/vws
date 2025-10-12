<script lang="ts">
  import { CrmDocumentType, DEFAULT_COMPANY_CODE } from '$lib/constants/crm'
  import { downloadCrmDocument, uploadCrmDocument } from '$lib/services/s3/s3-crm.service'
  import { pushToast } from '$lib/stores/toasts'
  import type { CRMData } from '$lib/types/crm'
  import { logger } from '$lib/utils/logger'

  import CustomerFormModal from '$lib/components/crm/CustomerFormModal.svelte'
  import DocumentUploadWithOCR from '$lib/components/crm/DocumentUploadWithOCR.svelte'
  import OCRResultModal from '$lib/components/crm/OCRResultModal.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeChartPlaceholder from '$lib/components/ui/ThemeChartPlaceholder.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
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
    ChevronDownIcon,
    ChevronRightIcon,
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

  // 고객 상세 정보 열림/닫힘 상태 (기본: 닫힘)
  let expandedCustomers = $state<Set<string>>(new Set())

  function toggleCustomerDetails(customerId: string) {
    const newSet = new Set(expandedCustomers)
    if (newSet.has(customerId)) {
      newSet.delete(customerId)
    } else {
      newSet.add(customerId)
    }
    expandedCustomers = newSet
  }

  function openNewCustomerModal() {
    selectedCustomer = null // null signals create mode
    showCreateModal = true
  }

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
      // 1. 고객 생성
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
      const customer = result.customer
      const customerId = customer.id
      console.log('Customer created:', customer)

      // 2. S3에 파일 업로드 및 고객 정보 업데이트
      let businessRegistrationS3Key: string | null = null
      let bankAccountS3Key: string | null = null

      if (ocrBusinessFile) {
        const uploadResult = await uploadCrmDocument(
          DEFAULT_COMPANY_CODE,
          customerId,
          CrmDocumentType.BUSINESS_REGISTRATION,
          ocrBusinessFile,
        )
        businessRegistrationS3Key = uploadResult.s3Key
        console.log('[OCR] Business registration uploaded:', uploadResult.s3Key)
      }

      if (ocrBankFile) {
        const uploadResult = await uploadCrmDocument(
          DEFAULT_COMPANY_CODE,
          customerId,
          CrmDocumentType.BANK_ACCOUNT,
          ocrBankFile,
        )
        bankAccountS3Key = uploadResult.s3Key
        console.log('[OCR] Bank account uploaded:', uploadResult.s3Key)
      }

      // 3. 고객 정보 업데이트 (S3 키 저장)
      if (businessRegistrationS3Key || bankAccountS3Key) {
        const updateResponse = await fetch(`/api/crm/customers/${customerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: customer.name,
            business_number: customer.business_number,
            business_registration_s3_key: businessRegistrationS3Key,
            bank_account_s3_key: bankAccountS3Key,
          }),
        })

        if (!updateResponse.ok) {
          console.warn('Failed to update customer with S3 keys, but customer was created')
        } else {
          console.log('[OCR] Customer updated with S3 keys')
        }
      }

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
        representativeName: customer.representative_name || '',
        contactPerson: customer.contact_person || '',
        contactEmail: customer.contact_email || '',
        contactPhone: customer.contact_phone || '',
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '고객 정보를 불러오는데 실패했습니다')
      }

      const result = await response.json()
      const customerData = result.data || result

      selectedCustomer = {
        id: customerData.id,
        name: customerData.name,
        businessNumber: customerData.business_number,
        representativeName: customerData.representative_name || '',
        contactPerson: customerData.contact_person || '',
        contactPhone: customerData.contact_phone || '',
        contactEmail: customerData.contact_email || '',
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

      showCreateModal = true
    } catch (error) {
      console.error('Edit customer error:', error)
      pushToast(error instanceof Error ? error.message : '고객 정보를 불러올 수 없습니다', 'error')
    }
  }

  // 고객 저장 (파일 업로드 포함)
  async function handleCustomerSave(customer: any, files: { business?: File; bank?: File }) {
    try {
      const isEditMode = !!customer.id

      // Step 1: Create customer if new
      let customerId = customer.id
      if (!isEditMode) {
        const createResponse = await fetch('/api/crm/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customer.name,
            business_number: customer.businessNumber,
            type: 'customer',
            representative_name: customer.representativeName,
            contact_person: customer.contactPerson,
            contact_phone: customer.contactPhone,
            contact_email: customer.contactEmail,
            address: customer.address,
            industry: customer.industry,
            status: customer.status || 'active',
            business_entity_type: customer.businessEntityType,
            business_type: customer.industry,
            business_category: customer.businessCategory,
            establishment_date: customer.establishmentDate,
            bank_name: customer.bankName,
            account_number: customer.accountNumber,
            account_holder: customer.accountHolder,
            notes: customer.notes,
          }),
          credentials: 'include',
        })

        if (!createResponse.ok) {
          throw new Error('고객 생성 실패')
        }

        const result = await createResponse.json()
        customerId = result.data.id
      }

      // Step 2: Upload files
      let businessRegistrationS3Key = customer.businessRegistrationS3Key
      let bankAccountS3Key = customer.bankAccountS3Key

      if (files.business) {
        const result = await uploadCrmDocument(
          DEFAULT_COMPANY_CODE,
          customerId,
          CrmDocumentType.BUSINESS_REGISTRATION,
          files.business,
        )
        businessRegistrationS3Key = result.s3Key
      }

      if (files.bank) {
        const result = await uploadCrmDocument(
          DEFAULT_COMPANY_CODE,
          customerId,
          CrmDocumentType.BANK_ACCOUNT,
          files.bank,
        )
        bankAccountS3Key = result.s3Key
      }

      // Step 3: Update if editing or files uploaded
      if (isEditMode || files.business || files.bank) {
        await fetch(`/api/crm/customers/${customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customer.name,
            business_number: customer.businessNumber,
            type: 'customer',
            representative_name: customer.representativeName,
            contact_person: customer.contactPerson,
            contact_phone: customer.contactPhone,
            contact_email: customer.contactEmail,
            address: customer.address,
            industry: customer.industry,
            status: customer.status,
            business_entity_type: customer.businessEntityType,
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
      }

      pushToast(isEditMode ? '고객 정보가 수정되었습니다' : '고객이 등록되었습니다', 'success')

      showCreateModal = false
      selectedCustomer = null
      await loadCustomers()
    } catch (error) {
      console.error('Customer save error:', error)
      pushToast(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다', 'error')
    }
  }

  // 문서 다운로드
  async function handleDownloadDocument(customerId: string, documentType: CrmDocumentType) {
    try {
      await downloadCrmDocument(customerId, documentType)
      pushToast('문서 다운로드를 시작합니다', 'success')
    } catch (error) {
      logger.error('Document download error:', error)
      pushToast(
        error instanceof Error ? error.message : '문서 다운로드 중 오류가 발생했습니다',
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
      onclick: openNewCustomerModal,
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
        const representative = (customer.representativeName ?? '').toLowerCase()
        const contactPerson = (customer.contactPerson ?? '').toLowerCase()
        const industry = (customer.industry ?? '').toLowerCase()
        return (
          name.includes(term) ||
          representative.includes(term) ||
          contactPerson.includes(term) ||
          industry.includes(term)
        )
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
                          <span>{customer.representativeName || '-'}</span>
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
                    </div>

                    <!-- 상세 정보 토글 -->
                    <button
                      type="button"
                      onclick={() => toggleCustomerDetails(customer.id)}
                      class="flex items-center gap-1 mt-2 text-xs hover:opacity-70 transition-opacity"
                      style:color="var(--color-text-tertiary)"
                    >
                      {#if expandedCustomers.has(customer.id)}
                        <ChevronDownIcon size={14} />
                        <span>상세 정보 숨기기</span>
                      {:else}
                        <ChevronRightIcon size={14} />
                        <span>상세 정보 보기</span>
                      {/if}
                    </button>

                    <!-- 접을 수 있는 상세 정보 -->
                    {#if expandedCustomers.has(customer.id)}
                      <div
                        class="mt-2 space-y-2 pt-2 border-t"
                        style:border-color="var(--color-border)"
                      >
                        {#if customer.contactPerson || customer.contactPhone || customer.contactEmail}
                          <div class="flex flex-col gap-1">
                            <span
                              class="text-xs font-medium"
                              style:color="var(--color-text-tertiary)"
                            >
                              담당자
                            </span>
                            <div class="text-sm" style:color="var(--color-text-secondary)">
                              {#if customer.contactPerson}
                                <div class="flex items-center gap-1.5">
                                  <UsersIcon size={14} />
                                  <span>{customer.contactPerson}</span>
                                </div>
                              {/if}
                              {#if customer.contactPhone}
                                <div class="flex items-center gap-1.5 mt-1">
                                  <MailIcon size={14} />
                                  <span>{customer.contactPhone}</span>
                                </div>
                              {/if}
                              {#if customer.contactEmail}
                                <div class="flex items-center gap-1.5 mt-1">
                                  <MailIcon size={14} />
                                  <span>{customer.contactEmail}</span>
                                </div>
                              {/if}
                            </div>
                          </div>
                        {/if}
                        <div class="flex flex-col gap-1">
                          <span
                            class="text-xs font-medium"
                            style:color="var(--color-text-tertiary)"
                          >
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
                        {#if customer.address}
                          <div class="flex flex-col gap-1">
                            <span
                              class="text-xs font-medium"
                              style:color="var(--color-text-tertiary)"
                            >
                              주소
                            </span>
                            <div class="text-sm" style:color="var(--color-text-secondary)">
                              {customer.address}
                            </div>
                          </div>
                        {/if}
                        {#if customer.bankName || customer.accountNumber}
                          <div class="flex flex-col gap-1">
                            <span
                              class="text-xs font-medium"
                              style:color="var(--color-text-tertiary)"
                            >
                              계좌
                            </span>
                            <div class="text-sm" style:color="var(--color-text-secondary)">
                              {customer.bankName || ''}
                              {customer.accountNumber || ''}
                              {#if customer.accountHolder}
                                ({customer.accountHolder})
                              {/if}
                            </div>
                          </div>
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
                          <button
                            type="button"
                            onclick={() =>
                              handleDownloadDocument(
                                customer.id,
                                CrmDocumentType.BUSINESS_REGISTRATION,
                              )}
                            class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                            style:color="var(--color-primary)"
                          >
                            <FileTextIcon size={14} />
                            사업자등록증 ✓
                          </button>
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
                          <button
                            type="button"
                            onclick={() =>
                              handleDownloadDocument(customer.id, CrmDocumentType.BANK_ACCOUNT)}
                            class="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                            style:color="var(--color-primary)"
                          >
                            <FileTextIcon size={14} />
                            통장사본 ✓
                          </button>
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

<!-- 고객 추가/편집 모달 -->
<CustomerFormModal
  open={showCreateModal}
  customer={selectedCustomer}
  onClose={() => {
    showCreateModal = false
    selectedCustomer = null
  }}
  onSave={handleCustomerSave}
/>

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
