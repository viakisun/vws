<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeSectionHeader from '$lib/components/ui/ThemeSectionHeader.svelte'
  import { createContract, deleteContract, updateContract } from '$lib/stores/salary/contract-store'
  import type { CreateSalaryContractRequest, SalaryContract } from '$lib/types/salary-contracts'
  import { formatCurrency, formatDate, formatDateForInput } from '$lib/utils/format'
  import {
    CalendarIcon,
    DollarSignIcon,
    FileTextIcon,
    FilterIcon,
    PencilIcon,
    PlusIcon,
    SearchIcon,
    TrashIcon,
    UserIcon,
  } from '@lucide/svelte'
  import { onMount } from 'svelte'

  onMount(() => {
    updateData()
  })

  // Local types for this component
  type Employee = {
    id?: string
    name?: string
    department?: string
    position?: string
  }

  type Contract = {
    id?: string
    employeeId?: string
    employeeName?: string
    department?: string
    startDate?: string
    endDate?: string
    annualSalary?: number
    monthlySalary?: number
    contractType?: string
    status?: string
    notes?: string
    employeeIdNumber?: string
    createdAt?: string
    updatedAt?: string
  }

  let mounted = $state(false)
  let showCreateModal = $state(false)
  let showEditModal = $state(false)
  let showDeleteModal = $state(false)
  let selectedContract: SalaryContract | null = $state(null)
  let showFilters = $state(false)

  // 폼 데이터
  let formData: CreateSalaryContractRequest = $state({
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0], // 오늘 날짜
    endDate: '',
    annualSalary: 0,
    monthlySalary: 0,
    contractType: 'full_time',
    status: 'active',
    notes: '',
  })

  // 직원 목록
  let employees: Employee[] = $state([])

  // 로컬 계약 데이터
  let localContracts: Contract[] = $state([])
  let localLoading = $state(false)
  let localError: string | null = $state(null)

  // 로컬 필터
  let localFilter = $state({
    status: '',
    contractType: '',
    employeeId: '',
    department: '',
    startDateFrom: '',
  })

  // 로컬 통계 계산 (localContracts가 변경될 때마다 자동 계산)
  let localStats = $derived(
    (() => {
      if (localContracts.length > 0) {
        const activeContracts = localContracts.filter((contract) => contract.status === 'active')
        const totalAnnualSalary = localContracts.reduce(
          (sum, contract) => sum + (contract.annualSalary || 0),
          0,
        )

        return {
          totalContracts: localContracts.length,
          activeContracts: activeContracts.length,
          totalAnnualSalary: totalAnnualSalary,
          averageAnnualSalary:
            localContracts.length > 0 ? Math.round(totalAnnualSalary / localContracts.length) : 0,
        }
      }
      return {
        totalContracts: 0,
        activeContracts: 0,
        totalAnnualSalary: 0,
        averageAnnualSalary: 0,
      }
    })(),
  )

  function updateData() {
    if (!mounted) {
      mounted = true
      void (async () => {
        // 직접 API 호출로 데이터 로드
        try {
          localLoading = true
          localError = null

          // 직접 API 호출
          const response = await fetch('/api/salary/contracts?page=1&limit=20')
          const result = await response.json()

          if (result.success && result.data) {
            localContracts = result.data.data
          } else {
            localError = result.error || '급여 계약 목록을 불러오는데 실패했습니다.'
          }

          await loadEmployees()
        } catch (_error) {
          localError = '알 수 없는 오류가 발생했습니다.'
        } finally {
          localLoading = false
        }
      })()
    }
  }

  // 직원 목록 로드
  async function loadEmployees() {
    try {
      const response = await fetch('/api/employees')
      const result = await response.json()
      if (result.success) {
        employees = result.data.map((emp: any) => ({
          id: emp.id,
          name: `${emp.last_name}${emp.first_name}`,
          department: emp.department || '부서없음',
          position: emp.position || '연구원',
        }))
      }
    } catch (_error) {
      /* intentionally ignored */
    }
  }

  // 계약 유형별 색상
  function getContractTypeColor(type: string): string {
    switch (type) {
      case 'full_time':
        return 'bg-blue-100 text-blue-800'
      case 'part_time':
        return 'bg-green-100 text-green-800'
      case 'contract':
        return 'bg-yellow-100 text-yellow-800'
      case 'intern':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 계약 유형 표시명
  function getContractTypeLabel(type: string): string {
    switch (type) {
      case 'full_time':
        return '정규직'
      case 'part_time':
        return '파트타임'
      case 'contract':
        return '계약직'
      case 'intern':
        return '인턴'
      default:
        return type
    }
  }

  // 상태별 색상
  function getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'terminated':
        return 'bg-gray-100 text-gray-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 상태 표시명
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return '진행중'
      case 'expired':
        return '만료됨'
      case 'terminated':
        return '종료됨'
      case 'draft':
        return '임시저장'
      default:
        return status
    }
  }

  // 새 계약 생성 모달 열기
  function openCreateModal() {
    formData = {
      employeeId: '',
      startDate: '',
      endDate: '',
      annualSalary: 0,
      monthlySalary: 0,
      contractType: 'full_time',
      status: 'active',
      notes: '',
    }
    showCreateModal = true
  }

  // 계약 수정 모달 열기
  function openEditModal(contract: SalaryContract) {
    selectedContract = contract
    formData = {
      employeeId: contract.employeeId,
      startDate: formatDateForInput(contract.startDate),
      endDate: contract.endDate ? formatDateForInput(contract.endDate) : '',
      annualSalary: contract.annualSalary,
      monthlySalary: contract.monthlySalary,
      contractType: contract.contractType,
      status: contract.status,
      notes: contract.notes || '',
    }
    showEditModal = true
  }

  // 계약 삭제 모달 열기
  function openDeleteModal(contract: SalaryContract) {
    selectedContract = contract
    showDeleteModal = true
  }

  // 계약 생성/수정 저장
  async function saveContract() {
    if (
      !formData.employeeId ||
      !formData.startDate ||
      !formData.annualSalary ||
      !formData.monthlySalary
    ) {
      alert('필수 필드를 모두 입력해주세요.')
      return
    }

    // endDate가 빈 문자열인 경우 undefined로 변환하고, 날짜를 한국시간으로 처리
    const submitData = {
      ...formData,
      startDate: formData.startDate + 'T00:00:00+09:00',
      endDate: formData.endDate === '' ? undefined : formData.endDate + 'T00:00:00+09:00',
    }

    let success = false
    if (showCreateModal) {
      success = await createContract(submitData)
    } else if (showEditModal && selectedContract) {
      success = await updateContract(selectedContract.id, submitData)
    }

    if (success) {
      showCreateModal = false
      showEditModal = false
      selectedContract = null
      // 로컬 상태 새로고침
      await refreshLocalData()
    }
  }

  // 로컬 데이터 새로고침
  async function refreshLocalData() {
    try {
      // 계약 목록 새로고침
      const response = await fetch('/api/salary/contracts?page=1&limit=20')
      const result = await response.json()

      if (result.success && result.data) {
        localContracts = result.data.data
      }

      // 통계 새로고침
      const statsResponse = await fetch('/api/salary/contracts/stats')
      const statsResult = await statsResponse.json()

      if (statsResult.success && statsResult.data) {
        localStats = statsResult.data
      }
    } catch (_error) {
      /* 에러는 조용히 처리 */
    }
  }

  // 계약 삭제
  async function confirmDelete() {
    if (selectedContract) {
      const success = await deleteContract(selectedContract.id)
      if (success) {
        showDeleteModal = false
        selectedContract = null
        await refreshLocalData()
      }
    }
  }

  // 필터 적용
  function applyFilter() {
    // 로컬 필터링 로직 (필요시 구현)
  }

  // 필터 초기화
  function clearFilters() {
    localFilter = {
      status: '',
      contractType: '',
      employeeId: '',
      department: '',
      startDateFrom: '',
    }
  }

  // 월급 자동 계산 (연봉 변경 시)
  function calculateMonthlySalary() {
    if (formData.annualSalary > 0) {
      formData.monthlySalary = Math.round(formData.annualSalary / 12)
    }
  }

  // 연봉 자동 계산 (월급 변경 시)
  function calculateAnnualSalary() {
    if (formData.monthlySalary > 0) {
      formData.annualSalary = formData.monthlySalary * 12
    }
  }

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    // 초기화 함수들 호출
  })
</script>

<div class="space-y-6">
  <!-- 통계 카드들 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <ThemeCard class="p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-full">
          <FileTextIcon size={24} class="text-blue-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">총 계약 수</p>
          <p class="text-2xl font-bold text-gray-900">
            {localStats.totalContracts}개
          </p>
        </div>
      </div>
    </ThemeCard>

    <ThemeCard class="p-6">
      <div class="flex items-center">
        <div class="p-3 bg-green-100 rounded-full">
          <UserIcon size={24} class="text-green-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">진행중 계약</p>
          <p class="text-2xl font-bold text-gray-900">
            {localStats.activeContracts}개
          </p>
        </div>
      </div>
    </ThemeCard>

    <ThemeCard class="p-6">
      <div class="flex items-center">
        <div class="p-3 bg-purple-100 rounded-full">
          <DollarSignIcon size={24} class="text-purple-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">평균 연봉</p>
          <p class="text-2xl font-bold text-gray-900">
            {formatCurrency(localStats.averageAnnualSalary)}
          </p>
        </div>
      </div>
    </ThemeCard>

    <ThemeCard class="p-6">
      <div class="flex items-center">
        <div class="p-3 bg-yellow-100 rounded-full">
          <CalendarIcon size={24} class="text-yellow-600" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">총 급여</p>
          <p class="text-2xl font-bold text-gray-900">
            {formatCurrency(localStats.totalAnnualSalary)}
          </p>
        </div>
      </div>
    </ThemeCard>
  </div>

  <!-- 필터 및 액션 바 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <ThemeSectionHeader title="급여 계약 목록" />
      <div class="flex items-center space-x-3">
        <ThemeButton variant="secondary" size="sm" onclick={() => (showFilters = !showFilters)}>
          <FilterIcon size={16} class="mr-2" />
          필터
        </ThemeButton>
        <ThemeButton variant="primary" size="sm" onclick={openCreateModal}>
          <PlusIcon size={16} class="mr-2" />
          새 계약
        </ThemeButton>
      </div>
    </div>

    <!-- 필터 영역 -->
    {#if showFilters}
      <div
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
      >
        <div>
          <label for="employee-search" class="block text-sm font-medium text-gray-700 mb-1"
            >직원 검색</label
          >
          <input
            id="employee-search"
            type="text"
            placeholder="직원명, 사번으로 검색"
            bind:value={localFilter.employeeId}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="department-filter" class="block text-sm font-medium text-gray-700 mb-1"
            >부서</label
          >
          <select
            id="department-filter"
            bind:value={localFilter.department}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="대표">대표</option>
            <option value="연구소">연구소</option>
            <option value="경영기획팀">경영기획팀</option>
            <option value="부서없음">부서없음</option>
          </select>
        </div>
        <div>
          <label for="contract-type-filter" class="block text-sm font-medium text-gray-700 mb-1"
            >계약 유형</label
          >
          <select
            id="contract-type-filter"
            bind:value={localFilter.contractType}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="full_time">정규직</option>
            <option value="part_time">파트타임</option>
            <option value="contract">계약직</option>
            <option value="intern">인턴</option>
          </select>
        </div>
        <div>
          <label for="sc-status-filter" class="block text-sm font-medium text-gray-700 mb-1"
            >상태</label
          >
          <select
            id="sc-status-filter"
            bind:value={localFilter.status}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="active">진행중</option>
            <option value="expired">만료됨</option>
            <option value="terminated">종료됨</option>
            <option value="draft">임시저장</option>
          </select>
        </div>
        <div>
          <label for="start-date-filter" class="block text-sm font-medium text-gray-700 mb-1"
            >시작일 (부터)</label
          >
          <input
            id="start-date-filter"
            type="date"
            bind:value={localFilter.startDateFrom}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-end space-x-2">
          <ThemeButton variant="primary" size="sm" onclick={applyFilter}>
            <SearchIcon size={16} class="mr-1" />
            검색
          </ThemeButton>
          <ThemeButton variant="secondary" size="sm" onclick={clearFilters}>초기화</ThemeButton>
        </div>
      </div>
    {/if}

    <!-- 계약 목록 테이블 -->
    {#if localLoading && localContracts.length === 0}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">로딩 중...</span>
      </div>
    {:else if localError}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <span class="text-red-800">{localError}</span>
      </div>
    {:else if localContracts.length === 0}
      <div class="text-center py-12">
        <FileTextIcon size={48} class="mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500">급여 계약이 없습니다.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >직원 정보</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >계약 기간</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >급여</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >계약 유형</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >상태</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >액션</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each localContracts as contract, i (i)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {contract.employeeName}
                    </div>
                    <div class="text-sm text-gray-500">
                      {contract.employeeIdNumber} • {contract.department}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {formatDate(contract.startDate || '')} ~ {contract.endDate
                      ? formatDate(contract.endDate)
                      : '무기한'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    <div>연봉: {formatCurrency(contract.annualSalary)}</div>
                    <div class="text-gray-500">
                      월급: {formatCurrency(contract.monthlySalary)}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <ThemeBadge class={getContractTypeColor(contract.contractType!)}>
                    {getContractTypeLabel(contract.contractType!)}
                  </ThemeBadge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <ThemeBadge class={getStatusColor(contract.status!)}>
                    {getStatusLabel(contract.status!)}
                  </ThemeBadge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <button
                      type="button"
                      onclick={() => {
                        const asSalaryContract: SalaryContract = {
                          ...contract,
                          id: contract.id ?? crypto.randomUUID(),
                          employeeId: contract.employeeId ?? '',
                          startDate: contract.startDate ?? '',
                          annualSalary: contract.annualSalary ?? 0,
                          monthlySalary: contract.monthlySalary ?? 0,
                          contractType:
                            (contract.contractType as
                              | 'full_time'
                              | 'part_time'
                              | 'contract'
                              | 'intern') ?? 'full_time',
                          status:
                            (contract.status as 'active' | 'expired' | 'terminated' | 'draft') ??
                            'active',
                          createdAt: contract.createdAt ?? new Date().toISOString(),
                          updatedAt: contract.updatedAt ?? new Date().toISOString(),
                          notes: contract.notes ?? undefined,
                          createdBy: undefined,
                          contractEndDisplay: undefined,
                          statusDisplay: undefined,
                          employeeName: '',
                          employeeIdNumber: '',
                          department: '',
                          position: '',
                        }
                        openEditModal(asSalaryContract)
                      }}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onclick={() => {
                        const asSalaryContract: SalaryContract = {
                          ...contract,
                          id: contract.id ?? crypto.randomUUID(),
                          employeeId: contract.employeeId ?? '',
                          startDate: contract.startDate ?? '',
                          annualSalary: contract.annualSalary ?? 0,
                          monthlySalary: contract.monthlySalary ?? 0,
                          contractType:
                            (contract.contractType as
                              | 'full_time'
                              | 'part_time'
                              | 'contract'
                              | 'intern') ?? 'full_time',
                          status:
                            (contract.status as 'active' | 'expired' | 'terminated' | 'draft') ??
                            'active',
                          createdAt: contract.createdAt ?? new Date().toISOString(),
                          updatedAt: contract.updatedAt ?? new Date().toISOString(),
                          notes: contract.notes ?? undefined,
                          createdBy: undefined,
                          contractEndDisplay: undefined,
                          statusDisplay: undefined,
                          employeeName: '',
                          employeeIdNumber: '',
                          department: '',
                          position: '',
                        }
                        openDeleteModal(asSalaryContract)
                      }}
                      class="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </ThemeCard>
</div>

<!-- 새 계약 생성 모달 -->
<ThemeModal open={showCreateModal} onclose={() => (showCreateModal = false)}>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">새 급여 계약</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="create-employee" class="block text-sm font-medium text-gray-700 mb-1"
          >직원 선택 *</label
        >
        <select
          id="create-employee"
          bind:value={formData.employeeId}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">직원을 선택하세요</option>
          {#each employees as employee, i (i)}
            <option value={employee.id}>{employee.name} ({employee.department})</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="create-contractType" class="block text-sm font-medium text-gray-700 mb-1"
          >계약 유형 *</label
        >
        <select
          id="create-contractType"
          bind:value={formData.contractType}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="full_time">정규직</option>
          <option value="part_time">파트타임</option>
          <option value="contract">계약직</option>
          <option value="intern">인턴</option>
        </select>
      </div>
      <div>
        <label for="create-startDate" class="block text-sm font-medium text-gray-700 mb-1"
          >시작일 *</label
        >
        <input
          id="create-startDate"
          type="date"
          bind:value={formData.startDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="create-endDate" class="block text-sm font-medium text-gray-700 mb-1"
          >종료일</label
        >
        <input
          id="create-endDate"
          type="date"
          bind:value={formData.endDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="create-annualSalary" class="block text-sm font-medium text-gray-700 mb-1"
          >연봉 (원) *</label
        >
        <input
          id="create-annualSalary"
          type="number"
          bind:value={formData.annualSalary}
          oninput={calculateMonthlySalary}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 50000000"
        />
      </div>
      <div>
        <label for="create-monthlySalary" class="block text-sm font-medium text-gray-700 mb-1"
          >월급 (원) *</label
        >
        <input
          id="create-monthlySalary"
          type="number"
          bind:value={formData.monthlySalary}
          oninput={calculateAnnualSalary}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 4166667"
        />
      </div>
    </div>
    <div>
      <label for="create-notes" class="block text-sm font-medium text-gray-700 mb-1">비고</label>
      <textarea
        id="create-notes"
        bind:value={formData.notes}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="계약 관련 특이사항이나 메모"
      ></textarea>
    </div>
  </div>

  <div class="flex justify-end space-x-3 mt-6">
    <ThemeButton variant="secondary" onclick={() => (showCreateModal = false)}>취소</ThemeButton>
    <ThemeButton variant="primary" onclick={saveContract}>생성</ThemeButton>
  </div>
</ThemeModal>

<!-- 계약 수정 모달 -->
<ThemeModal open={showEditModal} onclose={() => (showEditModal = false)}>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">급여 계약 수정</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="edit-contractType" class="block text-sm font-medium text-gray-700 mb-1"
          >계약 유형</label
        >
        <select
          id="edit-contractType"
          bind:value={formData.contractType}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="full_time">정규직</option>
          <option value="part_time">파트타임</option>
          <option value="contract">계약직</option>
          <option value="intern">인턴</option>
        </select>
      </div>
      <div>
        <label for="edit-status" class="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <select
          id="edit-status"
          bind:value={formData.status}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">진행중</option>
          <option value="expired">만료됨</option>
          <option value="terminated">종료됨</option>
          <option value="draft">임시저장</option>
        </select>
      </div>
      <div>
        <label for="edit-startDate" class="block text-sm font-medium text-gray-700 mb-1"
          >시작일</label
        >
        <input
          id="edit-startDate"
          type="date"
          bind:value={formData.startDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="edit-endDate" class="block text-sm font-medium text-gray-700 mb-1">종료일</label
        >
        <input
          id="edit-endDate"
          type="date"
          bind:value={formData.endDate}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="edit-annualSalary" class="block text-sm font-medium text-gray-700 mb-1"
          >연봉 (원)</label
        >
        <input
          id="edit-annualSalary"
          type="number"
          bind:value={formData.annualSalary}
          oninput={calculateMonthlySalary}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="edit-monthlySalary" class="block text-sm font-medium text-gray-700 mb-1"
          >월급 (원)</label
        >
        <input
          id="edit-monthlySalary"
          type="number"
          bind:value={formData.monthlySalary}
          oninput={calculateAnnualSalary}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
    <div>
      <label for="edit-notes" class="block text-sm font-medium text-gray-700 mb-1">비고</label>
      <textarea
        id="edit-notes"
        bind:value={formData.notes}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
  </div>

  <div class="flex justify-end space-x-3 mt-6">
    <ThemeButton variant="secondary" onclick={() => (showEditModal = false)}>취소</ThemeButton>
    <ThemeButton variant="primary" onclick={saveContract}>수정</ThemeButton>
  </div>
</ThemeModal>

<!-- 계약 삭제 확인 모달 -->
<ThemeModal open={showDeleteModal} onclose={() => (showDeleteModal = false)}>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">급여 계약 삭제</h3>
    <p class="text-gray-700">정말로 이 급여 계약을 삭제하시겠습니까?</p>
    {#if selectedContract}
      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="font-medium">{selectedContract.employeeName}</p>
        <p class="text-sm text-gray-600">
          {formatDate(selectedContract.startDate)} ~ {selectedContract.endDate
            ? formatDate(selectedContract.endDate)
            : '무기한'}
        </p>
        <p class="text-sm text-gray-600">
          {formatCurrency(selectedContract.annualSalary)}
        </p>
      </div>
    {/if}
    <p class="text-sm text-red-600">이 작업은 되돌릴 수 없습니다.</p>
  </div>

  <div class="flex justify-end space-x-3 mt-6">
    <ThemeButton variant="secondary" onclick={() => (showDeleteModal = false)}>취소</ThemeButton>
    <ThemeButton variant="error" onclick={confirmDelete}>삭제</ThemeButton>
  </div>
</ThemeModal>
