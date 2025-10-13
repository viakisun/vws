<script lang="ts">
  import { CrmDocumentType, DEFAULT_COMPANY_CODE } from '$lib/constants/crm'
  import {
    deleteCrmDocument,
    downloadCrmDocument,
    uploadCrmDocument,
  } from '$lib/services/s3/s3-crm.service'
  import { pushToast } from '$lib/stores/toasts'
  import type { CRMContract, CRMData, CRMStats } from '$lib/types/crm'
  import { logger } from '$lib/utils/logger'

  import ContractList from '$lib/components/crm/ContractList.svelte'
  import CustomerFormModal from '$lib/components/crm/CustomerFormModal.svelte'
  import CustomerTable from '$lib/components/crm/CustomerTable.svelte'
  import DocumentUploadWithOCR from '$lib/components/crm/DocumentUploadWithOCR.svelte'
  import OCRResultModal from '$lib/components/crm/OCRResultModal.svelte'
  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeGrid from '$lib/components/ui/ThemeGrid.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import type { BankAccountData, BusinessRegistrationData } from '$lib/services/ocr'
  import { formatCurrency } from '$lib/utils/format'
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
    PlusIcon,
    ScanIcon,
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

  let contracts = $state<CRMContract[]>([])
  let crmStats = $state<CRMStats | null>(null)
  let loadingStats = $state(false)
  let loadingContracts = $state(false)

  let selectedCustomer = $state<any>(null)
  let showCustomerModal = $state(false)
  let showCreateModal = $state(false)
  const searchTerm = $state('')
  let selectedStatus = $state('all')

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3Icon },
    { id: 'customers', label: '고객', icon: UsersIcon },
    { id: 'contracts', label: '계약', icon: FileTextIcon },
    { id: 'interactions', label: '상호작용', icon: MessageSquareIcon },
    { id: 'opportunities', label: '기회', icon: TargetIcon },
  ]

  let activeTab = $state('overview')

  // OCR 모달 상태
  let showOcrUploadModal = $state(false)
  let showOcrResultModal = $state(false)
  let ocrBusinessData = $state<BusinessRegistrationData | null>(null)
  let ocrBankData = $state<BankAccountData | null>(null)
  let ocrBusinessFile = $state<File | null>(null)
  let ocrBankFile = $state<File | null>(null)

  // OCR 중복 확인 모달 상태
  let showOcrDuplicateModal = $state(false)
  let duplicateCustomerId = $state<string | null>(null)
  let duplicateCustomerInfo = $state<{
    name: string
    businessNumber: string
    representativeName: string
  } | null>(null)
  let pendingOcrData = $state<{
    businessData: BusinessRegistrationData
    bankData: BankAccountData | null
  } | null>(null)

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
        // 중복 사업자번호 에러 처리
        if (response.status === 409) {
          const errorData = await response.json()
          // 중복 확인 모달 표시
          duplicateCustomerId = errorData.existingCustomerId
          duplicateCustomerInfo = errorData.existingCustomer
            ? {
                name: errorData.existingCustomer.name,
                businessNumber: errorData.existingCustomer.businessNumber,
                representativeName: errorData.existingCustomer.representativeName,
              }
            : null
          pendingOcrData = data
          showOcrResultModal = false
          showOcrDuplicateModal = true
          return
        }

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

  async function handleOcrUpdateExisting() {
    if (!duplicateCustomerId || !pendingOcrData) {
      pushToast('업데이트할 정보가 없습니다', 'error')
      return
    }

    try {
      const customerId = duplicateCustomerId
      const { businessData, bankData } = pendingOcrData

      // 1. 기존 S3 파일 삭제
      if (ocrBusinessFile) {
        try {
          await deleteCrmDocument(customerId, CrmDocumentType.BUSINESS_REGISTRATION)
          console.log('[OCR] Old business registration deleted')
        } catch (error) {
          // 파일이 없을 수도 있으므로 에러 무시
          console.log('[OCR] No existing business registration to delete or delete failed')
        }
      }

      if (ocrBankFile) {
        try {
          await deleteCrmDocument(customerId, CrmDocumentType.BANK_ACCOUNT)
          console.log('[OCR] Old bank account deleted')
        } catch (error) {
          // 파일이 없을 수도 있으므로 에러 무시
          console.log('[OCR] No existing bank account to delete or delete failed')
        }
      }

      // 2. 새 파일 S3에 업로드
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
        console.log('[OCR] New business registration uploaded:', uploadResult.s3Key)
      }

      if (ocrBankFile) {
        const uploadResult = await uploadCrmDocument(
          DEFAULT_COMPANY_CODE,
          customerId,
          CrmDocumentType.BANK_ACCOUNT,
          ocrBankFile,
        )
        bankAccountS3Key = uploadResult.s3Key
        console.log('[OCR] New bank account uploaded:', uploadResult.s3Key)
      }

      // 3. 고객 정보 업데이트 (모든 필드를 새 OCR 데이터로 덮어쓰기)
      // 데이터베이스 필드 길이 제한을 고려하여 truncate
      const truncate = (str: string | null | undefined, maxLength: number): string | null => {
        if (!str) return null
        return str.length > maxLength ? str.substring(0, maxLength) : str
      }

      const updateResponse = await fetch(`/api/crm/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: truncate(businessData.companyName, 255),
          business_number: truncate(businessData.businessNumber, 50),
          representative_name: truncate(businessData.representativeName, 100),
          address: businessData.businessAddress, // TEXT 타입이므로 제한 없음
          industry: truncate(businessData.businessType, 100),
          business_type: truncate(businessData.businessType, 255),
          business_category: truncate(businessData.businessCategory, 100),
          establishment_date: businessData.establishmentDate,
          corporation_status: businessData.isCorporation,
          bank_name: truncate(bankData?.bankName, 100),
          account_number: truncate(bankData?.accountNumber, 50),
          account_holder: truncate(bankData?.accountHolder, 100),
          business_registration_s3_key: businessRegistrationS3Key,
          bank_account_s3_key: bankAccountS3Key,
          ocr_processed_at: new Date().toISOString(),
          ocr_confidence: Math.round((businessData.confidence + (bankData?.confidence || 0)) / 2),
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('고객 정보 업데이트 실패')
      }

      // 모달 닫기 및 상태 초기화
      showOcrDuplicateModal = false
      duplicateCustomerId = null
      duplicateCustomerInfo = null
      pendingOcrData = null

      // 성공 메시지 표시
      pushToast('기존 고객 정보가 성공적으로 업데이트되었습니다!', 'success')

      // 고객 목록 새로고침
      await loadCustomers()
    } catch (error) {
      console.error('Customer update error:', error)
      pushToast(
        error instanceof Error ? error.message : '고객 정보 업데이트 중 오류가 발생했습니다',
        'error',
      )
    }
  }

  // 통계 로드
  async function loadStats() {
    try {
      loadingStats = true
      const response = await fetch('/api/crm/stats', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('CRM 통계를 불러오는데 실패했습니다')
      }

      const data = await response.json()
      crmStats = data.data
    } catch (error) {
      console.error('Failed to load CRM stats:', error)
      pushToast('CRM 통계를 불러오는데 실패했습니다', 'error')
    } finally {
      loadingStats = false
    }
  }

  // 계약 목록 로드
  async function loadContracts() {
    try {
      loadingContracts = true
      const response = await fetch('/api/crm/contracts', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('계약 목록을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      contracts = data.data || []
    } catch (error) {
      console.error('Failed to load contracts:', error)
      pushToast('계약 목록을 불러오는데 실패했습니다', 'error')
    } finally {
      loadingContracts = false
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

  // 통계 데이터 (개요 탭 아래 카드와 동일한 내용)
  const stats = $derived(() => {
    if (!crmStats) return []

    return [
      {
        title: '총 고객 수',
        value: crmStats.totalCustomers,
        badge: `활성 ${crmStats.activeCustomers}개`,
        icon: UsersIcon,
        color: 'blue' as const,
      },
      {
        title: '활성 계약 총액',
        value: formatCurrency(crmStats.totalRevenueContracts),
        badge: `${crmStats.activeContracts}개 계약`,
        icon: FileTextIcon,
        color: 'green' as const,
      },
      {
        title: '순 계약 가치',
        value: formatCurrency(crmStats.netContractValue),
        badge: '수령 - 지급',
        icon: TrendingUpIcon,
        color: crmStats.netContractValue >= 0 ? ('orange' as const) : ('red' as const),
      },
      {
        title: '진행 중인 기회',
        value: `${crmStats.openOpportunities}건`,
        badge: formatCurrency(crmStats.totalOpportunityAmount),
        icon: TargetIcon,
        color: 'purple' as const,
      },
    ]
  })

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

  // 문서 다운로드
  async function handleDownloadDocument(customerId: string, documentType: CrmDocumentType) {
    try {
      const customer = crmData.customers.find((c) => c.id === customerId)
      if (!customer) {
        pushToast('고객을 찾을 수 없습니다', 'error')
        return
      }

      // S3 키 확인 (문서가 있는지 체크)
      const s3Key =
        documentType === CrmDocumentType.BUSINESS_REGISTRATION
          ? customer.businessRegistrationS3Key
          : customer.bankAccountS3Key
      if (!s3Key) {
        pushToast('다운로드할 문서가 없습니다', 'error')
        return
      }

      const documentTypeName =
        documentType === CrmDocumentType.BUSINESS_REGISTRATION ? '사업자등록증' : '통장사본'

      await downloadCrmDocument(customerId, documentType)
      pushToast(`${documentTypeName} 다운로드가 시작되었습니다`, 'success')
    } catch (error) {
      console.error('Document download error:', error)
      pushToast('문서 다운로드 중 오류가 발생했습니다', 'error')
    }
  }

  // 문서 업로드
  async function handleUploadDocument(customerId: string, documentType: CrmDocumentType) {
    try {
      const customer = crmData.customers.find((c) => c.id === customerId)
      if (!customer) {
        pushToast('고객을 찾을 수 없습니다', 'error')
        return
      }

      // 파일 선택 다이얼로그 열기
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.jpg,.jpeg,.png'
      input.multiple = false

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) return

        try {
          const documentTypeName =
            documentType === CrmDocumentType.BUSINESS_REGISTRATION ? '사업자등록증' : '통장사본'
          pushToast(`${documentTypeName} 업로드 중...`, 'info')

          // S3에 업로드
          const result = await uploadCrmDocument(
            DEFAULT_COMPANY_CODE,
            customerId,
            documentType,
            file,
          )
          const s3Key = result.s3Key

          // 고객 정보 업데이트 (데이터베이스)
          const updateData =
            documentType === CrmDocumentType.BUSINESS_REGISTRATION
              ? { businessRegistrationS3Key: s3Key }
              : { bankAccountS3Key: s3Key }

          const updateResponse = await fetch(`/api/crm/customers/${customerId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updateData),
          })

          if (!updateResponse.ok) {
            throw new Error('고객 정보 업데이트 실패')
          }

          // 로컬 상태 업데이트
          const customerIndex = crmData.customers.findIndex((c) => c.id === customerId)
          if (customerIndex !== -1) {
            if (documentType === CrmDocumentType.BUSINESS_REGISTRATION) {
              crmData.customers[customerIndex].businessRegistrationS3Key = s3Key
            } else {
              crmData.customers[customerIndex].bankAccountS3Key = s3Key
            }
          }

          pushToast(`${documentTypeName} 업로드가 완료되었습니다`, 'success')
        } catch (error) {
          console.error('Document upload error:', error)
          pushToast('문서 업로드 중 오류가 발생했습니다', 'error')
        }
      }

      input.click()
    } catch (error) {
      console.error('Upload handler error:', error)
      pushToast('문서 업로드 처리 중 오류가 발생했습니다', 'error')
    }
  }

  onMount(() => {
    loadCustomers()
    loadStats()
    loadContracts()
  })
</script>

<PageLayout
  title="고객관리 (CRM)"
  subtitle="고객 정보, 상호작용, 기회 관리"
  stats={stats()}
  {actions}
  searchPlaceholder="고객명, 담당자, 업종으로 검색..."
>
  <!-- 탭 시스템 -->
  <ThemeTabs {tabs} bind:activeTab variant="underline" size="md" class="mb-6">
    {#snippet children(tab: any)}
      {#if tab.id === 'overview'}
        <!-- 개요 탭 -->
        <ThemeSpacer size={6}>
          <!-- 계약 현황 및 빠른 통계 -->
          <ThemeGrid cols={1} lgCols={2} gap={6}>
            <!-- 계약 현황 요약 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="계약 현황 요약" />
              <div class="space-y-4 mt-4">
                <div
                  class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">수령 계약</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {contracts.filter(
                        (c) => c.contractType === 'revenue' && c.status === 'active',
                      ).length}건 진행중
                    </p>
                  </div>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(crmStats?.totalRevenueContracts || 0)}
                  </p>
                </div>

                <div
                  class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">지급 예정</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {contracts.filter(
                        (c) => c.contractType === 'expense' && c.status === 'active',
                      ).length}건 진행중
                    </p>
                  </div>
                  <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(crmStats?.totalExpenseContracts || 0)}
                  </p>
                </div>

                <div
                  class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">순 계약 가치</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">수령 - 지급</p>
                  </div>
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(crmStats?.netContractValue || 0)}
                  </p>
                </div>
              </div>
            </ThemeCard>

            <!-- 빠른 통계 -->
            <ThemeCard class="p-6">
              <ThemeSectionHeader title="빠른 통계" />
              <div class="grid grid-cols-2 gap-4 mt-4">
                <div
                  class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">완료된 계약</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {contracts.filter((c) => c.status === 'completed').length}
                  </p>
                </div>

                <div
                  class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">진행 중</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {contracts.filter((c) => c.status === 'active').length}
                  </p>
                </div>

                <div
                  class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">총 고객</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {crmStats?.totalCustomers || 0}
                  </p>
                </div>

                <div
                  class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">활성 고객</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {crmStats?.activeCustomers || 0}
                  </p>
                </div>
              </div>
            </ThemeCard>
          </ThemeGrid>
        </ThemeSpacer>
      {:else if tab.id === 'customers'}
        <!-- 고객 탭 (테이블 뷰) -->
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

            <CustomerTable
              customers={filteredCustomers}
              onEdit={editCustomer}
              onDelete={deleteCustomer}
              onView={viewCustomer}
              onDownloadDocument={handleDownloadDocument}
              onUploadDocument={handleUploadDocument}
            />
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'contracts'}
        <!-- 계약 탭 -->
        <ThemeSpacer size={6}>
          {#if loadingContracts}
            <div class="text-center py-8">
              <div
                class="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"
              ></div>
              <p class="text-sm text-gray-500 mt-2">계약 로딩 중...</p>
            </div>
          {:else}
            <div class="space-y-6">
              <!-- 수령 계약 -->
              <ContractList {contracts} contractType="revenue" title="📄 수령 계약" />

              <!-- 지급 예정 계약 -->
              <ContractList {contracts} contractType="expense" title="💸 지급 예정" />
            </div>
          {/if}
        </ThemeSpacer>
      {:else if tab.id === 'OLD_CUSTOMER_TAB'}
        <!-- 이전 고객 카드 뷰 (삭제 예정) -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
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
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquareIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>상호작용 관리 기능 개발 예정</p>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'opportunities'}
        <!-- 기회 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <ThemeSectionHeader title="영업 기회" />
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
              <TargetIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>영업 기회 관리 기능 개발 예정</p>
            </div>
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

<!-- OCR 중복 확인 모달 -->
{#if showOcrDuplicateModal}
  <ThemeModal open={showOcrDuplicateModal}>
    <div class="p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">사업자번호 중복</h2>
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          이미 등록된 사업자번호입니다. 기존 고객 정보를 새로운 정보로 덮어쓰시겠습니까?
        </p>
        {#if duplicateCustomerInfo}
          <div
            class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
          >
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">기존 고객 정보:</p>
            <div class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p><strong>상호명:</strong> {duplicateCustomerInfo.name}</p>
              <p><strong>사업자번호:</strong> {duplicateCustomerInfo.businessNumber}</p>
              {#if duplicateCustomerInfo.representativeName}
                <p><strong>대표자:</strong> {duplicateCustomerInfo.representativeName}</p>
              {/if}
            </div>
          </div>
        {/if}
        <p class="text-sm text-gray-600 dark:text-gray-400">
          * 모든 고객 정보가 새로운 OCR 데이터로 덮어씌워집니다.<br />
          * 기존 파일은 삭제되고 새 파일로 교체됩니다.
        </p>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <ThemeButton
          variant="secondary"
          onclick={() => {
            showOcrDuplicateModal = false
            duplicateCustomerId = null
            duplicateCustomerInfo = null
            pendingOcrData = null
          }}
        >
          취소
        </ThemeButton>
        <ThemeButton variant="primary" onclick={handleOcrUpdateExisting}>덮어쓰기</ThemeButton>
      </div>
    </div>
  </ThemeModal>
{/if}
