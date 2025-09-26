<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'
  import { formatDate } from '$lib/utils/format'
  import { getCurrentUTC } from '$lib/utils/date-handler'
  import { onMount } from 'svelte'

  import {
    addEmployee,
    deleteEmployee,
    employees,
    employmentContracts,
    getEmployeeContract,
    updateEmployee,
    type Employee,
    type EmploymentContract,
  } from '$lib/stores/hr'

  // 모달 상태
  let isAddModalOpen = $state(false)
  let isEditModalOpen = $state(false)
  let isViewModalOpen = $state(false)
  let selectedEmployee = $state<Employee | null>(null)
  let selectedContract = $state<EmploymentContract | null>(null)

  // 필터 및 검색
  let searchQuery = $state('')
  let departmentFilter = $state('')
  let statusFilter = $state('active') // 기본값: 재직중
  let employmentTypeFilter = $state('')

  // 정렬
  let sortBy = $state('name')
  let sortOrder = $state<'asc' | 'desc'>('asc')

  // 필터링된 직원 목록
  let filteredEmployees = $derived((): Employee[] => {
    let filtered = $employees

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.employeeId.toLowerCase().includes(query) ||
          emp.department.toLowerCase().includes(query) ||
          emp.position.toLowerCase().includes(query),
      )
    }

    // 부서 필터
    if (departmentFilter) {
      filtered = filtered.filter((emp) => emp.department === departmentFilter)
    }

    // 상태 필터
    if (statusFilter) {
      filtered = filtered.filter((emp) => emp.status === statusFilter)
    }

    // 고용 형태 필터
    if (employmentTypeFilter) {
      filtered = filtered.filter((emp) => emp.employmentType === employmentTypeFilter)
    }

    // 정렬 - 부서별 우선 정렬, 그 다음 선택된 정렬 기준
    filtered.sort((a: Employee, b: Employee) => {
      // 부서별 우선 정렬 (대표 → 전략기획실 → 연구소 → 각 팀들 → 부서없음)
      const departmentOrder: { [key: string]: number } = {
        대표: 1,
        전략기획실: 2,
        연구소: 3,
        부서없음: 999,
      }

      const aDeptOrder = departmentOrder[a.department] || 100
      const bDeptOrder = departmentOrder[b.department] || 100

      if (aDeptOrder !== bDeptOrder) {
        return aDeptOrder - bDeptOrder
      }

      // 같은 부서 내에서는 선택된 정렬 기준으로 정렬
      let aValue: any = (a as Employee)[sortBy as keyof Employee]
      let bValue: any = (b as Employee)[sortBy as keyof Employee]

      if (sortBy === 'hireDate') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  })

  // 고유 부서 목록
  let departments = $derived([...new Set($employees.map((emp) => emp.department))])

  // 폼 데이터
  let formData = $state({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    level: 'mid' as Employee['level'],
    employmentType: 'full-time' as Employee['employmentType'],
    hireDate: '',
    status: 'active' as Employee['status'],
    managerId: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    personalInfo: {
      birthDate: '',
      gender: 'male' as Employee['personalInfo']['gender'],
      nationality: '한국',
      maritalStatus: 'single' as Employee['personalInfo']['maritalStatus'],
    },
  })

  // 함수들
  function openAddModal() {
    formData = {
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      department: '',
      position: '',
      level: 'mid',
      employmentType: 'full-time',
      hireDate: getCurrentUTC().split('T')[0],
      status: 'active',
      managerId: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      personalInfo: {
        birthDate: '',
        gender: 'male',
        nationality: '한국',
        maritalStatus: 'single',
      },
    }
    isAddModalOpen = true
  }

  function openEditModal(employee: Employee) {
    selectedEmployee = employee
    formData = {
      ...employee,
      managerId: employee.managerId || '',
    }
    isEditModalOpen = true
  }

  function openViewModal(employee: Employee) {
    selectedEmployee = employee
    selectedContract = getEmployeeContract(employee.id, $employmentContracts) || null
    isViewModalOpen = true
  }

  function handleAddEmployee() {
    addEmployee(formData)
    isAddModalOpen = false
  }

  function handleEditEmployee() {
    if (selectedEmployee) {
      updateEmployee(selectedEmployee.id, formData)
      isEditModalOpen = false
    }
  }

  function handleDeleteEmployee(employee: Employee) {
    if (confirm(`"${employee.name}" 직원을 삭제하시겠습니까?`)) {
      deleteEmployee(employee.id)
    }
  }

  function getStatusBadgeVariant(
    status: Employee['status'],
  ): 'success' | 'warning' | 'danger' | 'secondary' {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'secondary'
      case 'on-leave':
        return 'warning'
      case 'terminated':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  function getStatusText(status: Employee['status']): string {
    switch (status) {
      case 'active':
        return '재직중'
      case 'inactive':
        return '비활성'
      case 'on-leave':
        return '휴직중'
      case 'terminated':
        return '퇴사'
      default:
        return status
    }
  }

  function getEmploymentTypeText(type: Employee['employmentType']): string {
    switch (type) {
      case 'full-time':
        return '정규직'
      case 'part-time':
        return '파트타임'
      case 'contract':
        return '계약직'
      case 'intern':
        return '인턴'
      default:
        return type
    }
  }

  function getLevelText(level: Employee['level']): string {
    switch (level) {
      case 'intern':
        return '인턴'
      case 'junior':
        return '주니어'
      case 'mid':
        return '미드레벨'
      case 'senior':
        return '시니어'
      case 'lead':
        return '리드'
      case 'manager':
        return '매니저'
      case 'director':
        return '디렉터'
      default:
        return level
    }
  }

  function sort(column: string) {
    if (sortBy === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy = column
      sortOrder = 'asc'
    }
  }

  onMount(() => {
    // 초기 데이터 로드
  })
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- 헤더 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">직원 관리</h1>
        <p class="text-gray-600 mt-1">전체 직원 정보를 관리하고 조회할 수 있습니다</p>
      </div>
      <button
        type="button"
        onclick={openAddModal}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        직원 추가
      </button>
    </div>

    <!-- 필터 및 검색 -->
    <Card class="mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label for="search-input" class="block text-sm font-medium text-gray-700 mb-2"
              >검색</label
            >
            <input
              id="search-input"
              type="text"
              bind:value={searchQuery}
              placeholder="이름, 이메일, 사번으로 검색..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label for="department-select" class="block text-sm font-medium text-gray-700 mb-2"
              >부서</label
            >
            <select
              id="department-select"
              bind:value={departmentFilter}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 부서</option>
              <option value="대표">대표</option>
              <option value="전략기획실">전략기획실</option>
              <option value="연구소">연구소</option>
              {#each departments.filter((d) => !['대표', '전략기획실', '연구소', '부서없음'].includes(d)) as dept, idx (idx)}
                <!-- TODO: replace index key with a stable id when model provides one -->
                <option value={dept}>{dept}</option>
              {/each}
              <option value="부서없음">부서없음</option>
            </select>
          </div>
          <div>
            <label for="status-select" class="block text-sm font-medium text-gray-700 mb-2"
              >상태</label
            >
            <select
              id="status-select"
              bind:value={statusFilter}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 상태</option>
              <option value="active">재직중</option>
              <option value="inactive">비활성</option>
              <option value="on-leave">휴직중</option>
              <option value="terminated">퇴사</option>
            </select>
          </div>
          <div>
            <label for="employment-type-select" class="block text-sm font-medium text-gray-700 mb-2"
              >고용 형태</label
            >
            <select
              id="employment-type-select"
              bind:value={employmentTypeFilter}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="full-time">정규직</option>
              <option value="part-time">파트타임</option>
              <option value="contract">계약직</option>
              <option value="intern">인턴</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              type="button"
              onclick={() => {
                searchQuery = ''
                departmentFilter = ''
                statusFilter = 'active' // 기본값: 재직중
                employmentTypeFilter = ''
              }}
              class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- 직원 목록 -->
    <Card>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sort('employeeId')}
              >
                사번 {#if sortBy === 'employeeId'}{sortOrder === 'asc' ? '↑' : '↓'}{/if}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sort('name')}
              >
                이름 {#if sortBy === 'name'}{sortOrder === 'asc' ? '↑' : '↓'}{/if}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sort('department')}
              >
                부서 {#if sortBy === 'department'}{sortOrder === 'asc' ? '↑' : '↓'}{/if}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                직급
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                고용 형태
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                상태
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sort('hireDate')}
              >
                입사일 {#if sortBy === 'hireDate'}{sortOrder === 'asc' ? '↑' : '↓'}{/if}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                작업
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredEmployees() as employee, i (i)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.employeeId}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-gray-700">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {employee.name}
                      </div>
                      <div class="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.department}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.position}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getEmploymentTypeText(employee.employmentType as Employee['employmentType'])}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadgeVariant(employee.status as Employee['status'])}>
                    {getStatusText(employee.status as Employee['status'])}
                  </Badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(employee.hireDate)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      type="button"
                      onclick={() => openViewModal(employee as Employee)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      보기
                    </button>
                    <button
                      type="button"
                      onclick={() => openEditModal(employee as Employee)}
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onclick={() => handleDeleteEmployee(employee as Employee)}
                      class="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>

    <!-- 직원 추가 모달 -->
    <Modal bind:open={isAddModalOpen}>
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">직원 추가</h3>
        <form
          onsubmit={(e) => {
            e.preventDefault()
            handleAddEmployee()
          }}
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="employee-id-input" class="block text-sm font-medium text-gray-700 mb-1"
                >사번 *</label
              >
              <input
                id="employee-id-input"
                type="text"
                bind:value={formData.employeeId}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >이름 *</label
              >
              <input
                type="text"
                bind:value={formData.name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >이메일 *</label
              >
              <input
                type="email"
                bind:value={formData.email}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >전화번호 *</label
              >
              <input
                type="tel"
                bind:value={formData.phone}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >부서 *</label
              >
              <input
                type="text"
                bind:value={formData.department}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >직급 *</label
              >
              <input
                type="text"
                bind:value={formData.position}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >레벨 *</label
              >
              <select
                bind:value={formData.level}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-email"
              >
                <option value="intern">인턴</option>
                <option value="junior">주니어</option>
                <option value="mid">미드레벨</option>
                <option value="senior">시니어</option>
                <option value="lead">리드</option>
                <option value="manager">매니저</option>
                <option value="director">디렉터</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >고용 형태 *</label
              >
              <select
                bind:value={formData.employmentType}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-email"
              >
                <option value="full-time">정규직</option>
                <option value="part-time">파트타임</option>
                <option value="contract">계약직</option>
                <option value="intern">인턴</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >입사일 *</label
              >
              <input
                type="date"
                bind:value={formData.hireDate}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >주소</label
              >
              <input
                type="text"
                bind:value={formData.address}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              onclick={() => (isAddModalOpen = false)}
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- 직원 수정 모달 -->
    <Modal bind:open={isEditModalOpen}>
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">직원 정보 수정</h3>
        <form
          onsubmit={(e) => {
            e.preventDefault()
            handleEditEmployee()
          }}
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >사번 *</label
              >
              <input
                type="text"
                bind:value={formData.employeeId}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >이름 *</label
              >
              <input
                type="text"
                bind:value={formData.name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >이메일 *</label
              >
              <input
                type="email"
                bind:value={formData.email}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >전화번호 *</label
              >
              <input
                type="tel"
                bind:value={formData.phone}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >부서 *</label
              >
              <input
                type="text"
                bind:value={formData.department}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >직급 *</label
              >
              <input
                type="text"
                bind:value={formData.position}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >레벨 *</label
              >
              <select
                bind:value={formData.level}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-email"
              >
                <option value="intern">인턴</option>
                <option value="junior">주니어</option>
                <option value="mid">미드레벨</option>
                <option value="senior">시니어</option>
                <option value="lead">리드</option>
                <option value="manager">매니저</option>
                <option value="director">디렉터</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >고용 형태 *</label
              >
              <select
                bind:value={formData.employmentType}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-email"
              >
                <option value="full-time">정규직</option>
                <option value="part-time">파트타임</option>
                <option value="contract">계약직</option>
                <option value="intern">인턴</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >입사일 *</label
              >
              <input
                type="date"
                bind:value={formData.hireDate}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="field-name"
                >상태 *</label
              >
              <select
                bind:value={formData.status}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="field-email"
              >
                <option value="active">재직중</option>
                <option value="inactive">비활성</option>
                <option value="on-leave">휴직중</option>
                <option value="terminated">퇴사</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              onclick={() => (isEditModalOpen = false)}
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              수정
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- 직원 상세 보기 모달 -->
    <Modal bind:open={isViewModalOpen}>
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">직원 상세 정보</h3>
        {#if selectedEmployee}
          <div class="space-y-6">
            <!-- 기본 정보 -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-3">기본 정보</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span class="block text-sm font-medium text-gray-500">사번</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.employeeId}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">이름</span>
                  <p class="text-sm text-gray-900">{selectedEmployee.name}</p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">이메일</span>
                  <p class="text-sm text-gray-900">{selectedEmployee.email}</p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">전화번호</span>
                  <p class="text-sm text-gray-900">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">부서</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.department}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">직급</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.position}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">레벨</span>
                  <p class="text-sm text-gray-900">
                    {getLevelText(selectedEmployee.level as Employee['level'])}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">고용 형태</span>
                  <p class="text-sm text-gray-900">
                    {getEmploymentTypeText(
                      selectedEmployee.employmentType as Employee['employmentType'],
                    )}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">입사일</span>
                  <p class="text-sm text-gray-900">
                    {formatDate(selectedEmployee.hireDate)}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">상태</span>
                  <Badge
                    variant={getStatusBadgeVariant(selectedEmployee.status as Employee['status'])}
                  >
                    {getStatusText(selectedEmployee.status as Employee['status'])}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- 긴급 연락처 -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-3">긴급 연락처</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span class="block text-sm font-medium text-gray-500">이름</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.emergencyContact.name}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">관계</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.emergencyContact.relationship}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">전화번호</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.emergencyContact.phone}
                  </p>
                </div>
              </div>
            </div>

            <!-- 개인 정보 -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-3">개인 정보</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span class="block text-sm font-medium text-gray-500">생년월일</span>
                  <p class="text-sm text-gray-900">
                    {formatDate(selectedEmployee.personalInfo.birthDate)}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">성별</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.personalInfo.gender === 'male'
                      ? '남성'
                      : selectedEmployee.personalInfo.gender === 'female'
                        ? '여성'
                        : '기타'}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">국적</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.personalInfo.nationality}
                  </p>
                </div>
                <div>
                  <span class="block text-sm font-medium text-gray-500">결혼 상태</span>
                  <p class="text-sm text-gray-900">
                    {selectedEmployee.personalInfo.maritalStatus === 'single'
                      ? '미혼'
                      : selectedEmployee.personalInfo.maritalStatus === 'married'
                        ? '기혼'
                        : selectedEmployee.personalInfo.maritalStatus === 'divorced'
                          ? '이혼'
                          : '사별'}
                  </p>
                </div>
              </div>
            </div>

            <!-- 근로 계약 정보 -->
            {#if selectedContract}
              <div>
                <h4 class="text-md font-medium text-gray-900 mb-3">근로 계약 정보</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span class="block text-sm font-medium text-gray-500">계약 유형</span>
                    <p class="text-sm text-gray-900">
                      {selectedContract.contractType}
                    </p>
                  </div>
                  <div>
                    <span class="block text-sm font-medium text-gray-500">시작일</span>
                    <p class="text-sm text-gray-900">
                      {formatDate(selectedContract.startDate)}
                    </p>
                  </div>
                  <div>
                    <span class="block text-sm font-medium text-gray-500">급여</span>
                    <div class="flex items-center gap-2">
                      <div class="bg-gray-100 px-3 py-2 rounded-md border border-gray-300">
                        <p class="text-sm text-gray-600 font-medium">
                          {new Intl.NumberFormat('ko-KR').format(selectedContract.salary)}원
                        </p>
                      </div>
                      <button
                        type="button"
                        onclick={() => {
                          // 급여 관리 페이지로 이동
                          window.location.href = '/salary'
                        }}
                        class="text-xs px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors shadow-sm"
                        title="급여 수정은 근로계약서를 통해 관리됩니다"
                      >
                        급여 관리
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 italic">
                      * 급여 수정은 근로계약서를 통해 관리됩니다
                    </p>
                  </div>
                  <div>
                    <span class="block text-sm font-medium text-gray-500">근무시간</span>
                    <p class="text-sm text-gray-900">
                      {selectedContract.workingHours}시간/주
                    </p>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <div class="flex justify-end mt-6">
          <button
            type="button"
            onclick={() => (isViewModalOpen = false)}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  </div>
</div>
