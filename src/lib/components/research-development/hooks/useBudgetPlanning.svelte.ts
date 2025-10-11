import { pushToast } from '$lib/stores/toasts'

/**
 * useBudgetPlanning Hook
 *
 * 2단계: 예산 계획 (Budget Planning)
 * - 인건비, 재료비, 활동비 등으로 배분 계획
 * - 참여연구원 관리 (인건비 배분의 핵심)
 */

import * as memberService from '$lib/services/research-development/member.service'
import { formatDateForInput } from '$lib/utils/format'
import { logger } from '$lib/utils/logger'
import type { ProjectDetailStore } from '../stores/projectDetailStore.svelte'
import * as calculationUtilsImported from '../utils/calculationUtils'
import * as dataTransformers from '../utils/dataTransformers'
import * as memberUtilsImported from '../utils/memberUtils'

export interface UseBudgetPlanningOptions {
  store: ProjectDetailStore
  projectId: string
  onRefresh: () => void
}

export function useBudgetPlanning(options: UseBudgetPlanningOptions) {
  const { store, projectId, onRefresh } = options

  // ============================================================================
  // Load Members (인건비 계획 - 참여연구원 로드)
  // ============================================================================

  async function loadMembers(): Promise<void> {
    try {
      const members = await memberService.getProjectMembers(projectId)

      // 각 멤버의 참여개월수 계산
      store.data.projectMembers = members.map((member: any) => {
        const participationMonths = calculationUtilsImported.calculatePeriodMonths(
          member.start_date,
          member.end_date,
        )
        return {
          ...member,
          participationMonths,
        }
      })
    } catch (error) {
      logger.error('참여연구원 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Load Available Employees (추가 가능한 직원 로드)
  // ============================================================================

  async function loadAvailableEmployees(): Promise<void> {
    try {
      store.data.availableEmployees = await memberService.getAvailableEmployees(projectId)
    } catch (error) {
      logger.error('직원 목록 로드 실패:', error)
      throw error
    }
  }

  // ============================================================================
  // Add Member (참여연구원 추가 - 인건비 계획)
  // ============================================================================

  async function addMember(): Promise<void> {
    // 참여율 검증
    if (store.forms.member.participationRate < 0 || store.forms.member.participationRate > 100) {
      pushToast('참여율은 0-100 사이의 값이어야 합니다.', 'info')
      return
    }

    try {
      // 날짜를 API 형식(YYYY-MM-DD)으로 변환
      const formattedStartDate = calculationUtilsImported.convertDateToISO(
        store.forms.member.startDate,
      )
      const formattedEndDate = calculationUtilsImported.convertDateToISO(store.forms.member.endDate)

      await memberService.addMember({
        projectId,
        personnelId: store.forms.member.employeeId,
        role: store.forms.member.role,
        monthlyRate: 0, // Will be calculated by backend
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        participationRate: store.forms.member.participationRate,
        isSalaryBased: true,
        contractualSalary: dataTransformers.safeStringToNumber(
          store.forms.member.contractMonthlySalary,
          0,
        ),
        weeklyHours: null,
      })

      store.setLoading('addingMember', false)
      resetForm()
      await loadMembers()
      onRefresh()
    } catch (error) {
      logger.error('참여연구원 추가 실패:', error)
      pushToast('참여연구원 추가 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Start Add Member
  // ============================================================================

  function startAddMember(): void {
    store.setLoading('addingMember', true)
    store.selected.member = null
    resetForm()
  }

  // ============================================================================
  // Cancel Add Member
  // ============================================================================

  function cancelAddMember(): void {
    store.setLoading('addingMember', false)
    resetForm()
  }

  // ============================================================================
  // Edit Member (참여연구원 수정 준비)
  // ============================================================================

  function editMember(member: any): void {
    store.selected.member = member

    // 날짜 데이터 확인 및 안전한 처리
    const rawStartDate = memberUtilsImported.getMemberStartDate(member)
    const rawEndDate = memberUtilsImported.getMemberEndDate(member)

    store.forms.member = {
      employeeId: memberUtilsImported.getMemberEmployeeId(member),
      role: member.role,
      startDate: rawStartDate ? formatDateForInput(rawStartDate) : '',
      endDate: rawEndDate ? formatDateForInput(rawEndDate) : '',
      participationRate: memberUtilsImported.getMemberParticipationRate(member) || 0,
      monthlyAmount: dataTransformers.safeNumberToString(
        memberUtilsImported.getMemberMonthlyAmount(member),
      ),
      contractMonthlySalary: dataTransformers.safeNumberToString(
        calculationUtilsImported.calculateContractMonthlySalary(member),
      ),
      participationMonths: calculationUtilsImported.calculatePeriodMonths(
        memberUtilsImported.getMemberStartDate(member),
        memberUtilsImported.getMemberEndDate(member),
      ),
      cashAmount: dataTransformers.extractCashAmount(member),
      inKindAmount: dataTransformers.extractInKindAmount(member),
    }

    // 수정 시 월간금액 자동 계산 (수동 입력 플래그 초기화)
    store.ui.isManualMonthlyAmount = false
  }

  // ============================================================================
  // Reset Form
  // ============================================================================

  function resetForm(): void {
    store.forms.member = {
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
    store.ui.calculatedMonthlyAmount = 0
    store.ui.isManualMonthlyAmount = false
  }

  // ============================================================================
  // Cancel Edit Member
  // ============================================================================

  function cancelEditMember(): void {
    store.selected.member = null
    resetForm()
  }

  // ============================================================================
  // Update Member (참여연구원 수정 - 인건비 계획 변경)
  // ============================================================================

  async function updateMember(): Promise<void> {
    if (!store.selected.member) return

    // 참여율 검증
    if (store.forms.member.participationRate < 0 || store.forms.member.participationRate > 100) {
      pushToast('참여율은 0-100 사이의 값이어야 합니다.', 'info')
      return
    }

    // 필수 필드 검증
    if (!store.forms.member.startDate || !store.forms.member.endDate) {
      pushToast('참여기간(시작일, 종료일)을 모두 입력해주세요.', 'info')
      return
    }

    try {
      // 날짜를 API 형식(YYYY-MM-DD)으로 변환
      const formattedStartDate = calculationUtilsImported.convertDateToISO(
        store.forms.member.startDate,
      )
      const formattedEndDate = calculationUtilsImported.convertDateToISO(store.forms.member.endDate)

      await memberService.updateMember({
        id: store.selected.member.id,
        role: store.forms.member.role,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        participationRate: store.forms.member.participationRate,
      })

      store.selected.member = null
      store.setLoading('addingMember', false)
      resetForm()

      // 데이터 새로고침
      await loadMembers()

      onRefresh()

      // 성공 메시지 표시
      pushToast('연구원 정보가 수정되었습니다.', 'success')
    } catch (error) {
      logger.error('참여연구원 수정 실패:', error)
      pushToast('연구원 정보 수정 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Remove Member (참여연구원 삭제)
  // ============================================================================

  async function removeMember(memberId: string): Promise<void> {
    if (!confirm('정말로 이 연구원을 제거하시겠습니까?')) return

    try {
      await memberService.deleteMember(memberId)
      await loadMembers()
      onRefresh()
    } catch (error) {
      logger.error('참여연구원 삭제 실패:', error)
      pushToast('참여연구원 삭제 중 오류가 발생했습니다.', 'success')
      throw error
    }
  }

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Data
    get members() {
      return store.data.projectMembers
    },
    get availableEmployees() {
      return store.data.availableEmployees
    },
    get isAddingMember() {
      return store.loading.addingMember
    },
    get selectedMember() {
      return store.selected.member
    },
    get memberForm() {
      return store.forms.member
    },

    // Actions
    loadMembers,
    loadAvailableEmployees,
    addMember,
    startAddMember,
    cancelAddMember,
    editMember,
    cancelEditMember,
    updateMember,
    removeMember,
    resetForm,
  }
}
