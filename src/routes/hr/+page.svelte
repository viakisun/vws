<script lang="ts">
  import type { Department, Employee, Executive, JobTitle, Position } from '$lib/types'
  import { logger } from '$lib/utils/logger'
  import { browser } from '$app/environment'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'

  import PageLayout from '$lib/components/layout/PageLayout.svelte'
  import DeleteConfirmModal from '$lib/components/ui/DeleteConfirmModal.svelte'
  import DepartmentModal from '$lib/components/ui/DepartmentModal.svelte'
  import EmployeeModal from '$lib/components/ui/EmployeeModal.svelte'
  import OrganizationChart from '$lib/components/ui/OrganizationChart.svelte'
  import PositionModal from '$lib/components/ui/PositionModal.svelte'
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ThemeSpacer from '$lib/components/ui/ThemeSpacer.svelte'
  import ThemeTabs from '$lib/components/ui/ThemeTabs.svelte'
  import { formatDate, formatEmployeeName } from '$lib/utils/format'
  import {
    AlertCircleIcon,
    BarChart3Icon,
    BriefcaseIcon,
    BuildingIcon,
    CalendarIcon,
    CheckCircleIcon,
    CrownIcon,
    DollarSignIcon,
    DownloadIcon,
    EditIcon,
    EyeIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    FlaskConicalIcon,
    MailIcon,
    PhoneIcon,
    PlusIcon,
    TagIcon,
    TrashIcon,
    UserCheckIcon,
    UserPlusIcon,
    UsersIcon,
  } from '@lucide/svelte'

  // HR 스토어들
  import { jobPostings } from '$lib/stores/recruitment'
  import { contracts, loadContracts } from '$lib/stores/salary/contract-store'
  import { hrDashboardStore } from '$lib/stores/hr/hr-dashboard-store.svelte'

  // HR 대시보드 컴포넌트들
  import HRStatsCards from '$lib/components/hr/dashboard/HRStatsCards.svelte'
  import HROverviewTab from '$lib/components/hr/dashboard/HROverviewTab.svelte'

  // 데이터베이스 직원 데이터 - 스토어에서 가져옴
  let employees = $derived(hrDashboardStore.employees)
  let loading = $derived(hrDashboardStore.loading)
  let error = $derived(hrDashboardStore.error)

  // 직원별 현재 급여 정보 가져오기
  function getCurrentSalary(employeeId: string): {
    annualSalary: number
    monthlySalary: number
    contractType: string
  } | null {
    const activeContract = $contracts.find(
      (contract) =>
        contract.employeeId === employeeId &&
        contract.status === 'active' &&
        (!contract.endDate || new Date(contract.endDate) > new Date()),
    )

    if (activeContract) {
      return {
        annualSalary: activeContract.annualSalary,
        monthlySalary: activeContract.monthlySalary,
        contractType: activeContract.contractType,
      }
    }
    return null
  }

  // 사번 포맷팅 함수 (새로운 사번 형식 1001, 1002 등 표시)
  function formatEmployeeIdDisplay(employeeId: string, index: number): string {
    // 새로운 사번 형식 (1001, 1002 등)을 그대로 표시
    if (employeeId.match(/^\d{4}$/)) {
      return employeeId
    }
    // 기존 V 형식 사번도 그대로 표시
    if (employeeId.startsWith('V')) {
      return employeeId
    }
    // 기타 형식의 경우 순서대로 표시
    return employeeId || `V${(index + 1).toString().padStart(5, '0')}`
  }

  // 스토어에서 데이터 가져오기
  let departments = $derived(hrDashboardStore.departments)
  let positions = $derived(hrDashboardStore.positions)
  let executives = $derived(hrDashboardStore.executives)
  let jobTitles = $derived(hrDashboardStore.jobTitles)
  let executiveLoading = $derived(hrDashboardStore.executiveLoading)
  let _jobTitleLoading = $derived(hrDashboardStore._jobTitleLoading)

  // 생성일 순으로 정렬된 부서 목록
  let sortedDepartments = $derived(() => {
    return [...departments].sort(
      (a: Department, b: Department) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
  })

  // 직급을 카테고리별로 분류
  function getPositionsByCategory() {
    const categories = {
      연구원: positions.filter((p) => p.department === '연구개발'),
      디자이너: positions.filter((p) => p.department === '디자인'),
      행정원: positions.filter((p) => p.department === '행정'),
    }
    return categories
  }

  // 직책을 레벨별로 분류
  function _getJobTitlesByLevel() {
    const levels = {
      'C-Level': jobTitles.filter((jt) => String(jt.level) === '1'),
      Management: jobTitles.filter((jt) => String(jt.level) === '2'),
      Specialist: jobTitles.filter((jt) => String(jt.level) === '3'),
    }
    return levels
  }

  // 스토어에서 가져온 데이터들 (필요시 사용)
  let _totalAllEmployees = $derived(hrDashboardStore._totalAllEmployees)
  let _totalTO = $derived(hrDashboardStore._totalTO)
  let _totalDepartments = $derived(hrDashboardStore._totalDepartments)

  // 탭 정의
  const tabs = [
    {
      id: 'overview',
      label: '개요',
      icon: BarChart3Icon,
    },
    {
      id: 'employees',
      label: '직원관리',
      icon: UsersIcon,
    },
    {
      id: 'recruitment',
      label: '채용관리',
      icon: UserPlusIcon,
    },
    {
      id: 'departments',
      label: '부서관리',
      icon: BuildingIcon,
    },
    {
      id: 'positions',
      label: '직급관리',
      icon: UserCheckIcon,
    },
    {
      id: 'executives',
      label: '이사관리',
      icon: CrownIcon,
    },
    {
      id: 'job-titles',
      label: '직책관리',
      icon: BriefcaseIcon,
    },
    {
      id: 'org-chart',
      label: '조직도',
      icon: BuildingIcon,
    },
  ] as const
  type TabId = (typeof tabs)[number]['id']
  const TAB_IDS = new Set<TabId>(tabs.map((t) => t.id))

  let activeTab = $state<TabId>('overview')

  // URL ↔ 탭 동기화
  $effect(() => {
    const q = $page.url.searchParams.get('tab')
    const next = q && TAB_IDS.has(q as TabId) ? (q as TabId) : 'overview'
    if (next !== activeTab) activeTab = next
  })

  // 업로드 관련 상태
  let showUploadModal = $state(false)
  let uploadFile = $state<File | null>(null)
  let uploadStatus = $state<'idle' | 'uploading' | 'success' | 'error'>('idle')
  let uploadMessage = $state('')
  let uploadProgress = $state(0)
  let isDragOver = $state(false)

  // 직원 관리 관련 상태
  let showEmployeeModal = $state(false)
  let showDeleteModal = $state(false)
  let selectedEmployee = $state<Employee | null>(null)
  let employeeLoading = $state(false)
  let deleteLoading = $state(false)

  // 조직 관리 관련 상태
  let showDepartmentModal = $state(false)
  let showPositionModal = $state(false)
  let selectedDepartment = $state<Department | null>(null)
  let selectedPosition = $state<Position | null>(null)
  let departmentLoading = $state(false)
  let positionLoading = $state(false)

  // 이사 관리 관련 상태
  let _showExecutiveModal = $state(false)
  let _showJobTitleModal = $state(false)
  let _selectedExecutive = $state<Executive | null>(null)
  let _selectedJobTitle = $state<JobTitle | null>(null)

  // 직원 검색 및 필터링 상태
  let searchQuery = $state('')
  let departmentFilter = $state('')
  let statusFilter = $state('active') // 기본값: 재직중
  let currentPage = $state(1)
  let itemsPerPage = 20

  // 필터링된 직원 목록
  let filteredEmployees = $derived(
    (() => {
      let filtered = employees || []

      // 검색 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (emp) =>
            formatEmployeeName(emp).toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            emp.employee_id.toLowerCase().includes(query) ||
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

      return filtered
    })(),
  )

  // 팀별로 그룹화된 직원 목록
  let _groupedEmployees = $derived(
    (() => {
      const groups: { [key: string]: Employee[] } = {}

      filteredEmployees.forEach((employee: Employee) => {
        const team = employee.department || '기타'
        if (!groups[team]) {
          groups[team] = []
        }
        groups[team].push(employee)
      })

      return groups
    })(),
  )

  // 페이지네이션 계산 (직원 수 기준)
  let totalPages = $derived(Math.ceil(filteredEmployees.length / itemsPerPage))
  let paginatedEmployees = $derived(
    (() => {
      const start = (currentPage - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredEmployees.slice(start, end)
    })(),
  )

  // 팀 리더 및 임원인지 확인하는 함수
  function isTeamLead(employee: Employee): boolean {
    const leadershipPositions = [
      'Team Lead',
      'CEO',
      'CFO',
      'CTO',
      '대표이사',
      '재무이사',
      '기술이사',
      '연구소장',
      '상무',
    ]
    return (
      leadershipPositions.includes(employee.job_title_name || '') ||
      leadershipPositions.includes(employee.position || '')
    )
  }

  // 직원을 정렬하는 함수 (임원/팀 리더 우선, 퇴사자는 퇴사일 역순)
  function sortEmployees(employees: Employee[]): Employee[] {
    return employees.sort((a, b) => {
      // 퇴사자인 경우 퇴사일 역순으로 정렬
      if (a.status === 'terminated' && b.status === 'terminated') {
        const aTerminationDate = a.termination_date ? new Date(a.termination_date).getTime() : 0
        const bTerminationDate = b.termination_date ? new Date(b.termination_date).getTime() : 0
        return bTerminationDate - aTerminationDate // 최신 퇴사일이 먼저
      }

      // 퇴사자와 재직자 구분 (재직자가 먼저)
      if (a.status === 'terminated' && b.status !== 'terminated') return 1
      if (a.status !== 'terminated' && b.status === 'terminated') return -1

      // 재직자인 경우 기존 로직 적용
      const aIsLeader = isTeamLead(a)
      const bIsLeader = isTeamLead(b)

      // 임원/팀 리더가 아닌 직원보다 임원/팀 리더를 앞에 배치
      if (aIsLeader && !bIsLeader) return -1
      if (!aIsLeader && bIsLeader) return 1

      // 둘 다 임원/팀 리더이거나 둘 다 일반 직원인 경우 이름순 정렬
      const aName = formatEmployeeName(a)
      const bName = formatEmployeeName(b)
      return aName.localeCompare(bName)
    })
  }

  // 페이지네이션된 직원들을 팀별로 그룹화 (임원/팀 리더 우선 정렬)
  let paginatedGroupedEmployees = $derived(
    (() => {
      const groups: { [key: string]: Employee[] } = {}

      paginatedEmployees.forEach((employee: Employee) => {
        const team = employee.department || '기타'
        if (!groups[team]) {
          groups[team] = []
        }
        groups[team].push(employee)
      })

      // 각 팀 내에서 팀 리더를 우선 정렬
      Object.keys(groups).forEach((team) => {
        groups[team] = sortEmployees(groups[team])
      })

      // 부서별 정렬 순서 적용
      const departmentOrder: { [key: string]: number } = {
        대표: 1,
        전략기획실: 2,
        연구소: 3,
        부서없음: 999,
      }

      // 정렬된 그룹 객체 생성
      const sortedGroups: { [key: string]: any[] } = {}
      const sortedTeamNames = Object.keys(groups).sort((a, b) => {
        const aOrder = departmentOrder[a] || 100
        const bOrder = departmentOrder[b] || 100

        if (aOrder !== bOrder) {
          return aOrder - bOrder
        }

        // 같은 우선순위 내에서는 알파벳 순
        return a.localeCompare(b)
      })

      sortedTeamNames.forEach((teamName) => {
        sortedGroups[teamName] = groups[teamName]
      })

      return sortedGroups
    })(),
  )

  // 통계 데이터는 HRStatsCards 컴포넌트에서 처리

  // 액션 버튼들
  const _actions = [
    {
      label: '직원 추가',
      icon: PlusIcon,
      onclick: () => openAddEmployeeModal(),
      variant: 'primary' as const,
    },
    {
      label: '채용 공고',
      icon: FileTextIcon,
      onclick: () => {
        // 채용 공고 탭으로 이동
        activeTab = 'recruitment'
      },
      variant: 'success' as const,
    },
  ]

  // 활동 데이터와 부서 데이터는 각각의 컴포넌트에서 처리

  // 최근 채용 공고 데이터
  let recentJobPostings = $derived(() => {
    return $jobPostings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  })

  // 데이터 새로고침 함수들 - 스토어 메서드를 직접 사용
  const fetchEmployees = () => hrDashboardStore.fetchEmployees()
  const fetchDepartments = () => hrDashboardStore.fetchDepartments()
  const fetchPositions = () => hrDashboardStore.fetchPositions()
  const fetchExecutives = () => hrDashboardStore.fetchExecutives()
  const fetchJobTitles = () => hrDashboardStore.fetchJobTitles()

  // 컴포넌트 마운트 시 데이터 로드
  $effect(() => {
    hrDashboardStore.initialize()
    loadContracts() // 급여 계약 데이터 로드
  })

  // 탭 변경 시 해당 탭의 데이터 로드
  $effect(() => {
    // activeTab 변경을 감지하여 데이터 로드
    const currentTab = activeTab
    logger.log('HR Tab changed to:', currentTab)

    switch (currentTab) {
      case 'employees':
        logger.log('Loading employees data...')
        hrDashboardStore.fetchEmployees()
        break
      case 'departments':
        logger.log('Loading departments data...')
        hrDashboardStore.fetchDepartments()
        break
      case 'positions':
        logger.log('Loading positions data...')
        hrDashboardStore.fetchPositions()
        break
      case 'executives':
        logger.log('Loading executives data...')
        hrDashboardStore.fetchExecutives()
        break
      case 'job-titles':
        logger.log('Loading job titles data...')
        hrDashboardStore.fetchJobTitles()
        break
    }
  })

  // 탭 변경 핸들러 (URL 동기화)
  function handleTabChange(tabId: string) {
    const id = TAB_IDS.has(tabId as TabId) ? (tabId as TabId) : 'overview'
    if (activeTab !== id) activeTab = id
    if (browser) {
      const u = new URL(window.location.href)
      u.searchParams.set('tab', id)
      goto(`${u.pathname}?${u.searchParams.toString()}`, { keepFocus: true, noScroll: true })
    }
  }

  // HR 탭 변경 이벤트 리스너
  $effect(() => {
    if (browser) {
      const handleHRTabChange = (event: CustomEvent) => {
        handleTabChange(event.detail)
      }

      window.addEventListener('hr-tab-change', handleHRTabChange)

      return () => {
        window.removeEventListener('hr-tab-change', handleHRTabChange)
      }
    }
  })

  // 파일 업로드 처리
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  // 드래그 앤 드롭 핸들러
  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragOver = true
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragOver = false
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragOver = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      validateAndSetFile(file)
    }
  }

  // 파일 검증 및 설정
  function validateAndSetFile(file: File) {
    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      uploadMessage = '파일 크기는 10MB를 초과할 수 없습니다.'
      uploadStatus = 'error'
      return
    }

    // 파일 형식 검증
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const allowedExtensions = ['.csv', '.xlsx', '.xls']

    const isValidType = allowedTypes.includes(file.type)
    const isValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!isValidType && !isValidExtension) {
      uploadMessage = 'CSV 또는 Excel 파일만 업로드 가능합니다.'
      uploadStatus = 'error'
      return
    }

    uploadFile = file
    uploadStatus = 'idle'
    uploadMessage = ''
  }

  // 엑셀 업로드 실행
  async function uploadExcel() {
    if (!uploadFile) return

    // TODO: 엑셀 업로드 기능 구현 필요
    uploadStatus = 'error'
    uploadMessage = '엑셀 업로드 기능은 현재 개발 중입니다. 추후 구현 예정입니다.'
    uploadProgress = 0
    return

    // 아래 코드는 추후 구현 예정
    /*
    uploadStatus = 'uploading'
    uploadProgress = 0
    uploadMessage = '파일을 업로드하는 중...'

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        uploadProgress += 10
        if (uploadProgress >= 90) {
          clearInterval(progressInterval)
        }
      }, 200)

      const response = await fetch('/api/employees/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      uploadProgress = 100

      if (response.ok) {
        const result = await response.json()
        uploadStatus = 'success'
        uploadMessage = `성공적으로 ${result.count}명의 직원이 업로드되었습니다.`

        // 직원 목록 새로고침
        await fetchEmployees()

        setTimeout(() => {
          showUploadModal = false
          uploadStatus = 'idle'
          uploadFile = null
          uploadProgress = 0
          uploadMessage = ''
        }, 2000)
      } else {
        throw new Error('업로드 실패')
      }
    } catch (error) {
      uploadStatus = 'error'
      uploadMessage = '업로드 중 오류가 발생했습니다. 파일 형식을 확인해주세요.'
      logger.error('Upload error:', error)
    }
    */
  }

  // 업로드 모달 열기
  function openUploadModal() {
    showUploadModal = true
    uploadStatus = 'idle'
    uploadFile = null
    uploadProgress = 0
    uploadMessage = ''
  }

  // 업로드 모달 닫기
  function closeUploadModal() {
    showUploadModal = false
    uploadStatus = 'idle'
    uploadFile = null
    uploadProgress = 0
    uploadMessage = ''
  }

  // 직원 추가/수정
  async function handleEmployeeSave(event: CustomEvent<import('$lib/types').Employee>) {
    try {
      const employeeData = event.detail
      employeeLoading = true

      const url = '/api/employees'
      const method = selectedEmployee?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      })

      const result = await response.json()

      if (result.success) {
        await fetchEmployees() // 데이터 새로고침
        showEmployeeModal = false
        selectedEmployee = null
      } else {
        alert(result.error || '직원 저장에 실패했습니다.')
      }
    } catch (error) {
      logger.error('Error saving employee:', error)
      alert('직원 저장 중 오류가 발생했습니다.')
    } finally {
      employeeLoading = false
    }
  }

  // 직원 삭제/아카이브
  async function handleEmployeeDelete(action: 'delete' | 'archive') {
    if (!selectedEmployee) return

    try {
      deleteLoading = true

      const url = `/api/employees/${selectedEmployee.id}${action === 'archive' ? '?archive=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchEmployees() // 데이터 새로고침
        showDeleteModal = false
        selectedEmployee = null
      } else {
        alert(result.error || '직원 삭제에 실패했습니다.')
      }
    } catch (error) {
      logger.error('Error deleting employee:', error)
      alert('직원 삭제 중 오류가 발생했습니다.')
    } finally {
      deleteLoading = false
    }
  }

  // 페이지네이션 함수들
  function setCurrentPage(page: number) {
    currentPage = page
  }

  // 검색/필터 변경 시 첫 페이지로 이동
  $effect(() => {
    searchQuery
    departmentFilter
    statusFilter
    currentPage = 1
  })

  // 직원 추가 모달 열기
  function openAddEmployeeModal() {
    selectedEmployee = null
    showEmployeeModal = true
  }

  // 직원 수정 모달 열기
  function openEditEmployeeModal(employee: Employee) {
    selectedEmployee = employee
    showEmployeeModal = true
  }

  // 직원 삭제 모달 열기
  function openDeleteEmployeeModal(employee: Employee) {
    selectedEmployee = employee
    showDeleteModal = true
  }

  // 직원 템플릿 다운로드
  async function downloadEmployeeTemplate() {
    try {
      const response = await fetch('/api/templates/employees')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'employee_template.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('템플릿 다운로드에 실패했습니다.')
      }
    } catch (error) {
      logger.error('템플릿 다운로드 에러:', error)
      alert('템플릿 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 부서 관리 함수들
  async function handleDepartmentSave(event: CustomEvent<Department>) {
    try {
      const departmentData = event.detail
      departmentLoading = true

      const url = selectedDepartment?.id
        ? `/api/departments/${selectedDepartment.id}`
        : '/api/departments'
      const method = selectedDepartment?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      })

      const result = await response.json()

      if (result.success) {
        await fetchDepartments()
        showDepartmentModal = false
        selectedDepartment = null
      } else {
        alert(result.error || '부서 저장에 실패했습니다.')
      }
    } catch (error) {
      logger.error('Error saving department:', error)
      alert('부서 저장 중 오류가 발생했습니다.')
    } finally {
      departmentLoading = false
    }
  }

  async function handleDepartmentDelete(department: Department, hardDelete = false) {
    try {
      const url = `/api/departments/${department.id}${hardDelete ? '?hard=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchDepartments()
      } else {
        alert(result.error || '부서 삭제에 실패했습니다.')
      }
    } catch (error) {
      logger.error('Error deleting department:', error)
      alert('부서 삭제 중 오류가 발생했습니다.')
    }
  }

  function openAddDepartmentModal() {
    selectedDepartment = null
    showDepartmentModal = true
  }

  function openEditDepartmentModal(department: Department) {
    selectedDepartment = department
    showDepartmentModal = true
  }

  // 직급 관리 함수들
  async function handlePositionSave(event: CustomEvent<Position>) {
    try {
      const positionData = event.detail
      positionLoading = true

      const url = selectedPosition?.id ? `/api/positions/${selectedPosition.id}` : '/api/positions'
      const method = selectedPosition?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionData),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPositions()
        showPositionModal = false
        selectedPosition = null
      } else {
        alert(result.error || '직급 저장에 실패했습니다.')
      }
    } catch (error) {
      logger.error('Error saving position:', error)
      alert('직급 저장 중 오류가 발생했습니다.')
    } finally {
      positionLoading = false
    }
  }

  async function handlePositionDelete(position: Position, hardDelete = false) {
    try {
      const url = `/api/positions/${position.id}${hardDelete ? '?hard=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await fetchPositions()
      } else {
        alert(result.error || '직급 삭제에 실패했습니다.')
      }
    } catch (error) {
      logger.error('Error deleting position:', error)
      alert('직급 삭제 중 오류가 발생했습니다.')
    }
  }

  function openAddPositionModal(category?: string) {
    selectedPosition = null
    showPositionModal = true
    // 카테고리 정보를 모달에 전달할 수 있도록 설정
    if (category) {
      // 모달에서 카테고리 정보를 사용할 수 있도록 상태 설정
      // 이는 PositionModal 컴포넌트에서 활용할 수 있습니다
    }
  }

  // 이사 관리 함수들
  function openAddExecutiveModal() {
    _selectedExecutive = null
    _showExecutiveModal = true
  }

  function openEditExecutiveModal(executive: Executive) {
    _selectedExecutive = executive
    _showExecutiveModal = true
  }

  async function handleExecutiveDelete(executive: Executive) {
    if (confirm(`정말로 ${executive.name} 이사를 삭제하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/executives/${executive.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchExecutives()
          alert('이사가 성공적으로 삭제되었습니다.')
        } else {
          const result = await response.json()
          alert(result.error || '이사 삭제 중 오류가 발생했습니다.')
        }
      } catch (error) {
        logger.error('Error deleting executive:', error)
        alert('이사 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  // 직책 관리 함수들
  function openAddJobTitleModal(level?: string) {
    _selectedJobTitle = null
    _showJobTitleModal = true
    // 레벨 정보를 모달에 전달할 수 있도록 설정
    if (level) {
      // 모달에서 레벨 정보를 사용할 수 있도록 상태 설정
    }
  }

  function openEditJobTitleModal(jobTitle: JobTitle) {
    _selectedJobTitle = jobTitle
    _showJobTitleModal = true
  }

  async function handleJobTitleDelete(jobTitle: JobTitle) {
    if (confirm(`정말로 ${jobTitle.name || jobTitle.title} 직책을 삭제하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/job-titles/${jobTitle.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchJobTitles()
          alert('직책이 성공적으로 삭제되었습니다.')
        } else {
          const result = await response.json()
          alert(result.error || '직책 삭제 중 오류가 발생했습니다.')
        }
      } catch (error) {
        logger.error('Error deleting job title:', error)
        alert('직책 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  function openEditPositionModal(position: Position) {
    selectedPosition = position
    showPositionModal = true
  }
</script>

<PageLayout title="인사관리" subtitle="직원 정보, 채용, 성과 관리">
  <!-- 통계 카드들 -->
  <HRStatsCards />

  <!-- 탭 시스템 -->
  <ThemeTabs
    tabs={tabs as any}
    bind:activeTab
    variant="underline"
    size="md"
    class="mb-6"
    onTabChange={handleTabChange}
  >
    {#snippet children(tab)}
      {#if tab.id === 'overview'}
        <!-- 개요 탭 - 분리된 컴포넌트 사용 -->
        <HROverviewTab />
      {:else if tab.id === 'employees'}
        <!-- 직원관리 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">직원 목록</h3>
              <div class="flex items-center gap-2">
                <ThemeButton
                  variant="primary"
                  size="sm"
                  class="flex items-center gap-2"
                  onclick={openAddEmployeeModal}
                >
                  <PlusIcon size={16} />
                  직원 추가
                </ThemeButton>
                <button
                  type="button"
                  onclick={openUploadModal}
                  class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheetIcon size={16} />
                  엑셀 업로드
                </button>
              </div>
            </div>

            {#if loading}
              <div class="flex items-center justify-center py-8">
                <div class="text-sm" style:color="var(--color-text-secondary)">
                  직원 데이터를 불러오는 중...
                </div>
              </div>
            {:else if error}
              <div class="flex items-center justify-center py-8">
                <div class="text-sm text-red-500">{error}</div>
              </div>
            {:else if !employees || employees.length === 0}
              <div class="flex items-center justify-center py-8">
                <div class="text-sm" style:color="var(--color-text-secondary)">
                  등록된 직원이 없습니다.
                </div>
              </div>
            {:else}
              <!-- 검색 및 필터 -->
              <div class="mb-6 space-y-4">
                <div class="flex flex-col sm:flex-row gap-4">
                  <div class="flex-1">
                    <input
                      type="text"
                      bind:value={searchQuery}
                      placeholder="이름, 이메일, 부서로 검색..."
                      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style:border-color="var(--color-border)"
                      style:background="var(--color-input-background)"
                      style:color="var(--color-text)"
                    />
                  </div>
                  <div class="flex gap-2">
                    <select
                      bind:value={departmentFilter}
                      class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style:border-color="var(--color-border)"
                      style:background="var(--color-input-background)"
                      style:color="var(--color-text)"
                    >
                      <option value="">전체 부서</option>
                      <option value="대표">대표</option>
                      <option value="전략기획실">전략기획실</option>
                      <option value="연구소">연구소</option>
                      {#each departments.filter((d) => !['대표', '전략기획실', '연구소', '부서없음'].includes(d.name)) as dept, idx (idx)}
                        <!-- TODO: replace index key with a stable id when model provides one -->
                        <option value={dept.name}>{dept.name}</option>
                      {/each}
                      <option value="부서없음">부서없음</option>
                    </select>
                    <select
                      bind:value={statusFilter}
                      class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style:border-color="var(--color-border)"
                      style:background="var(--color-input-background)"
                      style:color="var(--color-text)"
                    >
                      <option value="">전체 상태</option>
                      <option value="active">재직중</option>
                      <option value="on-leave">휴직중</option>
                      <option value="terminated">퇴사</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 팀별 직원 카드 그리드 -->
              <div class="space-y-8">
                {#each Object.keys(paginatedGroupedEmployees) as teamName (teamName)}
                  <div class="space-y-4">
                    <!-- 팀 헤더 -->
                    <div
                      class="flex items-center gap-3 pb-2 border-b"
                      style:border-color="var(--color-border)"
                    >
                      <BuildingIcon size={20} style="color: var(--color-primary);" />
                      <h3 class="text-lg font-semibold" style:color="var(--color-text)">
                        {teamName}
                      </h3>
                      <span
                        class="text-sm px-2 py-1 rounded-full"
                        style:background="var(--color-primary-light)"
                        style:color="var(--color-primary)"
                      >
                        {paginatedGroupedEmployees[teamName]?.length || 0}명
                      </span>
                    </div>

                    <!-- 팀 내 직원 카드 그리드 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {#each paginatedGroupedEmployees[teamName] || [] as employee, i (i)}
                        <div
                          class="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden {isTeamLead(
                            employee,
                          )
                            ? 'ring-2 ring-yellow-400/50 shadow-lg'
                            : employee.employment_type === 'contract'
                              ? 'ring-2 ring-purple-400/50 shadow-md'
                              : employee.termination_date &&
                                  new Date(employee.termination_date) > new Date()
                                ? 'ring-2 ring-red-400/50 shadow-md'
                                : ''}"
                          style={isTeamLead(employee)
                            ? 'border-color: var(--color-warning); background: linear-gradient(135deg, var(--color-surface-elevated) 0%, rgba(251, 191, 36, 0.05) 100%);'
                            : employee.employment_type === 'contract'
                              ? 'border-color: var(--color-primary); background: linear-gradient(135deg, var(--color-surface-elevated) 0%, rgba(147, 51, 234, 0.05) 100%);'
                              : employee.termination_date &&
                                  new Date(employee.termination_date) > new Date()
                                ? 'border-color: #dc2626; background: linear-gradient(135deg, var(--color-surface-elevated) 0%, rgba(220, 38, 38, 0.08) 100%);'
                                : 'border-color: var(--color-border); background: var(--color-surface-elevated);'}
                        >
                          <!-- 직원 헤더 -->
                          <div class="flex items-start justify-between mb-3 min-w-0">
                            <div class="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                class="w-12 h-12 rounded-full bg-gradient-to-br {employee.employment_type ===
                                'contract'
                                  ? 'from-purple-500 to-pink-600'
                                  : employee.termination_date &&
                                      new Date(employee.termination_date) > new Date()
                                    ? 'from-red-500 to-red-700'
                                    : 'from-blue-500 to-purple-600'} flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md"
                              >
                                {employee.last_name.charAt(0)}
                              </div>
                              <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2 min-w-0">
                                  <h4
                                    class="font-semibold text-lg truncate"
                                    style:color="var(--color-text)"
                                  >
                                    {formatEmployeeName(employee)}
                                  </h4>
                                  {#if isTeamLead(employee)}
                                    <span
                                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm flex-shrink-0"
                                    >
                                      👑 팀 리더
                                    </span>
                                  {/if}
                                  {#if employee.employment_type === 'contract'}
                                    <span
                                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md flex-shrink-0 animate-pulse"
                                    >
                                      📋 계약직
                                    </span>
                                  {/if}
                                  {#if employee.termination_date && new Date(employee.termination_date) > new Date()}
                                    <span
                                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md flex-shrink-0 animate-pulse"
                                    >
                                      ⚠️ 퇴사 예정
                                    </span>
                                  {/if}
                                </div>
                                <p
                                  class="text-sm truncate"
                                  style:color="var(--color-text-secondary)"
                                >
                                  {formatEmployeeIdDisplay(
                                    employee.employee_id,
                                    employees.indexOf(employee),
                                  )}
                                </p>
                              </div>
                            </div>
                            <div class="flex flex-col gap-1 items-end flex-shrink-0 ml-2">
                              <ThemeBadge
                                variant={employee.status === 'active'
                                  ? 'success'
                                  : employee.status === 'terminated'
                                    ? 'error'
                                    : 'warning'}
                                size="sm"
                                shape="pill"
                              >
                                {employee.status === 'active'
                                  ? '재직중'
                                  : employee.status === 'terminated'
                                    ? '퇴사'
                                    : employee.status === 'on-leave'
                                      ? '휴직'
                                      : '비활성'}
                              </ThemeBadge>
                            </div>
                          </div>

                          <!-- 직원 정보 -->
                          <div class="space-y-2 mb-4">
                            <div class="flex items-center gap-2 min-w-0">
                              <BuildingIcon
                                size={16}
                                style="color: var(--color-text-secondary);"
                                class="flex-shrink-0"
                              />
                              <span class="text-sm truncate" style:color="var(--color-text)"
                                >{employee.department}</span
                              >
                            </div>
                            <div class="flex items-center gap-2 min-w-0">
                              <UserCheckIcon
                                size={16}
                                style="color: var(--color-text-secondary);"
                                class="flex-shrink-0"
                              />
                              <span class="text-sm truncate" style:color="var(--color-text)">
                                {employee.job_title_name || employee.position}
                              </span>
                            </div>
                            <div class="flex items-center gap-2 min-w-0">
                              <MailIcon
                                size={16}
                                style="color: var(--color-text-secondary);"
                                class="flex-shrink-0"
                              />
                              <span
                                class="text-sm truncate"
                                style:color="var(--color-text-secondary)">{employee.email}</span
                              >
                            </div>
                            {#if employee.phone}
                              <div class="flex items-center gap-2 min-w-0">
                                <PhoneIcon
                                  size={16}
                                  style="color: var(--color-text-secondary);"
                                  class="flex-shrink-0"
                                />
                                <span
                                  class="text-sm truncate"
                                  style:color="var(--color-text-secondary)">{employee.phone}</span
                                >
                              </div>
                            {/if}
                            {#if getCurrentSalary(employee.id)}
                              {@const currentSalary = getCurrentSalary(employee.id)}
                              <div class="flex items-center gap-2 min-w-0">
                                <DollarSignIcon
                                  size={16}
                                  style="color: var(--color-text-secondary);"
                                  class="flex-shrink-0"
                                />
                                <div class="bg-gray-100 px-2 py-1 rounded border border-gray-300">
                                  <span class="text-sm font-medium truncate text-gray-600">
                                    {Math.round((currentSalary?.annualSalary || 0) / 10000)}만원
                                  </span>
                                  <span class="text-xs text-gray-500 ml-1">
                                    ({currentSalary?.contractType === 'full_time'
                                      ? '정규직'
                                      : currentSalary?.contractType === 'contractor'
                                        ? '계약직'
                                        : currentSalary?.contractType === 'part_time'
                                          ? '파트타임'
                                          : currentSalary?.contractType === 'intern'
                                            ? '인턴'
                                            : currentSalary?.contractType || '미정'})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onclick={() => {
                                    // 급여 관리 페이지로 이동
                                    window.location.href = '/salary'
                                  }}
                                  class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors shadow-sm"
                                  title="급여 수정은 근로계약서를 통해 관리됩니다"
                                >
                                  급여 관리
                                </button>
                              </div>
                            {:else}
                              <div class="flex items-center gap-2 min-w-0">
                                <DollarSignIcon
                                  size={16}
                                  style="color: var(--color-text-secondary);"
                                  class="flex-shrink-0"
                                />
                                <span class="text-sm text-gray-400 truncate"> 계약 정보 없음 </span>
                              </div>
                            {/if}
                            {#if employee.hire_date}
                              <div class="flex items-center gap-2 min-w-0">
                                <CalendarIcon
                                  size={16}
                                  style="color: var(--color-text-secondary);"
                                  class="flex-shrink-0"
                                />
                                <span
                                  class="text-sm truncate"
                                  style:color="var(--color-text-secondary)"
                                >
                                  입사일: {formatDate(employee.hire_date)}
                                </span>
                              </div>
                            {/if}
                            {#if employee.birth_date}
                              <div class="flex items-center gap-2 min-w-0">
                                <CalendarIcon
                                  size={16}
                                  style="color: var(--color-text-secondary);"
                                  class="flex-shrink-0"
                                />
                                <span
                                  class="text-sm truncate"
                                  style:color="var(--color-text-secondary)"
                                >
                                  생일: {formatDate(employee.birth_date)}
                                </span>
                              </div>
                            {/if}
                            {#if employee.termination_date}
                              {@const terminationDate = new Date(employee.termination_date)}
                              {@const today = new Date()}
                              {@const isFuture = terminationDate > today}
                              {@const daysLeft = isFuture
                                ? Math.ceil(
                                    (terminationDate.getTime() - today.getTime()) /
                                      (1000 * 60 * 60 * 24),
                                  )
                                : null}
                              <div class="flex items-center gap-2 min-w-0">
                                <CalendarIcon
                                  size={16}
                                  style="color: {isFuture
                                    ? 'var(--color-warning)'
                                    : 'var(--color-error)'};"
                                  class="flex-shrink-0"
                                />
                                <span
                                  class="text-sm truncate"
                                  style:color={isFuture
                                    ? 'var(--color-warning)'
                                    : 'var(--color-error)'}
                                >
                                  {isFuture ? '퇴사(예정)일' : '퇴사일'}: {formatDate(
                                    employee.termination_date,
                                  )}
                                  {#if isFuture && daysLeft !== null}
                                    <span class="ml-1 font-medium">({daysLeft}일 남음)</span>
                                  {/if}
                                </span>
                              </div>
                            {/if}
                            <!-- 재직 상태 정보 -->
                            <div
                              class="flex items-center gap-2 pt-2 border-t min-w-0"
                              style:border-color="var(--color-border)"
                            >
                              <div
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                style:background={employee.status === 'active'
                                  ? 'var(--color-success)'
                                  : employee.status === 'terminated'
                                    ? 'var(--color-error)'
                                    : 'var(--color-warning)'}
                              ></div>
                              <span
                                class="text-xs font-medium truncate"
                                style:color="var(--color-text-secondary)"
                              >
                                {employee.status === 'active'
                                  ? '재직중'
                                  : employee.status === 'terminated'
                                    ? '퇴사'
                                    : employee.status === 'on-leave'
                                      ? '휴직중'
                                      : '비활성'}
                              </span>
                            </div>
                          </div>

                          <!-- 액션 버튼 -->
                          <div
                            class="flex items-center gap-2 pt-3 border-t min-w-0"
                            style:border-color="var(--color-border)"
                          >
                            <ThemeButton
                              variant="ghost"
                              size="sm"
                              class="flex-1 min-w-0"
                              onclick={() => openEditEmployeeModal(employee)}
                            >
                              <EditIcon size={16} />
                              수정
                            </ThemeButton>
                            <ThemeButton
                              variant="ghost"
                              size="sm"
                              class="flex-1 min-w-0"
                              onclick={() => openDeleteEmployeeModal(employee)}
                            >
                              <TrashIcon size={16} />
                              삭제
                            </ThemeButton>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>

              <!-- 페이지네이션 -->
              {#if totalPages > 1}
                <div class="flex items-center justify-center gap-2 mt-6">
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 1}
                    onclick={() => setCurrentPage(currentPage - 1)}
                  >
                    이전
                  </ThemeButton>
                  {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
                    <ThemeButton
                      variant={page === currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onclick={() => setCurrentPage(page)}
                    >
                      {page}
                    </ThemeButton>
                  {/each}
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onclick={() => setCurrentPage(currentPage + 1)}
                  >
                    다음
                  </ThemeButton>
                </div>
              {/if}
            {/if}
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'recruitment'}
        <!-- 채용관리 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">채용 공고</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                class="flex items-center gap-2"
                onclick={() => {
                  // TODO: 채용 공고 등록 모달 열기
                  alert('채용 공고 등록 기능은 준비 중입니다.')
                }}
              >
                <PlusIcon size={16} />
                공고 등록
              </ThemeButton>
            </div>

            <div class="space-y-4">
              {#each recentJobPostings as job (job.id ?? `${job.createdAt}:${job.title}`)}
                <!-- TODO: replace index key with a stable id when model provides one -->
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex-1">
                    <h4 class="font-medium" style:color="var(--color-text)">
                      {job.title}
                    </h4>
                    <p class="text-sm" style:color="var(--color-text-secondary)">
                      {job.department} • {job.employmentType}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                      <ThemeBadge variant={job.status === 'published' ? 'success' : 'warning'}>
                        {job.status === 'published' ? '모집중' : '마감'}
                      </ThemeBadge>
                      <span class="text-xs" style:color="var(--color-text-secondary)">
                        {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => {
                        // TODO: 채용 공고 상세 보기
                        alert('채용 공고 상세 보기 기능은 준비 중입니다.')
                      }}
                    >
                      <EyeIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => {
                        // TODO: 채용 공고 수정
                        alert('채용 공고 수정 기능은 준비 중입니다.')
                      }}
                    >
                      <EditIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'departments'}
        <!-- 부서관리 탭 -->
        <ThemeSpacer size={6}>
          <!-- 부서 관리 -->
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">부서 관리</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                class="flex items-center gap-2"
                onclick={openAddDepartmentModal}
              >
                <PlusIcon size={16} />
                부서 추가
              </ThemeButton>
            </div>

            <div class="space-y-3">
              {#each sortedDepartments as department (department.id)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex items-center gap-4">
                    <BuildingIcon size={24} style="color: var(--color-primary);" />
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-1">
                        <h4 class="font-semibold text-lg" style:color="var(--color-text)">
                          {department.name}
                        </h4>
                        <ThemeBadge
                          variant={department.status === 'active' ? 'success' : 'warning'}
                        >
                          {department.status === 'active' ? '활성' : '비활성'}
                        </ThemeBadge>
                      </div>
                      {#if department.description}
                        <p class="text-sm mb-2" style:color="var(--color-text-secondary)">
                          {department.description}
                        </p>
                      {/if}
                      <!-- 부서 정보 -->
                      <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                          <CalendarIcon size={14} style="color: var(--color-text-secondary);" />
                          <span class="text-xs" style:color="var(--color-text-secondary)">
                            생성일: {formatDate(department.created_at)}
                          </span>
                        </div>
                      </div>
                      <!-- T/O 정보 -->
                      <div class="flex items-center gap-4 mt-2">
                        <div class="flex items-center gap-2">
                          <UsersIcon size={16} style="color: var(--color-text-secondary);" />
                          <span class="text-sm font-medium" style:color="var(--color-text)">
                            {employees?.filter(
                              (emp: Employee) =>
                                emp.status === 'active' && emp.department === department.name,
                            ).length || 0}
                            {#if department.max_employees !== undefined && department.max_employees > 0}
                              / {department.max_employees}
                            {:else}
                              / ∞
                            {/if}
                          </span>
                        </div>
                        {#if department.max_employees !== undefined && department.max_employees > 0}
                          {@const currentCount =
                            employees?.filter(
                              (emp: Employee) =>
                                emp.status === 'active' && emp.department === department.name,
                            ).length || 0}
                          {@const maxCount = department.max_employees}
                          <div class="flex items-center gap-2">
                            <div
                              class="w-2 h-2 rounded-full"
                              style:background-color={currentCount > maxCount
                                ? 'var(--color-error)'
                                : currentCount === maxCount
                                  ? 'var(--color-warning)'
                                  : 'var(--color-success)'}
                            ></div>
                            <span
                              class="text-xs font-medium"
                              style:color="var(--color-text-secondary)"
                            >
                              {currentCount > maxCount
                                ? '정원초과'
                                : currentCount === maxCount
                                  ? '정원충족'
                                  : '여유'}
                            </span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => openEditDepartmentModal(department)}
                    >
                      <EditIcon size={16} />
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => handleDepartmentDelete(department)}
                    >
                      <TrashIcon size={16} />
                    </ThemeButton>
                  </div>
                </div>
              {/each}

              {#if departments.length === 0}
                <div class="text-center py-12">
                  <BuildingIcon
                    size={64}
                    class="mx-auto mb-4"
                    style="color: var(--color-text-secondary);"
                  />
                  <h3 class="text-lg font-medium mb-2" style:color="var(--color-text)">
                    등록된 부서가 없습니다
                  </h3>
                  <p class="text-sm mb-4" style:color="var(--color-text-secondary)">
                    새 부서를 추가하여 조직을 구성해보세요.
                  </p>
                  <ThemeButton
                    variant="primary"
                    onclick={openAddDepartmentModal}
                    class="flex items-center gap-2"
                  >
                    <PlusIcon size={16} />
                    첫 부서 추가하기
                  </ThemeButton>
                </div>
              {/if}
            </div>
          </ThemeCard>

          <!-- 부서 관리 안내 -->
          <ThemeCard class="p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">부서 관리 안내</h3>
            </div>
            <div class="space-y-3">
              <h4 class="font-medium" style:color="var(--color-text)">부서 관리 규칙</h4>
              <ul class="text-sm space-y-2" style:color="var(--color-text-secondary)">
                <li>• 부서명은 중복될 수 없습니다</li>
                <li>• 부서를 삭제하면 해당 부서의 직원들에게 영향을 줄 수 있습니다</li>
                <li>• 비활성화된 부서는 새 직원 배치 시 선택할 수 없습니다</li>
                <li>• 부서 설명은 선택사항이며, 부서의 역할과 책임을 명시할 수 있습니다</li>
              </ul>
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'positions'}
        <!-- 직급관리 탭 -->
        <ThemeSpacer size={6}>
          <div class="space-y-6">
            <!-- 직급 카테고리별 관리 -->
            {#each Object.entries(getPositionsByCategory()) as [category, categoryPositions] (category)}
              <ThemeCard class="p-6">
                <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-3">
                    {#if category === '연구원'}
                      <FlaskConicalIcon size={24} style="color: var(--color-primary);" />
                    {:else if category === '디자이너'}
                      <UsersIcon size={24} style="color: var(--color-primary);" />
                    {:else if category === '행정원'}
                      <BuildingIcon size={24} style="color: var(--color-primary);" />
                    {/if}
                    <div>
                      <h3 class="text-xl font-semibold" style:color="var(--color-text)">
                        {category} 직급 관리
                      </h3>
                      <p class="text-sm" style:color="var(--color-text-secondary)">
                        {categoryPositions.length}개 직급
                      </p>
                    </div>
                  </div>
                  <ThemeButton
                    variant="primary"
                    size="sm"
                    class="flex items-center gap-2"
                    onclick={() => openAddPositionModal(category)}
                  >
                    <PlusIcon size={16} />
                    {category} 직급 추가
                  </ThemeButton>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each categoryPositions as position, i (i)}
                    <div
                      class="p-4 rounded-lg border"
                      style:border-color="var(--color-border)"
                      style:background="var(--color-surface-elevated)"
                    >
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <h4 class="font-medium" style:color="var(--color-text)">
                            {position.name || position.title}
                          </h4>
                          <p class="text-sm" style:color="var(--color-text-secondary)">
                            {position.department || position.department_id}
                          </p>
                          <div class="flex items-center gap-2 mt-2">
                            <ThemeBadge variant="default" size="sm">
                              레벨 {position.level}
                            </ThemeBadge>
                            <ThemeBadge
                              variant={position.status === 'active' ? 'success' : 'warning'}
                              size="sm"
                            >
                              {position.status === 'active' ? '활성' : '비활성'}
                            </ThemeBadge>
                          </div>
                        </div>
                        <div class="flex items-center gap-1">
                          <ThemeButton
                            variant="ghost"
                            size="sm"
                            onclick={() => openEditPositionModal(position)}
                          >
                            <EditIcon size={14} />
                          </ThemeButton>
                          <ThemeButton
                            variant="ghost"
                            size="sm"
                            onclick={() => handlePositionDelete(position)}
                          >
                            <TrashIcon size={14} />
                          </ThemeButton>
                        </div>
                      </div>
                      {#if position.description}
                        <p class="text-xs" style:color="var(--color-text-secondary)">
                          {position.description}
                        </p>
                      {/if}
                    </div>
                  {/each}

                  {#if categoryPositions.length === 0}
                    <div class="col-span-full text-center py-8">
                      {#if category === '연구원'}
                        <FlaskConicalIcon
                          size={48}
                          class="mx-auto mb-4"
                          style="color: var(--color-text-secondary);"
                        />
                      {:else if category === '디자이너'}
                        <UsersIcon
                          size={48}
                          class="mx-auto mb-4"
                          style="color: var(--color-text-secondary);"
                        />
                      {:else if category === '행정원'}
                        <BuildingIcon
                          size={48}
                          class="mx-auto mb-4"
                          style="color: var(--color-text-secondary);"
                        />
                      {/if}
                      <p class="text-sm" style:color="var(--color-text-secondary)">
                        {category} 직급이 등록되지 않았습니다.
                      </p>
                    </div>
                  {/if}
                </div>
              </ThemeCard>
            {/each}

            <!-- 직급 관리 안내 -->
            <ThemeCard class="p-6">
              <div class="mb-6">
                <h3 class="text-lg font-semibold" style:color="var(--color-text)">
                  직급 관리 안내
                </h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-3">
                  <h4 class="font-medium flex items-center gap-2" style:color="var(--color-text)">
                    <FlaskConicalIcon size={16} style="color: var(--color-primary);" />
                    연구원 직급
                  </h4>
                  <ul class="text-sm space-y-1" style:color="var(--color-text-secondary)">
                    <li>• 연구원 → 주임연구원</li>
                    <li>• 선임연구원 → 책임연구원</li>
                    <li>• 수석연구원</li>
                  </ul>
                </div>
                <div class="space-y-3">
                  <h4 class="font-medium flex items-center gap-2" style:color="var(--color-text)">
                    <UsersIcon size={16} style="color: var(--color-primary);" />
                    디자이너 직급
                  </h4>
                  <ul class="text-sm space-y-1" style:color="var(--color-text-secondary)">
                    <li>• 디자이너 → 주임디자이너</li>
                    <li>• 선임디자이너 → 책임디자이너</li>
                    <li>• 수석디자이너</li>
                  </ul>
                </div>
                <div class="space-y-3">
                  <h4 class="font-medium flex items-center gap-2" style:color="var(--color-text)">
                    <BuildingIcon size={16} style="color: var(--color-primary);" />
                    행정원 직급
                  </h4>
                  <ul class="text-sm space-y-1" style:color="var(--color-text-secondary)">
                    <li>• 행정원 → 주임행정원</li>
                    <li>• 선임행정원 → 책임행정원</li>
                    <li>• 수석행정원</li>
                  </ul>
                </div>
              </div>
            </ThemeCard>
          </div>
        </ThemeSpacer>
      {:else if tab.id === 'executives'}
        <!-- 이사관리 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">이사 관리</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                class="flex items-center gap-2"
                onclick={() => openAddExecutiveModal()}
              >
                <PlusIcon size={16} />
                이사 추가
              </ThemeButton>
            </div>

            <div class="space-y-3">
              {#if executiveLoading}
                <div class="flex items-center justify-center py-8">
                  <div class="text-sm" style:color="var(--color-text-secondary)">
                    이사 데이터를 불러오는 중...
                  </div>
                </div>
              {:else if executives.length === 0}
                <div class="text-center py-8">
                  <BriefcaseIcon
                    size={48}
                    class="mx-auto mb-4"
                    style="color: var(--color-text-secondary);"
                  />
                  <p class="text-sm" style:color="var(--color-text-secondary)">
                    등록된 이사가 없습니다.
                  </p>
                </div>
              {:else}
                {#each executives as executive (executive.id)}
                  <div
                    class="flex items-center justify-between p-4 rounded-lg border"
                    style:border-color="var(--color-border)"
                    style:background="var(--color-surface-elevated)"
                  >
                    <div class="flex items-center gap-4">
                      <BriefcaseIcon size={24} style="color: var(--color-primary);" />
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                          <h4 class="font-semibold text-lg" style:color="var(--color-text)">
                            {executive.name}
                          </h4>
                          <ThemeBadge
                            variant={executive.status === 'active' ? 'success' : 'warning'}
                          >
                            {executive.status === 'active' ? '활성' : '비활성'}
                          </ThemeBadge>
                        </div>
                        <div class="flex items-center gap-4">
                          <div class="flex items-center gap-2">
                            <BriefcaseIcon size={14} style="color: var(--color-text-secondary);" />
                            <span class="text-sm" style:color="var(--color-text)">
                              {executive.job_title_name || executive.position}
                            </span>
                          </div>
                          <div class="flex items-center gap-2">
                            <BuildingIcon size={14} style="color: var(--color-text-secondary);" />
                            <span class="text-sm" style:color="var(--color-text)">
                              {executive.department}
                            </span>
                          </div>
                          <div class="flex items-center gap-2">
                            <UserCheckIcon size={14} style="color: var(--color-text-secondary);" />
                            <span class="text-xs" style:color="var(--color-text-secondary)">
                              레벨: {executive.job_title_level || executive.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => openEditExecutiveModal(executive)}
                      >
                        <EditIcon size={16} />
                        수정
                      </ThemeButton>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => handleExecutiveDelete(executive)}
                      >
                        <TrashIcon size={16} />
                        삭제
                      </ThemeButton>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'job-titles'}
        <!-- 직책관리 탭 -->
        <ThemeSpacer size={6}>
          <ThemeCard class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold" style:color="var(--color-text)">직책 관리</h3>
              <ThemeButton
                variant="primary"
                size="sm"
                class="flex items-center gap-2"
                onclick={openAddJobTitleModal}
              >
                <PlusIcon size={16} />
                직책 추가
              </ThemeButton>
            </div>

            <div class="space-y-3">
              {#each jobTitles as jobTitle (jobTitle.id)}
                <div
                  class="flex items-center justify-between p-4 rounded-lg border"
                  style:border-color="var(--color-border)"
                  style:background="var(--color-surface-elevated)"
                >
                  <div class="flex items-center gap-4">
                    <BriefcaseIcon size={24} style="color: var(--color-primary);" />
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-1">
                        <h4 class="font-semibold text-lg" style:color="var(--color-text)">
                          {jobTitle.name || jobTitle.title}
                        </h4>
                        <ThemeBadge variant={jobTitle.status === 'active' ? 'success' : 'warning'}>
                          {jobTitle.status === 'active' ? '활성' : '비활성'}
                        </ThemeBadge>
                      </div>
                      {#if jobTitle.description}
                        <p class="text-sm mb-2" style:color="var(--color-text-secondary)">
                          {jobTitle.description}
                        </p>
                      {/if}
                      <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                          <CalendarIcon size={14} style="color: var(--color-text-secondary);" />
                          <span class="text-xs" style:color="var(--color-text-secondary)">
                            생성일: {formatDate(jobTitle.created_at)}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <UserCheckIcon size={14} style="color: var(--color-text-secondary);" />
                          <span class="text-xs" style:color="var(--color-text-secondary)">
                            레벨: {jobTitle.level}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <TagIcon size={14} style="color: var(--color-text-secondary);" />
                          <span class="text-xs" style:color="var(--color-text-secondary)">
                            카테고리: {jobTitle.category || '미분류'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => openEditJobTitleModal(jobTitle)}
                    >
                      <EditIcon size={16} />
                      수정
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => handleJobTitleDelete(jobTitle)}
                    >
                      <TrashIcon size={16} />
                      삭제
                    </ThemeButton>
                  </div>
                </div>
              {/each}

              {#if jobTitles.length === 0}
                <div class="text-center py-8">
                  <BriefcaseIcon
                    size={48}
                    class="mx-auto mb-4"
                    style="color: var(--color-text-secondary);"
                  />
                  <p class="text-sm" style:color="var(--color-text-secondary)">
                    등록된 직책이 없습니다.
                  </p>
                </div>
              {/if}
            </div>
          </ThemeCard>
        </ThemeSpacer>
      {:else if tab.id === 'org-chart'}
        <!-- 조직도 탭 -->
        <OrganizationChart />
      {/if}
    {/snippet}
  </ThemeTabs>

  <!-- 엑셀 업로드 모달 -->
  <ThemeModal open={showUploadModal} onclose={closeUploadModal} size="md">
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4" style:color="var(--color-text)">
        직원 정보 엑셀 업로드
      </h2>
      <!-- 파일 선택 -->
      <div>
        <label
          for="employee-file-input"
          class="block text-sm font-medium mb-2"
          style:color="var(--color-text)"
        >
          엑셀 파일 선택
        </label>

        <!-- 드래그 앤 드롭 영역 -->
        <div
          class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
          class:drag-over={isDragOver}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          onclick={() => document.getElementById('employee-file-input')?.click()}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              document.getElementById('employee-file-input')?.click()
            }
          }}
          role="button"
          tabindex="0"
          aria-label="파일 업로드 영역 - 클릭하거나 파일을 드래그하여 업로드하세요"
          style:border-color="var(--color-border)"
          style:background="var(--color-surface)"
        >
          {#if uploadFile}
            <div class="flex items-center justify-center space-x-2">
              <FileSpreadsheetIcon size={24} style="color: var(--color-primary);" />
              <span style:color="var(--color-text)">{uploadFile.name}</span>
            </div>
          {:else}
            <div class="space-y-2">
              <FileSpreadsheetIcon
                size={48}
                class="mx-auto"
                style="color: var(--color-text-secondary);"
              />
              <p style:color="var(--color-text)">파일을 여기에 드래그하거나 클릭하여 선택하세요</p>
              <p class="text-sm" style:color="var(--color-text-secondary)">
                CSV, XLSX, XLS 파일 지원
              </p>
            </div>
          {/if}
        </div>

        <!-- 숨겨진 파일 입력 -->
        <input
          id="employee-file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onchange={handleFileSelect}
          class="hidden"
        />
      </div>

      <!-- 선택된 파일 정보 -->
      {#if uploadFile}
        <div
          class="p-3 rounded-lg"
          style:background="var(--color-surface-elevated)"
          style:border="1px solid var(--color-border)"
        >
          <div class="flex items-center gap-2">
            <FileSpreadsheetIcon size={16} style="color: var(--color-primary);" />
            <span class="text-sm font-medium" style:color="var(--color-text)"
              >{uploadFile.name}</span
            >
            <span class="text-xs" style:color="var(--color-text-secondary)">
              ({(uploadFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        </div>
      {/if}

      <!-- 업로드 진행률 -->
      {#if uploadStatus === 'uploading'}
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span style:color="var(--color-text-secondary)">업로드 진행률</span>
            <span style:color="var(--color-text)">{uploadProgress}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              style:width="{uploadProgress}%"
              style:background="var(--color-primary)"
            ></div>
          </div>
        </div>
      {/if}

      <!-- 상태 메시지 -->
      {#if uploadMessage}
        <div
          class="flex items-center gap-2 p-3 rounded-lg"
          style:background={uploadStatus === 'success'
            ? 'var(--color-success-light)'
            : uploadStatus === 'error'
              ? 'var(--color-error-light)'
              : 'var(--color-info-light)'}
          style:border="1px solid {uploadStatus === 'success'
            ? 'var(--color-success)'
            : uploadStatus === 'error'
              ? 'var(--color-error)'
              : 'var(--color-info)'}"
        >
          {#if uploadStatus === 'success'}
            <CheckCircleIcon size={16} style="color: var(--color-success);" />
          {:else if uploadStatus === 'error'}
            <AlertCircleIcon size={16} style="color: var(--color-error);" />
          {/if}
          <span
            class="text-sm"
            style:color={uploadStatus === 'success'
              ? 'var(--color-success)'
              : uploadStatus === 'error'
                ? 'var(--color-error)'
                : 'var(--color-info)'}
          >
            {uploadMessage}
          </span>
        </div>
      {/if}

      <!-- 엑셀 템플릿 다운로드 -->
      <div
        class="p-4 rounded-lg"
        style:background="var(--color-surface-elevated)"
        style:border="1px solid var(--color-border)"
      >
        <h4 class="text-sm font-medium mb-2" style:color="var(--color-text)">엑셀 템플릿</h4>
        <p class="text-xs mb-3" style:color="var(--color-text-secondary)">
          직원 데이터를 업로드하기 전에 템플릿을 다운로드하여 올바른 형식으로 데이터를 입력하세요.
        </p>
        <ThemeButton variant="ghost" size="sm" onclick={downloadEmployeeTemplate}>
          <DownloadIcon size={16} class="mr-2" />
          템플릿 다운로드
        </ThemeButton>
      </div>
    </div>

    <!-- 모달 액션 버튼 -->
    <div class="flex justify-end gap-2 pt-4 border-t" style:border-color="var(--color-border)">
      <ThemeButton variant="ghost" onclick={closeUploadModal}>취소</ThemeButton>
      <ThemeButton
        variant="primary"
        onclick={uploadExcel}
        disabled={!uploadFile || uploadStatus === 'uploading'}
      >
        {uploadStatus === 'uploading' ? '업로드 중...' : '업로드'}
      </ThemeButton>
    </div>
  </ThemeModal>
</PageLayout>

<!-- 직원 추가/수정 모달 -->
<EmployeeModal
  open={showEmployeeModal}
  employee={selectedEmployee as any}
  loading={employeeLoading}
  {departments}
  {positions}
  {jobTitles}
  on:close={() => {
    showEmployeeModal = false
    selectedEmployee = null
  }}
  on:save={handleEmployeeSave}
/>

<!-- 직원 삭제 확인 모달 -->
<DeleteConfirmModal
  open={showDeleteModal}
  title="직원 삭제"
  message="이 직원을 삭제하시겠습니까?"
  itemName={selectedEmployee
    ? `${formatEmployeeName(selectedEmployee)} (${selectedEmployee.department})`
    : ''}
  loading={deleteLoading}
  showArchive={true}
  on:close={() => {
    showDeleteModal = false
    selectedEmployee = null
  }}
  on:confirm={(event) => handleEmployeeDelete(event.detail.action)}
/>

<!-- 부서 관리 모달 -->
<DepartmentModal
  open={showDepartmentModal}
  department={selectedDepartment as any}
  loading={departmentLoading}
  on:close={() => {
    showDepartmentModal = false
    selectedDepartment = null
  }}
  on:save={handleDepartmentSave}
/>

<!-- 직급 관리 모달 -->
<PositionModal
  open={showPositionModal}
  position={selectedPosition as any}
  {departments}
  loading={positionLoading}
  on:close={() => {
    showPositionModal = false
    selectedPosition = null
  }}
  on:save={handlePositionSave}
/>

<style>
  .drag-over {
    border-color: var(--color-primary) !important;
    background: var(--color-primary-light) !important;
  }
</style>
