<script lang="ts">
  import { logger } from '$lib/utils/logger'
  import { onMount } from 'svelte'

  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import ThemeModal from '$lib/components/ui/ThemeModal.svelte'
  import ProjectBudgetModal from './ProjectBudgetModal.svelte'
  import ProjectMemberForm from './ProjectMemberForm.svelte'
  import EvidenceDetailModal from './EvidenceDetailModal.svelte'
  import EvidenceAddModal from './EvidenceAddModal.svelte'
  import ProjectEditModal from './ProjectEditModal.svelte'
  import ProjectDeleteConfirmModal from './ProjectDeleteConfirmModal.svelte'
  import ValidationResultModal from './ValidationResultModal.svelte'
  import BudgetUpdateConfirmModal from './BudgetUpdateConfirmModal.svelte'
  import { formatCurrency, formatDate, formatDateForInput, formatNumber } from '$lib/utils/format'
  import { isKoreanName } from '$lib/utils/korean-name'
  import { calculateMonthlySalary } from '$lib/utils/salary-calculator'
  import {
    AlertTriangleIcon,
    CalendarIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    DollarSignIcon,
    EditIcon,
    FileTextIcon,
    PlusIcon,
    RefreshCwIcon,
    ShieldAlertIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserIcon,
    UsersIcon,
    XIcon,
  } from '@lucide/svelte'
  import { createEventDispatcher } from 'svelte'

  // Import utility functions (will replace local duplicates incrementally)
  import * as budgetUtilsImported from './utils/budgetUtils'
  import * as memberUtilsImported from './utils/memberUtils'
  import * as projectUtilsImported from './utils/projectUtils'
  import * as evidenceUtilsImported from './utils/evidenceUtils'
  import * as validationUtilsImported from './utils/validationUtils'
  import * as calculationUtilsImported from './utils/calculationUtils'
  import type { ValidationIssue, MemberValidationStatus } from './utils/validationUtils'

  const dispatch = createEventDispatcher()

  // 예산 데이터 필드 접근 유틸리티 함수들
  // 연차 정보 기반 프로젝트 기간 계산
  async function updateProjectPeriodFromBudgets() {
    if (!selectedProject?.id) return

    try {
      const response = await fetch(
        `/api/project-management/projects/${selectedProject.id}/annual-budgets`,
      )
      const result = await response.json()

      if (result.success && result.data?.budgets && result.data.budgets.length > 0) {
        const budgets = result.data.budgets
        const firstBudget = budgets[0]
        const lastBudget = budgets[budgets.length - 1]

        if (firstBudget.startDate && lastBudget.endDate) {
          const periodElement = document.getElementById('project-period')
          if (periodElement) {
            periodElement.textContent = `${formatDate(firstBudget.startDate)} ~ ${formatDate(lastBudget.endDate)}`
          }
        } else {
          const periodElement = document.getElementById('project-period')
          if (periodElement) {
            periodElement.textContent = '연차별 기간 정보 없음'
          }
        }
      } else {
        const periodElement = document.getElementById('project-period')
        if (periodElement) {
          periodElement.textContent = '연차별 예산 정보 없음'
        }
      }
    } catch (error) {
      logger.error('프로젝트 기간 업데이트 실패:', error)
      const periodElement = document.getElementById('project-period')
      if (periodElement) {
        periodElement.textContent = '기간 정보 로드 실패'
      }
    }
  }

  // 멤버 데이터 필드 접근 유틸리티 함수들
  let {
    selectedProject,
    externalRefreshTrigger = 0,
  }: { selectedProject: any; externalRefreshTrigger?: number } = $props()

  // 프로젝트 변경 시 기간 업데이트
  function handleProjectChange() {
    if (selectedProject?.id) {
      updateProjectPeriodFromBudgets()
    }
  }

  // ============================================================
  // Phase B-1: Grouped State Management - Modal States
  // ============================================================
  let modalStates = $state({
    budget: false, // showBudgetModal
    member: false, // _showMemberModal
    editProject: false, // showEditProjectModal
    deleteConfirm: false, // showDeleteConfirmModal
    evidence: false, // showEvidenceModal (moved here for grouping)
    evidenceDetail: false, // showEvidenceDetailModal
    budgetUpdateConfirm: false, // showBudgetUpdateConfirmModal
    restore: false, // showRestoreModal
    validation: false, // showValidationModal
  })

  // ============================================================
  // Phase B-2: Loading & Operation States
  // ============================================================
  let loadingStates = $state({
    updating: false, // isUpdating
    deleting: false, // isDeleting
    validating: false, // isRunningValidation
    calculatingMonthly: false, // isCalculatingMonthlyAmount
    validatingEvidence: false, // isValidatingEvidence
    loadingEvidence: false, // isLoadingEvidence
    validatingMembers: false, // isValidatingMembers
    addingMember: false, // addingMember
  })

  let budgetRefreshTrigger = $state(0)

  // ============================================================
  // Phase B-4: Selected Items Group
  // ============================================================
  let selectedItems = $state({
    budget: null as any, // selectedItems.budget
    member: null as any, // selectedItems.member
    budgetForEvidence: null as any, // selectedBudgetForEvidence
    budgetForRestore: null as any, // selectedBudgetForRestore
    evidenceItem: null as any, // selectedEvidenceItem
    evidencePeriod: 1, // selectedItems.evidencePeriod
    deleteCode: '', // selectedItems.deleteCode
    budgetUpdateData: null as any, // selectedItems.budgetUpdateData
  })

  // ============================================================
  // Phase B-3: Form Data Group
  // ============================================================
  let forms = $state({
    budget: {
      periodNumber: 1, // 연차 번호 (1연차, 2연차, ...)
      startDate: '', // 연차 시작일
      endDate: '', // 연차 종료일
      // 현금 비목들
      personnelCostCash: '',
      researchMaterialCostCash: '',
      researchActivityCostCash: '',
      researchStipendCash: '',
      indirectCostCash: '',
      // 현물 비목들
      personnelCostInKind: '',
      researchMaterialCostInKind: '',
      researchActivityCostInKind: '',
      researchStipendInKind: '',
      indirectCostInKind: '',
    },
    project: {
      title: '',
      code: '',
      description: '',
      status: 'active',
      sponsorType: 'internal',
      priority: 'medium',
      researchType: 'applied',
    },
    member: {
      employeeId: '',
      role: 'researcher',
      startDate: '',
      endDate: '',
      participationRate: 100, // 기본 참여율 100%
      monthlyAmount: '0', // 월간 금액 (기존 호환성)
      contractMonthlySalary: '0', // 계약월급여
      participationMonths: 0, // 참여개월수
      cashAmount: '0',
      inKindAmount: '0',
    },
    restore: {
      personnelCostCash: '',
      personnelCostInKind: '',
      researchMaterialCostCash: '',
      researchMaterialCostInKind: '',
      researchActivityCostCash: '',
      researchActivityCostInKind: '',
      researchStipendCash: '',
      researchStipendInKind: '',
      indirectCostCash: '',
      indirectCostInKind: '',
      restoreReason: '사용자 요청에 의한 연구개발비 복구',
    },
    newEvidence: {
      categoryId: '',
      name: '',
      description: '',
      budgetAmount: '',
      assigneeId: '',
      dueDate: '',
    },
  })

  // 날짜를 API 형식(YYYY-MM-DD)으로 변환하는 유틸리티 함수
  function convertDateToISO(dateStr: string): string {
    if (!dateStr) return ''
    // "2025. 01. 01." 형식을 "2025-01-01" 형식으로 변환
    return dateStr.replace(/\s+/g, '').replace(/\./g, '-').replace(/-$/, '')
  }

  // 숫자 입력 필드 포맷팅 핸들러
  function handleNumberInput(e: Event, callback: (value: string) => void) {
    const input = e.currentTarget as HTMLInputElement
    // 숫자만 추출
    const rawValue = input.value.replace(/[^\d]/g, '')
    // 콜백으로 원본 값 전달
    callback(rawValue || '0')
    // 포맷팅된 값으로 표시
    input.value = formatNumber(rawValue, false)
  }

  // 사용자가 수동으로 월간금액을 입력했는지 추적
  let isManualMonthlyAmount = $state(false)

  let calculatedMonthlyAmount = $state(0)
  let isPersonnelSummaryExpanded = $state(false)

  // ============================================================
  // Data Lists & References
  // ============================================================
  let _evidenceList = $state<any[]>([])
  let evidenceRefreshKey = $state(0)
  let _evidenceTypes = $state<any[]>([])
  let expandedEvidenceSections = $state({
    personnel: true,
    material: true,
    activity: true,
    indirect: true,
  })

  // ============================================================
  // Validation & Evidence Data States (Phase B-5)
  // ============================================================
  let validationData = $state({
    results: null as any, // validationResults - 검증 결과
    history: [] as any[], // validationHistory - 검증 이력
    autoEnabled: true, // _autoValidationEnabled - 자동 검증 활성화
    evidence: null as any, // evidenceValidation - 증빙 등록 검증 상태
    categories: [] as any[], // evidenceCategories - 증빙 카테고리 목록
    items: [] as any[], // evidenceItems - 증빙 항목 목록
  })

  let _editProjectForm = $state({
    title: '',
    description: '',
    sponsorType: '',
    sponsorName: '',
    startDate: '',
    endDate: '',
    budgetTotal: '',
    researchType: '',
    priority: '',
    status: '',
  })

  // 데이터
  let projectMembers = $state<any[]>([])
  let projectBudgets = $state<any[]>([])
  let budgetUpdateKey = $state(0) // 강제 재렌더링 트리거
  let _budgetCategories = $state<any[]>([])
  let availableEmployees = $state<any[]>([])

  // 참여연구원 검증 상태 (테이블용)
  let _memberValidation = $state<any>(null)
  let _memberValidationLastChecked = $state<Date | null>(null)

  // 개별 멤버 검증 상태
  let memberValidationStatuses = $state<Record<string, any>>({})

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    void (async () => {
      if (selectedProject?.id) {
        await loadProjectBudgets()
        await loadProjectMembers()
        await loadEvidenceCategories()
      }
    })()
  })

  // 증빙 등록 시 재직 기간 검증 함수
  async function validateEvidenceRegistration() {
    if (
      !forms.newEvidence.assigneeId ||
      !forms.newEvidence.dueDate ||
      !selectedItems.budgetForEvidence?.id
    ) {
      validationData.evidence = null
      return
    }

    // 인건비 카테고리인 경우에만 검증
    const selectedCategory = validationData.categories.find(
      (cat) => cat.id === forms.newEvidence.categoryId,
    )
    if (selectedCategory?.name !== '인건비') {
      validationData.evidence = null
      return
    }

    loadingStates.validatingEvidence = true
    try {
      const response = await fetch('/api/project-management/evidence-items/validate-employment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeId: forms.newEvidence.assigneeId,
          dueDate: forms.newEvidence.dueDate,
          projectBudgetId: selectedItems.budgetForEvidence.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        validationData.evidence = data
      } else {
        logger.error('증빙 등록 검증 실패:', response.statusText)
        validationData.evidence = null
      }
    } catch (error) {
      logger.error('증빙 등록 검증 중 오류:', error)
      validationData.evidence = null
    } finally {
      loadingStates.validatingEvidence = false
    }
  }

  // 참여연구원 검증 함수 (테이블용)
  async function _validateMembers() {
    if (!selectedProject?.id) return

    loadingStates.validatingMembers = true
    try {
      const response = await fetch(
        `/api/project-management/researcher-validation?projectId=${selectedProject.id}`,
      )
      if (response.ok) {
        const data = await response.json()
        _memberValidation = data
        _memberValidationLastChecked = new Date()

        // 개별 멤버 검증 상태 업데이트
        if (data.success && data.data?.validation?.issues) {
          updateMemberValidationStatuses(data.data.validation.issues)
        }
      } else {
        logger.error('참여연구원 검증 실패:', response.statusText)
      }
    } catch (error) {
      logger.error('참여연구원 검증 중 오류:', error)
    } finally {
      loadingStates.validatingMembers = false
    }
  }

  // 개별 멤버 검증 상태 업데이트
  function updateMemberValidationStatuses(issues: any[]) {
    // 초기화
    memberValidationStatuses = {}

    // 각 멤버별로 검증 상태 설정
    projectMembers.forEach((member) => {
      const memberIssues = issues.filter((issue) => issue.memberId === member.id)

      if (memberIssues.length === 0) {
        memberValidationStatuses[member.id] = {
          status: 'valid',
          message: '검증 완료',
          issues: [],
        }
      } else {
        const hasErrors = memberIssues.some((issue) => issue.severity === 'error')
        const hasWarnings = memberIssues.some((issue) => issue.severity === 'warning')
        const errorCount = memberIssues.filter((i) => i.severity === 'error').length
        const warningCount = memberIssues.filter((i) => i.severity === 'warning').length

        // 더 자세한 메시지 생성
        let detailedMessage = ''
        if (hasErrors && hasWarnings) {
          detailedMessage = `${errorCount}개 오류, ${warningCount}개 경고`
        } else if (hasErrors) {
          detailedMessage = `${errorCount}개 오류`
        } else {
          detailedMessage = `${warningCount}개 경고`
        }

        memberValidationStatuses[member.id] = {
          status: hasErrors ? 'error' : 'warning',
          message: detailedMessage,
          issues: memberIssues.map((issue) => ({
            ...issue,
            // API에서 제공하는 실제 메시지 사용
            priority: issue.severity === 'error' ? 'high' : 'medium',
          })),
        }
      }
    })
  }

  // 프로젝트 멤버 로드
  async function loadProjectMembers() {
    try {
      logger.log('참여연구원 목록 로드 시작, 프로젝트 ID:', selectedProject.id)
      const response = await fetch(
        `/api/project-management/project-members?projectId=${selectedProject.id}`,
      )
      if (response.ok) {
        const data = await response.json()
        logger.log('참여연구원 목록 로드 성공:', data.data?.length, '명')
        projectMembers = data.data || []
        logger.log('참여연구원 상태 업데이트 완료:', projectMembers.length, '명')

        // 자동 검증 제거 - 수작업으로만 검증 실행
      } else {
        logger.error('참여연구원 목록 로드 실패, 응답 상태:', response.status)
      }
    } catch (error) {
      logger.error('프로젝트 멤버 로드 실패:', error)
    }
  }

  // 프로젝트 사업비 로드
  async function loadProjectBudgets() {
    try {
      const response = await fetch(
        `/api/project-management/project-budgets?projectId=${selectedProject.id}`,
      )
      if (response.ok) {
        const data = await response.json()
        projectBudgets = [...(data.data || [])]
        budgetUpdateKey++
      }
    } catch (error) {
      logger.error('프로젝트 사업비 로드 실패:', error)
    }
  }

  // 사업비 항목 로드
  async function loadBudgetCategories() {
    try {
      const response = await fetch('/api/project-management/budget-categories')
      if (response.ok) {
        const data = await response.json()
        _budgetCategories = data.data || []
      }
    } catch (error) {
      logger.error('사업비 항목 로드 실패:', error)
    }
  }

  // 사용 가능한 직원 로드
  async function loadAvailableEmployees() {
    try {
      logger.log('직원 목록 로딩 시작, 프로젝트 ID:', selectedProject.id)
      const response = await fetch(
        `/api/project-management/employees?projectId=${selectedProject.id}`,
      )
      logger.log('직원 목록 API 응답 상태:', response.status)

      if (response.ok) {
        const data = await response.json()
        logger.log('직원 목록 API 응답 데이터:', data)
        availableEmployees = data.data || []
        logger.log('로드된 직원 수:', availableEmployees.length)
      } else {
        logger.error('직원 목록 API 오류:', response.status, response.statusText)
        const errorData = await response.text()
        logger.error('오류 상세:', errorData)
      }
    } catch (error) {
      logger.error('직원 목록 로드 실패:', error)
    }
  }

  // 사업비 추가
  async function addBudget() {
    // 필수 필드 검증
    if (!forms.budget.startDate || !forms.budget.endDate) {
      alert('연차 기간(시작일, 종료일)을 모두 입력해주세요.')
      return
    }

    // 시작일이 종료일보다 늦은지 검증
    if (new Date(forms.budget.startDate) >= new Date(forms.budget.endDate)) {
      alert('시작일은 종료일보다 빨라야 합니다.')
      return
    }

    try {
      const response = await fetch('/api/project-management/project-budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          periodNumber: forms.budget.periodNumber,
          startDate: forms.budget.startDate,
          endDate: forms.budget.endDate,
          // 현금 비목들 (천원 단위를 원 단위로 변환, 인건비는 100만원 단위로 조정)
          personnelCostCash: fromThousands(forms.budget.personnelCostCash),
          researchMaterialCostCash: fromThousands(forms.budget.researchMaterialCostCash),
          researchActivityCostCash: fromThousands(forms.budget.researchActivityCostCash),
          researchStipendCash: fromThousands(forms.budget.researchStipendCash),
          indirectCostCash: fromThousands(forms.budget.indirectCostCash),
          // 현물 비목들 (천원 단위를 원 단위로 변환)
          personnelCostInKind: fromThousands(forms.budget.personnelCostInKind),
          researchMaterialCostInKind: fromThousands(forms.budget.researchMaterialCostInKind),
          researchActivityCostInKind: fromThousands(forms.budget.researchActivityCostInKind),
          researchStipendInKind: fromThousands(forms.budget.researchStipendInKind),
          indirectCostInKind: fromThousands(forms.budget.indirectCostInKind),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        modalStates.budget = false
        forms.budget = {
          periodNumber: 1,
          startDate: '',
          endDate: '',
          personnelCostCash: '',
          researchMaterialCostCash: '',
          researchActivityCostCash: '',
          researchStipendCash: '',
          indirectCostCash: '',
          personnelCostInKind: '',
          researchMaterialCostInKind: '',
          researchActivityCostInKind: '',
          researchStipendInKind: '',
          indirectCostInKind: '',
        }
        await loadProjectBudgets()
        // 예산 추가 후 프로젝트 기간 정보 업데이트
        updateProjectPeriodFromBudgets()
        // 예산 요약 새로고침
        budgetRefreshTrigger++
        dispatch('refresh')

        // 성공 메시지 표시
        if (result.message) {
          alert(result.message)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.message || '사업비 추가에 실패했습니다.')
      }
    } catch (error) {
      logger.error('사업비 추가 실패:', error)
      alert('사업비 추가 중 오류가 발생했습니다.')
    }
  }

  // 멤버 추가
  async function addMember() {
    // 참여율 검증
    if (forms.member.participationRate < 0 || forms.member.participationRate > 100) {
      alert('참여율은 0-100 사이의 값이어야 합니다.')
      return
    }

    try {
      // 날짜를 API 형식(YYYY-MM-DD)으로 변환
      const formattedStartDate = convertDateToISO(forms.member.startDate)
      const formattedEndDate = convertDateToISO(forms.member.endDate)

      const response = await fetch('/api/project-management/project-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          employeeId: forms.member.employeeId,
          role: forms.member.role,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          participationRate: forms.member.participationRate,
          cashAmount: parseInt(forms.member.cashAmount || '0'),
          inKindAmount: parseInt(forms.member.inKindAmount || '0'),
          contractMonthlySalary: parseInt(forms.member.contractMonthlySalary || '0'),
          participationMonths: forms.member.participationMonths || 0,
        }),
      })

      if (response.ok) {
        loadingStates.addingMember = false
        resetMemberForm()
        await loadProjectMembers()
        dispatch('refresh')
      } else {
        const errorData = await response.json()
        alert(errorData.message || '멤버 추가에 실패했습니다.')
      }
    } catch (error) {
      logger.error('멤버 추가 실패:', error)
      alert('멤버 추가 중 오류가 발생했습니다.')
    }
  }

  // 멤버 추가 시작
  function startAddMember() {
    loadingStates.addingMember = true
    selectedItems.member = null
    resetMemberForm()
  }

  // 멤버 추가 취소
  function cancelAddMember() {
    loadingStates.addingMember = false
    resetMemberForm()
  }

  // 멤버 수정 시작
  function editMember(member: any) {
    selectedItems.member = member

    // 디버깅: 멤버 데이터 확인
    logger.log('editMember - member data:', member)
    logger.log('editMember - startDate raw:', memberUtilsImported.getMemberStartDate(member))
    logger.log('editMember - endDate raw:', memberUtilsImported.getMemberEndDate(member))

    // 날짜 데이터 확인 및 안전한 처리
    const rawStartDate = memberUtilsImported.getMemberStartDate(member)
    const rawEndDate = memberUtilsImported.getMemberEndDate(member)

    forms.member = {
      employeeId: memberUtilsImported.getMemberEmployeeId(member),
      role: member.role,
      startDate: rawStartDate ? formatDateForInput(rawStartDate) : '',
      endDate: rawEndDate ? formatDateForInput(rawEndDate) : '',
      participationRate: memberUtilsImported.getMemberParticipationRate(member) || 0,
      monthlyAmount: (memberUtilsImported.getMemberMonthlyAmount(member) || 0).toString(),
      contractMonthlySalary: (
        calculationUtilsImported.calculateContractMonthlySalary(member) || 0
      ).toString(),
      participationMonths: calculationUtilsImported.calculatePeriodMonths(
        memberUtilsImported.getMemberStartDate(member),
        memberUtilsImported.getMemberEndDate(member),
      ),
      cashAmount: (member.cash_amount || member.cashAmount || '0').toString(),
      inKindAmount: (member.in_kind_amount || member.inKindAmount || '0').toString(),
    }

    // 디버깅: memberForm 확인
    logger.log('editMember - forms.member after setting:', forms.member)

    // 수정 시 월간금액 자동 계산 (수동 입력 플래그 초기화)
    isManualMonthlyAmount = false
    updateMonthlyAmount()
  }

  // 멤버 폼 초기화
  function resetMemberForm() {
    forms.member = {
      employeeId: '',
      role: 'researcher',
      startDate: '',
      endDate: '',
      participationRate: 100,
      monthlyAmount: '0',
      contractMonthlySalary: '0',
      participationMonths: 0,
      cashAmount: '0',
      inKindAmount: '0',
    }
    calculatedMonthlyAmount = 0
    isManualMonthlyAmount = false
  }

  // 멤버 수정 취소
  function cancelEditMember() {
    selectedItems.member = null
    resetMemberForm()
  }

  // 멤버 수정 완료
  async function updateMember() {
    if (!selectedItems.member) return

    // 참여율 검증
    if (forms.member.participationRate < 0 || forms.member.participationRate > 100) {
      alert('참여율은 0-100 사이의 값이어야 합니다.')
      return
    }

    // 디버깅: 필드 값 확인
    logger.log('updateMember - forms.member:', forms.member)
    logger.log(
      'updateMember - startDate:',
      forms.member.startDate,
      'type:',
      typeof forms.member.startDate,
    )
    logger.log(
      'updateMember - endDate:',
      forms.member.endDate,
      'type:',
      typeof forms.member.endDate,
    )

    // 필수 필드 검증
    if (!forms.member.startDate || !forms.member.endDate) {
      alert('참여기간(시작일, 종료일)을 모두 입력해주세요.')
      return
    }

    try {
      // 날짜를 API 형식(YYYY-MM-DD)으로 변환
      const formattedStartDate = convertDateToISO(forms.member.startDate)
      const formattedEndDate = convertDateToISO(forms.member.endDate)

      logger.log('참여연구원 수정 요청 데이터:', {
        id: selectedItems.member.id,
        role: forms.member.role,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        participationRate: forms.member.participationRate,
        cashAmount: forms.member.cashAmount,
        inKindAmount: forms.member.inKindAmount,
      })

      const response = await fetch(
        `/api/project-management/project-members/${selectedItems.member.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: forms.member.role,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            participationRate: forms.member.participationRate,
            cashAmount: parseInt(forms.member.cashAmount || '0'),
            inKindAmount: parseInt(forms.member.inKindAmount || '0'),
            contractMonthlySalary: parseInt(forms.member.contractMonthlySalary || '0'),
            participationMonths: forms.member.participationMonths || 0,
          }),
        },
      )

      logger.log('참여연구원 수정 응답 상태:', response.status)

      if (response.ok) {
        const result = await response.json()
        logger.log('참여연구원 수정 성공 응답:', result)

        selectedItems.member = null
        loadingStates.addingMember = false
        resetMemberForm()

        // 데이터 새로고침
        await loadProjectMembers()
        logger.log('참여연구원 목록 새로고침 완료')

        dispatch('refresh')

        // 성공 메시지 표시
        if (result.message) {
          alert(result.message)
        }
      } else {
        const errorData = await response.json()
        logger.error('참여연구원 수정 API 에러 응답:', errorData)
        alert(errorData.message || '연구원 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      logger.error('멤버 수정 실패:', error)
      alert('연구원 정보 수정 중 오류가 발생했습니다.')
    }
  }

  // 멤버 삭제
  async function removeMember(memberId: string) {
    if (!confirm('정말로 이 멤버를 제거하시겠습니까?')) return

    try {
      const response = await fetch(`/api/project-management/project-members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadProjectMembers()
        dispatch('refresh')
      }
    } catch (error) {
      logger.error('멤버 삭제 실패:', error)
    }
  }

  // 사업비 편집
  function editBudget(budget: any) {
    selectedItems.budget = budget

    // 중복된 formatDateForInput 함수 제거됨 - 상단의 유틸리티 함수 사용

    forms.budget = {
      periodNumber: budgetUtilsImported.getPeriodNumber(budget),
      startDate: formatDateForInput(budgetUtilsImported.getStartDate(budget)),
      endDate: formatDateForInput(budgetUtilsImported.getEndDate(budget)),
      // 현금 비목들 (천원 단위로 변환, 인건비는 조정된 값 표시)
      personnelCostCash: toThousands(budgetUtilsImported.getPersonnelCostCash(budget)),
      researchMaterialCostCash: toThousands(
        budgetUtilsImported.getResearchMaterialCostCash(budget),
      ),
      researchActivityCostCash: toThousands(
        budgetUtilsImported.getResearchActivityCostCash(budget),
      ),
      researchStipendCash: toThousands(budgetUtilsImported.getResearchStipendCash(budget)),
      indirectCostCash: toThousands(budgetUtilsImported.getIndirectCost(budget)),
      // 현물 비목들 (천원 단위로 변환)
      personnelCostInKind: toThousands(budgetUtilsImported.getPersonnelCostInKind(budget)),
      researchMaterialCostInKind: toThousands(
        budgetUtilsImported.getResearchMaterialCostInKind(budget),
      ),
      researchActivityCostInKind: toThousands(
        budgetUtilsImported.getResearchActivityCostInKind(budget),
      ),
      researchStipendInKind: toThousands(budgetUtilsImported.getResearchStipendInKind(budget)),
      indirectCostInKind: toThousands(budgetUtilsImported.getIndirectCostInKind(budget)),
    }
    modalStates.budget = true
  }

  // 사업비 업데이트
  async function updateBudget() {
    if (!selectedItems.budget) return

    // 필수 필드 검증
    if (!forms.budget.startDate || !forms.budget.endDate) {
      alert('연차 기간(시작일, 종료일)을 모두 입력해주세요.')
      return
    }

    // 시작일이 종료일보다 늦은지 검증
    if (new Date(forms.budget.startDate) >= new Date(forms.budget.endDate)) {
      alert('시작일은 종료일보다 빨라야 합니다.')
      return
    }

    try {
      // 1단계: 예산 수정 전 검증
      const validationResponse = await fetch(
        `/api/project-management/project-budgets/${selectedItems.budget.id}/validate-before-update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodNumber: forms.budget.periodNumber,
            startDate: forms.budget.startDate,
            endDate: forms.budget.endDate,
            // 현금 비목들 (천원 단위를 원 단위로 변환)
            personnelCostCash: fromThousands(forms.budget.personnelCostCash),
            researchMaterialCostCash: fromThousands(forms.budget.researchMaterialCostCash),
            researchActivityCostCash: fromThousands(forms.budget.researchActivityCostCash),
            researchStipendCash: fromThousands(forms.budget.researchStipendCash),
            indirectCostCash: fromThousands(forms.budget.indirectCostCash),
            // 현물 비목들 (천원 단위를 원 단위로 변환)
            personnelCostInKind: fromThousands(forms.budget.personnelCostInKind),
            researchMaterialCostInKind: fromThousands(forms.budget.researchMaterialCostInKind),
            researchActivityCostInKind: fromThousands(forms.budget.researchActivityCostInKind),
            researchStipendInKind: fromThousands(forms.budget.researchStipendInKind),
            indirectCostInKind: fromThousands(forms.budget.indirectCostInKind),
          }),
        },
      )

      if (!validationResponse.ok) {
        alert('예산 수정 전 검증에 실패했습니다.')
        return
      }

      const validationResult = await validationResponse.json()

      if (validationResult.success && validationResult.data.hasWarnings) {
        // 검증 데이터 저장하고 확인 모달 표시
        selectedItems.budgetUpdateData = validationResult.data
        modalStates.budgetUpdateConfirm = true
        return
      }

      // 경고가 없으면 바로 수정 진행
      await proceedWithBudgetUpdate()
    } catch (error) {
      logger.error('사업비 업데이트 실패:', error)
      alert('사업비 수정 중 오류가 발생했습니다.')
    }
  }

  // 실제 예산 수정 실행 함수
  async function proceedWithBudgetUpdate() {
    if (!selectedItems.budget) return

    try {
      const response = await fetch(
        `/api/project-management/project-budgets/${selectedItems.budget.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodNumber: forms.budget.periodNumber,
            startDate: forms.budget.startDate,
            endDate: forms.budget.endDate,
            // 현금 비목들 (천원 단위를 원 단위로 변환, 인건비는 100만원 단위로 조정)
            personnelCostCash: fromThousands(forms.budget.personnelCostCash),
            researchMaterialCostCash: fromThousands(forms.budget.researchMaterialCostCash),
            researchActivityCostCash: fromThousands(forms.budget.researchActivityCostCash),
            researchStipendCash: fromThousands(forms.budget.researchStipendCash),
            indirectCostCash: fromThousands(forms.budget.indirectCostCash),
            // 현물 비목들 (천원 단위를 원 단위로 변환)
            personnelCostInKind: fromThousands(forms.budget.personnelCostInKind),
            researchMaterialCostInKind: fromThousands(forms.budget.researchMaterialCostInKind),
            researchActivityCostInKind: fromThousands(forms.budget.researchActivityCostInKind),
            researchStipendInKind: fromThousands(forms.budget.researchStipendInKind),
            indirectCostInKind: fromThousands(forms.budget.indirectCostInKind),
          }),
        },
      )

      if (response.ok) {
        const result = await response.json()
        modalStates.budget = false
        modalStates.budgetUpdateConfirm = false
        selectedItems.budget = null
        selectedItems.budgetUpdateData = null
        forms.budget = {
          periodNumber: 1,
          startDate: '',
          endDate: '',
          personnelCostCash: '',
          researchMaterialCostCash: '',
          researchActivityCostCash: '',
          researchStipendCash: '',
          indirectCostCash: '',
          personnelCostInKind: '',
          researchMaterialCostInKind: '',
          researchActivityCostInKind: '',
          researchStipendInKind: '',
          indirectCostInKind: '',
        }
        await loadProjectBudgets()
        // 예산 수정 후 프로젝트 기간 정보 업데이트
        updateProjectPeriodFromBudgets()
        // 예산 요약 새로고침
        budgetRefreshTrigger++
        dispatch('refresh')

        // 성공 메시지 표시
        if (result.message) {
          alert(result.message)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.message || '사업비 수정에 실패했습니다.')
      }
    } catch (error) {
      logger.error('사업비 수정 실행 실패:', error)
      alert('사업비 수정 중 오류가 발생했습니다.')
    }
  }

  // 예산 수정 확인 모달에서 수정 진행
  function confirmBudgetUpdate() {
    proceedWithBudgetUpdate()
  }

  // 예산 수정 확인 모달에서 취소
  function cancelBudgetUpdate() {
    modalStates.budgetUpdateConfirm = false
    selectedItems.budgetUpdateData = null
  }

  // 연구개발비 복구 모달 열기
  function openRestoreModal(budget: any) {
    selectedItems.budgetForRestore = budget
    forms.restore = {
      personnelCostCash: '',
      personnelCostInKind: '',
      researchMaterialCostCash: '',
      researchMaterialCostInKind: '',
      researchActivityCostCash: '',
      researchActivityCostInKind: '',
      researchStipendCash: '',
      researchStipendInKind: '',
      indirectCostCash: '',
      indirectCostInKind: '',
      restoreReason: '사용자 요청에 의한 연구개발비 복구',
    }
    modalStates.restore = true
  }

  // 연구개발비 복구 실행
  async function restoreResearchCosts() {
    if (!selectedItems.budgetForRestore) return

    try {
      const response = await fetch(
        `/api/project-management/project-budgets/${selectedItems.budgetForRestore.id}/restore-research-costs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personnelCostCash: fromThousands(forms.restore.personnelCostCash),
            personnelCostInKind: fromThousands(forms.restore.personnelCostInKind),
            researchMaterialCostCash: fromThousands(forms.restore.researchMaterialCostCash),
            researchMaterialCostInKind: fromThousands(forms.restore.researchMaterialCostInKind),
            researchActivityCostCash: fromThousands(forms.restore.researchActivityCostCash),
            researchActivityCostInKind: fromThousands(forms.restore.researchActivityCostInKind),
            researchStipendCash: fromThousands(forms.restore.researchStipendCash),
            researchStipendInKind: fromThousands(forms.restore.researchStipendInKind),
            indirectCostCash: fromThousands(forms.restore.indirectCostCash),
            indirectCostInKind: fromThousands(forms.restore.indirectCostInKind),
            restoreReason: forms.restore.restoreReason,
          }),
        },
      )

      if (response.ok) {
        const result = await response.json()
        modalStates.restore = false
        selectedItems.budgetForRestore = null
        await loadProjectBudgets()
        budgetRefreshTrigger++
        dispatch('refresh')
        alert(result.message || '연구개발비가 성공적으로 복구되었습니다.')
      } else {
        const errorData = await response.json()
        alert(`연구개발비 복구 실패: ${errorData.message || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      logger.error('연구개발비 복구 실패:', error)
      alert('연구개발비 복구 중 오류가 발생했습니다.')
    }
  }

  // 연구개발비 복구 모달 닫기
  function closeRestoreModal() {
    modalStates.restore = false
    selectedItems.budgetForRestore = null
  }

  // 사업비 삭제
  async function removeBudget(budgetId: string) {
    if (!confirm('정말로 이 사업비 항목을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/project-management/project-budgets/${budgetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadProjectBudgets()
        updateProjectPeriodFromBudgets()
        budgetRefreshTrigger++
        dispatch('refresh')
      }
    } catch (error) {
      logger.error('사업비 삭제 실패:', error)
    }
  }

  // 프로젝트 수정 폼 초기화
  function initProjectForm() {
    if (selectedProject) {
      forms.project = {
        title: selectedProject.title || '',
        code: projectUtilsImported.getProjectCode(selectedProject),
        description: projectUtilsImported.getProjectDescription(selectedProject),
        status: projectUtilsImported.getProjectStatus(selectedProject),
        sponsorType: projectUtilsImported.getProjectSponsorType(selectedProject),
        priority: selectedProject.priority || 'medium',
        researchType: selectedProject.research_type || selectedProject.researchType || 'applied',
      }
    }
  }

  // 프로젝트 수정
  async function updateProject() {
    if (!selectedProject) return

    loadingStates.updating = true
    try {
      const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forms.project),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 프로젝트 정보 업데이트
        selectedProject = { ...selectedProject, ...result.data }
        modalStates.editProject = false

        // 부모 컴포넌트에 프로젝트 업데이트 이벤트 전송
        dispatch('project-updated', {
          projectId: selectedProject.id,
          updatedProject: result.data,
        })

        alert('프로젝트가 성공적으로 수정되었습니다.')
      } else {
        alert(result.message || '프로젝트 수정에 실패했습니다.')
      }
    } catch (error) {
      logger.error('프로젝트 수정 실패:', error)
      alert('프로젝트 수정 중 오류가 발생했습니다.')
    } finally {
      loadingStates.updating = false
    }
  }

  // 프로젝트 삭제
  async function deleteProject() {
    if (!selectedProject) return

    // 삭제 확인 코드 검증 - 컴포넌트에서 이미 검증됨
    if (selectedItems.deleteCode !== selectedProject?.code) {
      alert('프로젝트 코드가 일치하지 않습니다. 정확한 코드를 입력해주세요.')
      return
    }

    loadingStates.deleting = true
    try {
      const response = await fetch(`/api/project-management/projects/${selectedProject.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        modalStates.deleteConfirm = false
        selectedItems.deleteCode = '' // 삭제 후 코드 초기화
        dispatch('project-deleted', { projectId: selectedProject.id })
        dispatch('refresh')
      } else {
        alert(result.message || '프로젝트 삭제에 실패했습니다.')
      }
    } catch (error) {
      logger.error('프로젝트 삭제 실패:', error)
      alert('프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      loadingStates.deleting = false
    }
  }

  // 월간금액 자동 계산 (참여기간 내 계약 정보 기반)
  async function calculateMonthlyAmount(
    employeeId: string,
    participationRate: number | string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    logger.log('calculateMonthlyAmount 호출:', {
      employeeId,
      participationRate,
      startDate,
      endDate,
      type: typeof participationRate,
    })

    // participationRate를 숫자로 변환
    const rate =
      typeof participationRate === 'string' ? parseFloat(participationRate) : participationRate

    if (!employeeId || !rate || isNaN(rate)) {
      logger.log('employeeId 또는 participationRate가 없거나 유효하지 않음:', {
        employeeId,
        rate,
      })
      return 0
    }

    // 참여기간이 없으면 기본값 사용
    if (!startDate || !endDate) {
      logger.log('참여기간이 설정되지 않음')
      return 0
    }

    try {
      // 참여기간 내의 계약 정보 조회
      const response = await fetch(
        `/api/project-management/employees/${employeeId}/contract?startDate=${startDate}&endDate=${endDate}`,
      )
      if (!response.ok) {
        logger.log('계약 정보 조회 실패:', response.status)
        return 0
      }

      const contractData = await response.json()
      logger.log('계약 정보:', contractData)

      if (!contractData.success || !contractData.data) {
        logger.log('계약 정보가 없음:', contractData.message)
        if (contractData.debug) {
          logger.log('디버그 정보:', contractData.debug)
        }
        return 0
      }

      const contract = contractData.data
      const annualSalary = parseFloat(contract.annual_salary) || 0
      logger.log('계약 연봉 (원본):', contract.annual_salary)
      logger.log('계약 연봉 (변환):', annualSalary)

      if (annualSalary === 0) {
        logger.log('연봉이 0원임')
        return 0
      }

      // 중앙화된 급여 계산 함수 사용
      const monthlyAmount = calculateMonthlySalary(annualSalary, rate)
      logger.log('계산된 월간금액:', monthlyAmount)

      return monthlyAmount
    } catch (error) {
      logger.error('월간금액 계산 중 오류:', error)
      return 0
    }
  }

  // 월간금액 계산 및 업데이트
  async function updateMonthlyAmount() {
    if (
      !forms.member.employeeId ||
      !forms.member.participationRate ||
      !forms.member.startDate ||
      !forms.member.endDate
    ) {
      calculatedMonthlyAmount = 0
      return
    }

    // 사용자가 수동으로 월간금액을 입력한 경우 자동 계산하지 않음
    if (isManualMonthlyAmount) {
      calculatedMonthlyAmount = parseFloat(forms.member.monthlyAmount) || 0
      return
    }

    loadingStates.calculatingMonthly = true
    try {
      const amount = await calculateMonthlyAmount(
        forms.member.employeeId,
        forms.member.participationRate,
        forms.member.startDate,
        forms.member.endDate,
      )
      calculatedMonthlyAmount = amount
    } catch (error) {
      logger.error('월간금액 계산 실패:', error)
      calculatedMonthlyAmount = 0
    } finally {
      loadingStates.calculatingMonthly = false
    }
  }

  // 종합 검증 실행
  async function runComprehensiveValidation() {
    if (!selectedProject) return

    loadingStates.validating = true
    try {
      const response = await fetch(
        `/api/project-management/comprehensive-validation?projectId=${selectedProject.id}&scope=all`,
      )
      const result = await response.json()

      validationData.results = result

      // 검증 히스토리에 추가
      validationData.history.unshift({
        timestamp: new Date().toISOString(),
        projectId: selectedProject.id,
        results: result,
      })

      // 최대 10개까지만 유지
      if (validationData.history.length > 10) {
        validationData.history = validationData.history.slice(0, 10)
      }

      modalStates.validation = true
    } catch (error) {
      logger.error('검증 실행 실패:', error)
      alert('검증 실행 중 오류가 발생했습니다.')
    } finally {
      loadingStates.validating = false
    }
  }

  // 증빙 내역 모달 표시
  function _openEvidenceModal(budget) {
    selectedItems.budgetForEvidence = budget
    modalStates.evidence = true
    loadEvidenceList(budget.id)
  }

  async function openEvidenceDetail(item) {
    selectedItems.evidenceItem = item
    modalStates.evidenceDetail = true

    // 증빙 항목 상세 정보 로드
    if (item.id) {
      try {
        const response = await fetch(`/api/project-management/evidence/${item.id}`)
        const result = await response.json()

        if (result.success) {
          selectedItems.evidenceItem = result.data
        }
      } catch (error) {
        logger.error('증빙 항목 상세 정보 로드 실패:', error)
      }
    }
  }

  // 증빙 카테고리 로드
  async function loadEvidenceCategories() {
    try {
      const response = await fetch('/api/project-management/evidence-categories')
      const result = await response.json()

      if (result.success) {
        validationData.categories = result.data
      }
    } catch (error) {
      logger.error('증빙 카테고리 로드 실패:', error)
    }
  }

  // 증빙 항목 로드 (모든 연차)
  async function loadEvidenceItems() {
    if (!selectedProject || projectBudgets.length === 0) return

    try {
      loadingStates.loadingEvidence = true
      let allEvidenceItems: any[] = []

      // 모든 연차의 증빙 데이터를 로드
      for (const budget of projectBudgets) {
        const response = await fetch(
          `/api/project-management/evidence?projectBudgetId=${budget.id}`,
        )
        const result = await response.json()

        if (result.success) {
          allEvidenceItems = [...allEvidenceItems, ...result.data]
        }
      }

      validationData.items = allEvidenceItems
    } catch (error) {
      logger.error('증빙 항목 로드 실패:', error)
    } finally {
      loadingStates.loadingEvidence = false
    }
  }

  // 증빙 항목 추가
  async function addEvidenceItem(categoryId, itemData) {
    try {
      const currentBudget =
        projectBudgets.find(
          (b) => budgetUtilsImported.getPeriodNumber(b) === selectedItems.evidencePeriod,
        ) || projectBudgets[0]

      const response = await fetch('/api/project-management/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectBudgetId: currentBudget.id,
          categoryId: categoryId,
          ...itemData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadEvidenceItems()
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      logger.error('증빙 항목 추가 실패:', error)
      throw error
    }
  }

  // 증빙 항목 수정
  async function _updateEvidenceItem(itemId, updateData) {
    try {
      const response = await fetch(`/api/project-management/evidence/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (result.success) {
        await loadEvidenceItems()
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      logger.error('증빙 항목 수정 실패:', error)
      throw error
    }
  }

  // 증빙 항목 삭제
  async function _deleteEvidenceItem(itemId) {
    try {
      const response = await fetch(`/api/project-management/evidence/${itemId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        await loadEvidenceItems()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      logger.error('증빙 항목 삭제 실패:', error)
      throw error
    }
  }

  // 증빙 항목 추가 핸들러
  async function handleAddEvidenceItem() {
    if (
      !forms.newEvidence.categoryId ||
      !forms.newEvidence.name ||
      !forms.newEvidence.budgetAmount
    ) {
      alert('필수 필드를 모두 입력해주세요.')
      return
    }

    try {
      loadingStates.updating = true

      const selectedEmployee = availableEmployees.find(
        (emp) => emp.id === forms.newEvidence.assigneeId,
      )
      const assigneeName = memberUtilsImported.createAssigneeNameFromEmployee(selectedEmployee)

      await addEvidenceItem(forms.newEvidence.categoryId, {
        name: forms.newEvidence.name,
        description: forms.newEvidence.description,
        budgetAmount: parseFloat(forms.newEvidence.budgetAmount),
        assigneeId: forms.newEvidence.assigneeId,
        assigneeName: assigneeName,
        dueDate: forms.newEvidence.dueDate,
      })

      // 폼 초기화
      forms.newEvidence = {
        categoryId: '',
        name: '',
        description: '',
        budgetAmount: '',
        assigneeId: '',
        dueDate: '',
      }

      modalStates.evidence = false
    } catch (error) {
      logger.error('증빙 항목 추가 실패:', error)
      alert('증빙 항목 추가에 실패했습니다.')
    } finally {
      loadingStates.updating = false
    }
  }

  // 증빙 내역 목록 로드
  async function loadEvidenceList(budgetId) {
    try {
      const response = await fetch(
        `/api/project-management/budget-evidence?projectBudgetId=${budgetId}`,
      )
      if (response.ok) {
        const data = await response.json()
        _evidenceList = data.data || []
      }
    } catch (error) {
      logger.error('증빙 내역 로드 실패:', error)
    }
  }

  // 증빙 유형 목록 로드
  async function loadEvidenceTypes() {
    try {
      const response = await fetch('/api/project-management/evidence-types')
      if (response.ok) {
        const data = await response.json()
        _evidenceTypes = data.data || []
      }
    } catch (error) {
      logger.error('증빙 유형 로드 실패:', error)
    }
  }

  // 상태별 색상 반환
  function getStatusColor(
    status: string,
  ): 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary' | 'ghost' {
    switch (status) {
      case 'active':
        return 'success'
      case 'planning':
        return 'warning'
      case 'completed':
        return 'info'
      case 'cancelled':
        return 'error'
      case 'suspended':
        return 'default'
      default:
        return 'default'
    }
  }

  // 상태별 텍스트 반환
  function getStatusText(status: string) {
    switch (status) {
      case 'active':
        return '진행중'
      case 'planning':
        return '계획중'
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소'
      case 'suspended':
        return '중단'
      default:
        return status
    }
  }

  // 우선순위별 색상 반환
  function getPriorityColor(
    priority: string,
  ): 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary' | 'ghost' {
    switch (priority) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  // 우선순위별 텍스트 반환
  function getPriorityText(priority: string) {
    switch (priority) {
      case 'critical':
        return '긴급'
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return priority
    }
  }

  // 스폰서 유형별 텍스트 반환
  function getSponsorTypeText(sponsorType: string) {
    switch (sponsorType) {
      case 'government':
        return '정부'
      case 'private':
        return '민간'
      case 'internal':
        return '내부'
      default:
        return sponsorType
    }
  }

  // 연구 유형별 텍스트 반환
  function getResearchTypeText(researchType: string) {
    switch (researchType) {
      case 'basic':
        return '기초연구'
      case 'applied':
        return '응용연구'
      case 'development':
        return '개발연구'
      default:
        return researchType
    }
  }

  // 천원 단위로 변환 (입력용)
  function toThousands(value: string | number): string {
    return calculationUtilsImported.toThousands(value)
  }

  // 천원 단위에서 원 단위로 변환 (저장용)
  function fromThousands(value: string): number {
    return calculationUtilsImported.fromThousands(value)
  }

  // 연구 유형 한글 변환
  function getResearchTypeLabel(researchType: string): string {
    switch (researchType) {
      case 'basic':
        return '기초연구'
      case 'applied':
        return '응용연구'
      case 'development':
        return '개발연구'
      default:
        return researchType
    }
  }

  // 초기화
  function initializeProjectData() {
    if (selectedProject && selectedProject.id) {
      loadProjectMembers()
      loadProjectBudgets()
      loadBudgetCategories()
      loadAvailableEmployees()
      loadEvidenceTypes()
      loadEvidenceCategories()
    }
  }

  // externalRefreshTrigger 변경 시 모든 프로젝트 종속 데이터 새로고침
  let lastExternalTrigger = $state(0)

  $effect(() => {
    if (externalRefreshTrigger > 0 && externalRefreshTrigger !== lastExternalTrigger) {
      lastExternalTrigger = externalRefreshTrigger

      // 모든 프로젝트 종속 데이터 새로고침
      if (selectedProject?.id) {
        loadProjectMembers()
        loadProjectBudgets()
        loadEvidenceItems()
        // budgetRefreshTrigger 동기화 (ProjectBudgetSummary 새로고침)
        budgetRefreshTrigger = externalRefreshTrigger
      }
    }
  })

  // 컴포넌트 마운트 시 초기화
  onMount(() => {
    handleProjectChange()
    initializeProjectData()
    loadEvidenceItems()
  })
</script>

{#if selectedProject}
  <div class="space-y-6">
    <!-- 프로젝트 기본 정보 -->
    <ThemeCard class="p-6">
      <!-- 헤더: 제목과 액션 버튼 -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1">
          <!-- 프로젝트 제목과 코드 -->
          <div class="flex items-center gap-3 mb-3">
            <h2 class="text-2xl font-bold text-gray-900">
              {selectedProject.title}
            </h2>
            <span class="text-sm text-gray-500 font-mono">{selectedProject.code}</span>
          </div>

          <!-- 상태 및 우선순위 태그 -->
          <div class="flex items-center gap-2 mb-3">
            <ThemeBadge variant={getStatusColor(selectedProject.status)} size="md">
              {getStatusText(selectedProject.status)}
            </ThemeBadge>
            <ThemeBadge variant={getPriorityColor(selectedProject.priority)} size="md">
              {getPriorityText(selectedProject.priority)}
            </ThemeBadge>
            <ThemeBadge variant="info" size="md">
              {getSponsorTypeText(selectedProject.sponsor_type || selectedProject.sponsorType)}
            </ThemeBadge>
            <ThemeBadge variant="primary" size="md">
              {getResearchTypeText(selectedProject.research_type || selectedProject.researchType)}
            </ThemeBadge>
          </div>

          {#if selectedProject.description}
            <p class="text-gray-700 mb-3 whitespace-pre-line">{selectedProject.description}</p>
          {/if}

          <!-- 프로젝트 기간 (연차 정보 기반) -->
          <div class="flex items-center text-sm text-gray-600">
            <CalendarIcon size={16} class="mr-2 text-orange-600" />
            <span id="project-period">연차 정보를 불러오는 중...</span>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex gap-2 ml-4">
          <ThemeButton
            variant="primary"
            size="sm"
            onclick={() => {
              initProjectForm()
              modalStates.editProject = true
            }}
          >
            <EditIcon size={16} class="mr-2" />
            정보 수정
          </ThemeButton>
          <ThemeButton variant="primary" size="sm" onclick={() => dispatch('show-budget-modal')}>
            <DollarSignIcon size={16} class="mr-2" />
            예산 수정
          </ThemeButton>
          <ThemeButton variant="error" size="sm" onclick={() => (modalStates.deleteConfirm = true)}>
            <TrashIcon size={16} class="mr-2" />
            삭제
          </ThemeButton>
        </div>
      </div>

      <!-- 사업비 예산 -->
      <div class="bg-gray-50 rounded-lg p-6">
        {#await import('$lib/components/project-management/ProjectBudgetSummary.svelte')}
          <div class="flex items-center justify-center py-4">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600 text-sm">로딩 중...</span>
          </div>
        {:then { default: ProjectBudgetSummary }}
          <ProjectBudgetSummary
            projectId={selectedProject.id}
            compact={true}
            refreshTrigger={budgetRefreshTrigger}
          />
        {:catch _error}
          <div class="text-center py-4 text-gray-500">
            <p class="text-sm">예산 정보를 불러올 수 없습니다.</p>
          </div>
        {/await}
      </div>
    </ThemeCard>

    <!-- 연차별 사업비 관리 -->
    <ThemeCard class="p-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900">연구개발비</h3>
      </div>

      <!-- 단위 안내 -->
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            <span class="font-medium">금액 단위: 천원</span>
            <span class="ml-4 text-gray-600"> (현금) | (현물) </span>
          </div>
          <div class="text-xs text-gray-600">예: 1,000 = 1,000천원</div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200" style:min-width="100%">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                >연차</th
              >
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>인건비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>연구재료비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>연구활동비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>연구수당</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>간접비</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div>총 예산</div>
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                >액션</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#key budgetUpdateKey}
              {#each projectBudgets as budget, i (budget.id || i)}
                {@const _totalBudget =
                  budgetUtilsImported.getPersonnelCostCash(budget) +
                  budgetUtilsImported.getPersonnelCostInKind(budget) +
                  budgetUtilsImported.getResearchMaterialCostCash(budget) +
                  budgetUtilsImported.getResearchMaterialCostInKind(budget) +
                  budgetUtilsImported.getResearchActivityCostCash(budget) +
                  budgetUtilsImported.getResearchActivityCostInKind(budget) +
                  budgetUtilsImported.getResearchStipendCash(budget) +
                  budgetUtilsImported.getResearchStipendInKind(budget) +
                  budgetUtilsImported.getIndirectCostCash(budget) +
                  budgetUtilsImported.getIndirectCostInKind(budget)}
                {@const personnelCash =
                  Number(budgetUtilsImported.getPersonnelCostCash(budget)) || 0}
                {@const materialCash =
                  Number(budgetUtilsImported.getResearchMaterialCostCash(budget)) || 0}
                {@const activityCash =
                  Number(budgetUtilsImported.getResearchActivityCostCash(budget)) || 0}
                {@const stipendCash =
                  Number(budgetUtilsImported.getResearchStipendCash(budget)) || 0}
                {@const indirectCash = Number(budgetUtilsImported.getIndirectCostCash(budget)) || 0}
                {@const cashTotal =
                  personnelCash + materialCash + activityCash + stipendCash + indirectCash}
                {@const personnelInKind =
                  Number(budgetUtilsImported.getPersonnelCostInKind(budget)) || 0}
                {@const materialInKind =
                  Number(budgetUtilsImported.getResearchMaterialCostInKind(budget)) || 0}
                {@const activityInKind =
                  Number(budgetUtilsImported.getResearchActivityCostInKind(budget)) || 0}
                {@const stipendInKind =
                  Number(budgetUtilsImported.getResearchStipendInKind(budget)) || 0}
                {@const indirectInKind =
                  Number(budgetUtilsImported.getIndirectCostInKind(budget)) || 0}
                {@const inKindTotal =
                  personnelInKind +
                  materialInKind +
                  activityInKind +
                  stipendInKind +
                  indirectInKind}
                {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
                  budget,
                  projectBudgets,
                  selectedItems.evidencePeriod,
                )}
                <tr
                  class="hover:bg-gray-50 {mismatchInfo?.hasMismatch
                    ? 'bg-red-50 border-l-4 border-red-400'
                    : ''}"
                >
                  <!-- 연차 -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-24">
                    <div
                      class="text-sm cursor-help"
                      title={budgetUtilsImported.formatPeriodTooltip(budget)}
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-medium"
                          >{budgetUtilsImported.formatPeriodDisplay(budget)}</span
                        >
                        {#if mismatchInfo?.hasMismatch}
                          <span
                            class="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded font-medium"
                          >
                            !
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">현금 | 현물</div>
                    </div>
                  </td>
                  <!-- 인건비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(personnelCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(personnelInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 연구재료비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(materialCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(materialInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 연구활동비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(activityCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(activityInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 연구수당 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(stipendCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(stipendInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 간접비 (현금/현물) -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-medium">
                        {formatCurrency(indirectCash, false)}
                      </div>
                      <div class="text-sm text-gray-600">
                        {formatCurrency(indirectInKind, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 총 예산 (현금/현물) -->
                  <td
                    class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                  >
                    <div class="space-y-2">
                      <div class="text-sm text-blue-600 font-semibold">
                        {formatCurrency(cashTotal, false)}
                      </div>
                      <div class="text-sm text-gray-600 font-semibold">
                        {formatCurrency(inKindTotal, false)}
                      </div>
                    </div>
                  </td>
                  <!-- 액션 -->
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                    <div class="flex space-x-1 justify-center">
                      <ThemeButton variant="ghost" size="sm" onclick={() => editBudget(budget)}>
                        <EditIcon size={16} class="text-blue-600 mr-1" />
                        수정
                      </ThemeButton>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        onclick={() => removeBudget(budget.id)}
                      >
                        <TrashIcon size={16} class="text-red-600 mr-1" />
                        삭제
                      </ThemeButton>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                    <DollarSignIcon size={48} class="mx-auto mb-2 text-gray-300" />
                    <p>등록된 사업비가 없습니다.</p>
                  </td>
                </tr>
              {/each}
            {/key}

            <!-- 합계 행 -->
            {#if projectBudgets && projectBudgets.length > 0}
              {@const totals = calculationUtilsImported.calculateBudgetTotals(projectBudgets)}
              <tr class="bg-gray-100 border-t-2 border-gray-300">
                <!-- 연차 -->
                <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900 w-24">
                  <div class="text-center">
                    <div class="font-medium">합계</div>
                    <div class="text-xs text-gray-600">
                      {projectBudgets.length}개 연차
                    </div>
                  </div>
                </td>
                <!-- 인건비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.personnelCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.personnelInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.personnelCash || 0) + (totals.personnelInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 연구재료비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.researchMaterialCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.researchMaterialInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.researchMaterialCash || 0) + (totals.researchMaterialInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 연구활동비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.researchActivityCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.researchActivityInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.researchActivityCash || 0) + (totals.researchActivityInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 연구수당 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.researchStipendCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.researchStipendInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.researchStipendCash || 0) + (totals.researchStipendInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 간접비 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.indirectCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.indirectInKind, false)}
                    </div>
                    <div class="text-sm text-gray-800 font-medium border-t pt-2">
                      소계: {formatCurrency(
                        (totals.indirectCash || 0) + (totals.indirectInKind || 0),
                        false,
                      )}
                    </div>
                  </div>
                </td>
                <!-- 총 예산 (현금/현물) -->
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  <div class="space-y-2">
                    <div class="text-sm text-blue-600 font-medium">
                      {formatCurrency(totals.totalCash, false)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {formatCurrency(totals.totalInKind, false)}
                    </div>
                    <div class="text-base text-gray-900 font-bold border-t-2 pt-2">
                      총계: {formatCurrency(totals.totalBudget, false)}
                    </div>
                  </div>
                </td>
                <!-- 액션 -->
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium w-32">
                  <div class="text-sm text-gray-500 text-center">-</div>
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

      <!-- 불일치 경고 섹션 -->
      {#if projectBudgets.some((budget) => calculationUtilsImported.checkBudgetMismatch(budget, projectBudgets, selectedItems.evidencePeriod)?.hasMismatch)}
        <div class="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
          <div class="text-sm text-red-700">
            <span class="font-medium">!</span>
            다음 연차의 예산과 연구개발비가 일치하지 않습니다:
            <div class="mt-2 space-y-1">
              {#each projectBudgets.filter((budget) => calculationUtilsImported.checkBudgetMismatch(budget, projectBudgets, selectedItems.evidencePeriod)?.hasMismatch) as budget}
                {@const mismatchInfo = calculationUtilsImported.checkBudgetMismatch(
                  budget,
                  projectBudgets,
                  selectedItems.evidencePeriod,
                )}
                <div class="text-xs text-red-600">
                  {budgetUtilsImported.formatPeriodDisplay(budget)}: 예산 {formatNumber(
                    mismatchInfo?.annualBudgetTotal || 0,
                    true,
                  )} vs 연구개발비 {formatNumber(mismatchInfo?.researchCostTotal || 0, true)}
                  <div class="ml-2 mt-1 text-gray-500">
                    현금: {formatNumber(mismatchInfo?.annualBudgetCash || 0, true)} vs {formatNumber(
                      mismatchInfo?.researchCostCash || 0,
                      true,
                    )}
                  </div>
                  <div class="ml-2 text-gray-500">
                    현물: {formatNumber(mismatchInfo?.annualBudgetInKind || 0, true)} vs {formatNumber(
                      mismatchInfo?.researchCostInKind || 0,
                      true,
                    )}
                  </div>
                </div>
              {/each}
            </div>
            <div class="mt-2 text-xs text-red-600 font-medium">
              해당 연차의 연구개발비를 수정해주세요.
            </div>
          </div>
        </div>
      {/if}
    </ThemeCard>
  </div>

  <!-- 사업비 추가/편집 모달 -->
  <ProjectBudgetModal
    bind:open={modalStates.budget}
    editingBudget={selectedItems.budget}
    budgetForm={forms.budget}
    onclose={() => {
      modalStates.budget = false
      selectedItems.budget = null
      forms.budget = {
        periodNumber: 1,
        startDate: '',
        endDate: '',
        personnelCostCash: '',
        researchMaterialCostCash: '',
        researchActivityCostCash: '',
        researchStipendCash: '',
        indirectCostCash: '',
        personnelCostInKind: '',
        researchMaterialCostInKind: '',
        researchActivityCostInKind: '',
        researchStipendInKind: '',
        indirectCostInKind: '',
      }
    }}
    onsubmit={selectedItems.budget ? updateBudget : addBudget}
    oncancel={() => {
      modalStates.budget = false
      selectedItems.budget = null
      forms.budget = {
        periodNumber: 1,
        startDate: '',
        endDate: '',
        personnelCostCash: '',
        researchMaterialCostCash: '',
        researchActivityCostCash: '',
        researchStipendCash: '',
        indirectCostCash: '',
        personnelCostInKind: '',
        researchMaterialCostInKind: '',
        researchActivityCostInKind: '',
        researchStipendInKind: '',
        indirectCostInKind: '',
      }
    }}
    {formatNumber}
    {handleNumberInput}
  />

  <!-- 연구원 추가 폼 카드 -->
  <ProjectMemberForm
    bind:visible={loadingStates.addingMember}
    memberForm={forms.member}
    bind:isManualMonthlyAmount
    {availableEmployees}
    {formatNumber}
    oncancel={cancelAddMember}
    onsubmit={addMember}
    onupdateMonthlyAmount={updateMonthlyAmount}
  />

  <!-- 프로젝트 멤버 관리 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">참여연구원</h3>
      <div class="flex items-center gap-2">
        <ThemeButton
          onclick={startAddMember}
          size="sm"
          disabled={loadingStates.addingMember || selectedItems.member !== null}
        >
          <PlusIcon size={16} class="mr-2" />
          연구원 추가
        </ThemeButton>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
              >이름</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
              >기간</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >참여개월수</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >계약월급여</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >참여율</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >현금</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
              >현물</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40"
              >액션</th
            >
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each projectMembers as member, i (i)}
            <tr
              class="hover:bg-gray-50 {selectedItems.member && selectedItems.member.id === member.id
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 shadow-sm'
                : ''}"
            >
              <!-- 이름 -->
              <td class="px-4 py-4 whitespace-nowrap w-48">
                <div class="flex items-center">
                  <UserIcon size={20} class="text-gray-400 mr-2" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="text-sm font-medium text-gray-900 truncate">
                        {member.employee_name ||
                          memberUtilsImported.formatKoreanName(
                            memberUtilsImported.getMemberEmployeeName(member),
                          )}
                      </div>
                      <ThemeBadge variant="info" size="sm">{member.role}</ThemeBadge>
                    </div>
                    <div class="text-xs text-gray-500 truncate">
                      {member.employee_department || member.employeeDepartment} / {member.employee_position ||
                        member.employeePosition}
                    </div>
                  </div>
                </div>
              </td>

              <!-- 기간 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-40">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-blue-700 w-8">시작:</span>
                      <input
                        type="date"
                        bind:value={forms.member.startDate}
                        class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onchange={() => {
                          isManualMonthlyAmount = false
                          updateMonthlyAmount()
                        }}
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-blue-700 w-8">종료:</span>
                      <input
                        type="date"
                        bind:value={forms.member.endDate}
                        class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        onchange={() => {
                          isManualMonthlyAmount = false
                          updateMonthlyAmount()
                        }}
                      />
                    </div>
                  </div>
                {:else}
                  <div class="space-y-1">
                    <div class="text-xs text-gray-600">
                      {formatDate(memberUtilsImported.getMemberStartDate(member))}
                    </div>
                    <div class="text-xs text-gray-600">
                      {formatDate(memberUtilsImported.getMemberEndDate(member))}
                    </div>
                  </div>
                {/if}
              </td>

              <!-- 참여개월수 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24 text-center">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="number"
                    value={forms.member.participationMonths ||
                      calculationUtilsImported.calculatePeriodMonths(
                        memberUtilsImported.getMemberStartDate(member),
                        memberUtilsImported.getMemberEndDate(member),
                      )}
                    oninput={(e) => {
                      const value = parseInt(e.currentTarget.value) || 0
                      forms.member.participationMonths = value
                    }}
                    class="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-center"
                    min="1"
                    max="120"
                  />
                {:else}
                  {forms.member.participationMonths ||
                    calculationUtilsImported.calculatePeriodMonths(
                      memberUtilsImported.getMemberStartDate(member),
                      memberUtilsImported.getMemberEndDate(member),
                    )}개월
                {/if}
              </td>

              <!-- 계약월급여 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="text"
                    value={formatNumber(forms.member.contractMonthlySalary, false)}
                    oninput={(e) => {
                      const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                      forms.member.contractMonthlySalary = rawValue || '0'
                      e.currentTarget.value = formatNumber(rawValue, false)

                      // 계약월급여 변경 시 현금/현물 자동 계산
                      const monthlySalary = parseInt(rawValue || '0')
                      const participationRate = forms.member.participationRate || 0
                      const participationMonths =
                        forms.member.participationMonths ||
                        calculationUtilsImported.calculatePeriodMonths(
                          forms.member.startDate,
                          forms.member.endDate,
                        )

                      // 총 금액 계산: 계약월급여 * 참여율(%) * 참여개월수
                      const totalAmount = Math.round(
                        ((monthlySalary * participationRate) / 100) * participationMonths,
                      )

                      // 현금/현물 자동 계산
                      if (parseInt(forms.member.cashAmount || '0') > 0) {
                        forms.member.cashAmount = totalAmount.toString()
                        forms.member.inKindAmount = '0'
                      } else if (parseInt(forms.member.inKindAmount || '0') > 0) {
                        forms.member.inKindAmount = totalAmount.toString()
                        forms.member.cashAmount = '0'
                      } else {
                        // 둘 다 0이라면 기본적으로 현금으로 설정
                        forms.member.cashAmount = totalAmount.toString()
                        forms.member.inKindAmount = '0'
                      }
                    }}
                    class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                    placeholder="0"
                  />
                {:else}
                  {formatNumber(
                    calculationUtilsImported.calculateContractMonthlySalary(member),
                    true,
                  )}
                {/if}
              </td>

              <!-- 참여율 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <div class="relative">
                    <input
                      type="number"
                      bind:value={forms.member.participationRate}
                      class="w-16 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      min="0"
                      max="100"
                      step="0.1"
                      onchange={() => {
                        isManualMonthlyAmount = false
                        updateMonthlyAmount()
                      }}
                    />
                    <span
                      class="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none"
                      >%</span
                    >
                  </div>
                {:else}
                  <div class="text-center">
                    {member.participation_rate || member.participationRate || 0}%
                  </div>
                {/if}
              </td>

              <!-- 현금 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="text"
                    value={formatNumber(forms.member.cashAmount || '0', false)}
                    oninput={(e) => {
                      const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                      forms.member.cashAmount = rawValue || '0'
                      e.currentTarget.value = formatNumber(rawValue, false)
                    }}
                    class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                    placeholder="0"
                  />
                {:else}
                  {formatNumber(parseInt(member.cash_amount || member.cashAmount || '0'), true)}
                {/if}
              </td>

              <!-- 현물 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32 text-right">
                {#if selectedItems.member && selectedItems.member.id === member.id}
                  <input
                    type="text"
                    value={formatNumber(forms.member.inKindAmount || '0', false)}
                    oninput={(e) => {
                      const rawValue = e.currentTarget.value.replace(/[^\d]/g, '')
                      forms.member.inKindAmount = rawValue || '0'
                      e.currentTarget.value = formatNumber(rawValue, false)
                    }}
                    class="w-24 px-2 py-1 border border-blue-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                    placeholder="0"
                  />
                {:else}
                  {formatNumber(
                    parseInt(member.in_kind_amount || member.inKindAmount || '0'),
                    true,
                  )}
                {/if}
              </td>
              <!-- 검증 상태 칼럼 제거 -->
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex space-x-1 justify-center">
                  {#if selectedItems.member && selectedItems.member.id === member.id}
                    <div class="flex space-x-1">
                      <button
                        type="button"
                        onclick={updateMember}
                        class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        title="저장"
                      >
                        <CheckIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onclick={cancelEditMember}
                        class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        title="취소"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  {:else}
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => editMember(member)}
                      disabled={selectedItems.member !== null}
                    >
                      <EditIcon size={16} class="text-blue-600 mr-1" />
                      수정
                    </ThemeButton>
                    <ThemeButton
                      variant="ghost"
                      size="sm"
                      onclick={() => removeMember(member.id)}
                      disabled={selectedItems.member !== null}
                    >
                      <TrashIcon size={16} class="text-red-600 mr-1" />
                      삭제
                    </ThemeButton>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}

          {#if projectMembers.length === 0 && !loadingStates.addingMember}
            <tr>
              <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                <UsersIcon size={48} class="mx-auto mb-2 text-gray-300" />
                <p>참여 연구원이 없습니다.</p>
              </td>
            </tr>
          {/if}

          <!-- 합계 행 -->
          {#if projectMembers.length > 0}
            {@const totals = calculationUtilsImported.calculateTableTotals(projectMembers)}
            <tr class="bg-gray-50 border-t-2 border-gray-300">
              <td class="px-4 py-3 text-sm font-semibold text-gray-900" colspan="5">
                <div class="flex items-center">
                  <div class="text-sm font-bold text-gray-800">합계</div>
                </div>
              </td>

              <!-- 현금 합계 -->
              <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatNumber(totals.totalCashAmount, true)}
              </td>

              <!-- 현물 합계 -->
              <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {formatNumber(totals.totalInKindAmount, true)}
              </td>

              <!-- 액션 (합계 행에는 없음) -->
              <td class="px-4 py-3 text-sm text-gray-500">
                <div class="text-center">-</div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </ThemeCard>

  <!-- 증빙 관리 -->
  <ThemeCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <h3 class="text-lg font-semibold text-gray-900">증빙 관리</h3>
        {#if projectBudgets.length > 0}
          <select
            bind:value={selectedItems.evidencePeriod}
            class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each projectBudgets as budget, i (i)}
              <option value={budgetUtilsImported.getPeriodNumber(budget)}>
                {budgetUtilsImported.formatPeriodDisplay(budget)}
              </option>
            {/each}
          </select>
        {/if}
      </div>
      <ThemeButton onclick={() => (modalStates.evidence = true)} size="sm">
        <PlusIcon size={16} class="mr-2" />
        증빙 추가
      </ThemeButton>
    </div>

    {#if projectBudgets.length > 0}
      {@const currentBudget =
        projectBudgets.find(
          (b) => budgetUtilsImported.getPeriodNumber(b) === selectedItems.evidencePeriod,
        ) || projectBudgets[0]}
      {@const budgetCategories = [
        {
          id: 'personnel',
          type: 'personnel',
          name: '인건비',
          cash: parseFloat(currentBudget.personnel_cost) || 0,
          inKind: parseFloat(currentBudget.personnel_cost_in_kind) || 0,
        },
        {
          id: 'material',
          type: 'material',
          name: '연구재료비',
          cash: parseFloat(currentBudget.research_material_cost) || 0,
          inKind: parseFloat(currentBudget.research_material_cost_in_kind) || 0,
        },
        {
          id: 'activity',
          type: 'activity',
          name: '연구활동비',
          cash: parseFloat(currentBudget.research_activity_cost) || 0,
          inKind: parseFloat(currentBudget.research_activity_cost_in_kind) || 0,
        },
        {
          id: 'stipend',
          type: 'stipend',
          name: '연구수당',
          cash: parseFloat(currentBudget.research_stipend) || 0,
          inKind: parseFloat(currentBudget.research_stipend_in_kind) || 0,
        },
        {
          id: 'indirect',
          type: 'indirect',
          name: '간접비',
          cash: parseFloat(currentBudget.indirect_cost) || 0,
          inKind: parseFloat(currentBudget.indirect_cost_in_kind) || 0,
        },
      ].filter((category) => category.cash + category.inKind > 0)}

      {#if loadingStates.loadingEvidence}
        <div class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <p class="mt-2 text-sm text-gray-500">증빙 데이터를 로드하는 중...</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each budgetCategories as budgetCategory, i (i)}
            {@const categoryItems = validationData.items.filter(
              (item) => item.category_name === budgetCategory.name,
            )}
            {@const totalAmount = budgetCategory.cash + budgetCategory.inKind}
            {@const totalItems = categoryItems.length}
            {@const completedItems = categoryItems.filter(
              (item) => item.status === 'completed',
            ).length}
            {@const inProgressItems = categoryItems.filter(
              (item) => item.status === 'in_progress',
            ).length}
            {@const overallProgress =
              totalItems > 0 ? Math.floor((completedItems / totalItems) * 100) : 0}

            <div class="border border-gray-200 rounded-lg">
              <!-- 카테고리 헤더 -->
              <button
                type="button"
                class="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 w-full text-left"
                onclick={() =>
                  (expandedEvidenceSections[budgetCategory.type] =
                    !expandedEvidenceSections[budgetCategory.type])}
                onkeydown={(e) =>
                  e.key === 'Enter' &&
                  (expandedEvidenceSections[budgetCategory.type] =
                    !expandedEvidenceSections[budgetCategory.type])}
              >
                <div class="flex items-center space-x-3">
                  {#if expandedEvidenceSections[budgetCategory.type]}
                    <ChevronDownIcon size={16} class="text-gray-500" />
                  {:else}
                    <ChevronRightIcon size={16} class="text-gray-500" />
                  {/if}
                  <div>
                    <h4 class="text-md font-medium text-gray-900">
                      {budgetCategory.name}
                    </h4>
                    <div class="text-xs text-gray-500">
                      예산: {formatCurrency(totalAmount)} | 증빙: {totalItems}개 | 완료: {completedItems}개
                      | 진행중: {inProgressItems}개
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="flex items-center">
                    <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="h-2 rounded-full {overallProgress >= 100
                          ? 'bg-green-600'
                          : overallProgress >= 70
                            ? 'bg-blue-600'
                            : overallProgress >= 30
                              ? 'bg-yellow-500'
                              : 'bg-red-500'}"
                        style:width="{Math.min(overallProgress, 100)}%"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-600">{overallProgress}%</span>
                  </div>
                  <ThemeButton
                    variant="ghost"
                    size="sm"
                    onclick={() => openEvidenceDetail(budgetCategory)}
                  >
                    <PlusIcon size={14} class="mr-1" />
                    추가
                  </ThemeButton>
                </div>
              </button>

              <!-- 카테고리 내용 -->
              {#if expandedEvidenceSections[budgetCategory.type]}
                <div class="p-4 border-t border-gray-200">
                  {#if categoryItems.length > 0}
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th
                              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48"
                              >증빙 항목</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                              >금액</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >담당자</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >진행률</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >마감일</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                              >상태</th
                            >
                            <th
                              class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
                              >액션</th
                            >
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          {#each categoryItems as item, i (i)}
                            {@const isOverdue =
                              new Date(item.due_date) < new Date() && item.status !== 'completed'}
                            <tr class="hover:bg-gray-50">
                              <!-- 증빙 항목 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900"
                              >
                                {item.name}
                              </td>

                              <!-- 금액 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center"
                              >
                                <span class="font-medium">{formatCurrency(item.budget_amount)}</span
                                >
                              </td>

                              <!-- 담당자 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center"
                              >
                                <span class="text-gray-600"
                                  >{memberUtilsImported.formatAssigneeNameFromFields(item)}</span
                                >
                              </td>

                              <!-- 진행률 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                                <div class="flex items-center">
                                  <div class="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      class="h-2 rounded-full {item.progress >= 100
                                        ? 'bg-green-600'
                                        : item.progress >= 70
                                          ? 'bg-blue-600'
                                          : item.progress >= 30
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'}"
                                      style:width="{Math.min(item.progress, 100)}%"
                                    ></div>
                                  </div>
                                  <span class="text-xs text-gray-600">{item.progress}%</span>
                                </div>
                              </td>

                              <!-- 마감일 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                                <span
                                  class="text-xs {isOverdue
                                    ? 'text-red-600 font-medium'
                                    : 'text-gray-600'}"
                                >
                                  {item.due_date ? formatDate(item.due_date) : '-'}
                                </span>
                              </td>

                              <!-- 상태 -->
                              <td class="px-3 py-3 whitespace-nowrap text-sm text-center">
                                <span
                                  class="px-2 py-1 text-xs font-medium rounded-full {item.status ===
                                  'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.status === 'planned'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-yellow-100 text-yellow-800'}"
                                >
                                  {item.status === 'completed'
                                    ? '완료'
                                    : item.status === 'in_progress'
                                      ? '진행중'
                                      : item.status === 'planned'
                                        ? '계획'
                                        : '검토중'}
                                </span>
                              </td>

                              <!-- 액션 -->
                              <td
                                class="px-3 py-3 whitespace-nowrap text-sm font-medium text-center"
                              >
                                <div class="flex space-x-1 justify-center">
                                  <ThemeButton
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => openEvidenceDetail(item)}
                                  >
                                    <EditIcon size={12} class="mr-1" />
                                    상세
                                  </ThemeButton>
                                </div>
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {:else}
                    <div class="text-center py-8 text-gray-500">
                      <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
                      <p>등록된 증빙 항목이 없습니다.</p>
                      <ThemeButton
                        variant="ghost"
                        size="sm"
                        class="mt-2"
                        onclick={() => openEvidenceDetail(budgetCategory)}
                      >
                        <PlusIcon size={14} class="mr-1" />
                        첫 번째 증빙 추가
                      </ThemeButton>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="text-center py-8 text-gray-500">
        <FileTextIcon size={48} class="mx-auto mb-2 text-gray-300" />
        <p>등록된 사업비가 없어 증빙을 관리할 수 없습니다.</p>
      </div>
    {/if}
  </ThemeCard>

  <!-- 증빙 상세 모달 -->
  <EvidenceDetailModal
    bind:visible={modalStates.evidenceDetail}
    selectedItem={selectedItems.evidenceItem}
    {formatCurrency}
    {formatDate}
    onclose={() => (modalStates.evidenceDetail = false)}
  />

  <!-- 증빙 추가 모달 -->
  <EvidenceAddModal
    bind:visible={modalStates.evidence}
    evidenceForm={forms.newEvidence}
    evidenceCategories={validationData.categories}
    {availableEmployees}
    isValidatingEvidence={loadingStates.validatingEvidence}
    evidenceValidation={validationData.evidence}
    isUpdating={loadingStates.updating}
    onclose={() => (modalStates.evidence = false)}
    onvalidate={validateEvidenceRegistration}
    onsubmit={handleAddEvidenceItem}
  />

  <!-- 프로젝트 수정 모달 -->
  <ProjectEditModal
    bind:visible={modalStates.editProject}
    projectForm={forms.project}
    isUpdating={loadingStates.updating}
    onclose={() => (modalStates.editProject = false)}
    onupdate={updateProject}
  />

  <!-- 프로젝트 삭제 확인 모달 -->
  <ProjectDeleteConfirmModal
    bind:open={modalStates.deleteConfirm}
    onclose={() => {
      modalStates.deleteConfirm = false
      selectedItems.deleteCode = ''
    }}
    project={selectedProject}
    projectCode={selectedProject?.code || ''}
    deleteConfirmationCode={selectedItems.deleteCode}
    membersCount={projectMembers.length}
    budgetsCount={projectBudgets.length}
    isDeleting={loadingStates.deleting}
    onConfirm={deleteProject}
  />

  <!-- 검증 결과 모달 -->
  <ValidationResultModal
    bind:open={modalStates.validation}
    onclose={() => (modalStates.validation = false)}
    validationResults={validationData.results}
  />

  <!-- 예산 수정 확인 모달 -->
  <BudgetUpdateConfirmModal
    bind:open={modalStates.budgetUpdateConfirm}
    onclose={cancelBudgetUpdate}
    validationData={selectedItems.budgetUpdateData}
    onConfirm={confirmBudgetUpdate}
    onCancel={cancelBudgetUpdate}
  />
{/if}
