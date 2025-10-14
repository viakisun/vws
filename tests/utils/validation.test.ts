import {
  BudgetConsistencyValidator,
  EmploymentPeriodValidator,
  ParticipationRateValidator,
  PersonnelCostValidator,
  UsageRateValidator,
  ValidationUtils,
  type EvidenceItem,
  type ProjectBudget,
  type ProjectMember,
  type ValidationResult,
} from '$lib/utils/validation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DBHelper } from '../helpers/db-helper'

describe('ValidationUtils', () => {
  beforeEach(() => {
    DBHelper.reset()
    vi.clearAllMocks()
  })

  describe('createValidationResult', () => {
    it('유효한 검증 결과를 생성해야 함', () => {
      const result = ValidationUtils.createValidationResult(
        true,
        'VALID',
        '검증 성공',
        ['issue1', 'issue2'],
        { key: 'value' },
      )

      expect(result).toEqual({
        isValid: true,
        reason: 'VALID',
        message: '검증 성공',
        issues: ['issue1', 'issue2'],
        details: { key: 'value' },
      })
    })

    it('기본값으로 검증 결과를 생성해야 함', () => {
      const result = ValidationUtils.createValidationResult(false, 'INVALID', '검증 실패')

      expect(result).toEqual({
        isValid: false,
        reason: 'INVALID',
        message: '검증 실패',
        issues: undefined,
        details: undefined,
      })
    })
  })

  describe('isDateRangeOverlap', () => {
    it('겹치는 날짜 범위를 올바르게 감지해야 함', () => {
      const start1 = new Date('2025-01-01')
      const end1 = new Date('2025-01-31')
      const start2 = new Date('2025-01-15')
      const end2 = new Date('2025-02-15')

      const result = ValidationUtils.isDateRangeOverlap(start1, end1, start2, end2)
      expect(result).toBe(true)
    })

    it('겹치지 않는 날짜 범위를 올바르게 감지해야 함', () => {
      const start1 = new Date('2025-01-01')
      const end1 = new Date('2025-01-31')
      const start2 = new Date('2025-02-01')
      const end2 = new Date('2025-02-28')

      const result = ValidationUtils.isDateRangeOverlap(start1, end1, start2, end2)
      expect(result).toBe(false)
    })

    it('접하는 날짜 범위를 올바르게 처리해야 함', () => {
      const start1 = new Date('2025-01-01')
      const end1 = new Date('2025-01-31')
      const start2 = new Date('2025-01-31')
      const end2 = new Date('2025-02-28')

      const result = ValidationUtils.isDateRangeOverlap(start1, end1, start2, end2)
      expect(result).toBe(true)
    })
  })

  describe('getMonthsDifference', () => {
    it('같은 해의 월 차이를 올바르게 계산해야 함', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-03-31')

      const result = ValidationUtils.getMonthsDifference(startDate, endDate)
      expect(result).toBe(3)
    })

    it('다른 해의 월 차이를 올바르게 계산해야 함', () => {
      const startDate = new Date('2024-11-01')
      const endDate = new Date('2025-02-28')

      const result = ValidationUtils.getMonthsDifference(startDate, endDate)
      expect(result).toBe(4)
    })

    it('같은 월의 차이를 올바르게 계산해야 함', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      const result = ValidationUtils.getMonthsDifference(startDate, endDate)
      expect(result).toBe(1)
    })
  })

  describe('isAmountWithinTolerance', () => {
    it('허용 오차 내의 금액을 올바르게 판단해야 함', () => {
      const result = ValidationUtils.isAmountWithinTolerance(1000, 1050, 100)
      expect(result).toBe(true)
    })

    it('허용 오차를 초과하는 금액을 올바르게 판단해야 함', () => {
      const result = ValidationUtils.isAmountWithinTolerance(1000, 1200, 100)
      expect(result).toBe(false)
    })

    it('기본 허용 오차를 사용해야 함', () => {
      const result = ValidationUtils.isAmountWithinTolerance(1000, 1050)
      expect(result).toBe(true)
    })
  })

  describe('createOverallValidation', () => {
    it('전체 검증 결과를 올바르게 생성해야 함', () => {
      const validationResults: ValidationResult[] = [
        ValidationUtils.createValidationResult(true, 'VALID', '성공1'),
        ValidationUtils.createValidationResult(true, 'VALID', '성공2'),
        ValidationUtils.createValidationResult(false, 'INVALID', '실패1'),
      ]

      const result = ValidationUtils.createOverallValidation(validationResults)

      expect(result).toEqual({
        isValid: false,
        totalItems: 3,
        validItems: 2,
        invalidItems: 1,
      })
    })

    it('모든 검증이 성공한 경우를 올바르게 처리해야 함', () => {
      const validationResults: ValidationResult[] = [
        ValidationUtils.createValidationResult(true, 'VALID', '성공1'),
        ValidationUtils.createValidationResult(true, 'VALID', '성공2'),
      ]

      const result = ValidationUtils.createOverallValidation(validationResults)

      expect(result).toEqual({
        isValid: true,
        totalItems: 2,
        validItems: 2,
        invalidItems: 0,
      })
    })
  })

  describe('createValidationResponse', () => {
    it('검증 응답을 올바르게 생성해야 함', () => {
      const validationResults: ValidationResult[] = [
        ValidationUtils.createValidationResult(true, 'VALID', '성공'),
      ]
      const overallValidation = ValidationUtils.createOverallValidation(validationResults)

      const result = ValidationUtils.createValidationResponse(
        'project-123',
        '테스트 프로젝트',
        validationResults,
        overallValidation,
      )

      expect(result).toEqual({
        success: true,
        projectId: 'project-123',
        projectTitle: '테스트 프로젝트',
        validationResults,
        overallValidation: {
          isValid: true,
          totalItems: 1,
          validItems: 1,
          invalidItems: 0,
        },
        generatedAt: expect.any(String),
      })
    })
  })

  describe('createErrorResponse', () => {
    it('에러 응답을 올바르게 생성해야 함', () => {
      const error = new Error('테스트 에러')
      const result = ValidationUtils.createErrorResponse(error, '커스텀 메시지')

      expect(result).toEqual({
        success: false,
        error: '커스텀 메시지',
        details: '테스트 에러',
      })
    })

    it('알 수 없는 에러를 올바르게 처리해야 함', () => {
      const error = '알 수 없는 에러'
      const result = ValidationUtils.createErrorResponse(error)

      expect(result).toEqual({
        success: false,
        error: '검증 중 오류가 발생했습니다.',
        details: 'Unknown error',
      })
    })
  })

  describe('Database operations', () => {
    beforeEach(() => {
      DBHelper.setupMockQuery()
    })

    it('프로젝트 정보를 조회해야 함', async () => {
      const mockProject = { id: 'project-123', title: '테스트 프로젝트' }
      DBHelper.mockQueryResponse('SELECT * FROM projects WHERE id = $1', {
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await ValidationUtils.getProjectInfo('project-123')

      expect(result).toEqual(mockProject)
      expect(DBHelper.wasQueryCalled('SELECT * FROM projects WHERE id = $1')).toBe(true)
    })

    it('존재하지 않는 프로젝트 조회 시 에러를 발생시켜야 함', async () => {
      DBHelper.mockQueryResponse('SELECT * FROM projects WHERE id = $1', { rows: [], rowCount: 0 })

      await expect(ValidationUtils.getProjectInfo('non-existent')).rejects.toThrow(
        '프로젝트를 찾을 수 없습니다.',
      )
    })

    it('프로젝트 예산을 조회해야 함', async () => {
      const mockBudgets = [
        { id: 'budget-1', period_number: 1 },
        { id: 'budget-2', period_number: 2 },
      ]
      DBHelper.mockQueryResponse(
        'SELECT * FROM project_budgets WHERE project_id = $1 ORDER BY period_number',
        { rows: mockBudgets, rowCount: mockBudgets.length },
      )

      const result = await ValidationUtils.getProjectBudgets('project-123')

      expect(result).toEqual(mockBudgets)
      expect(
        DBHelper.wasQueryCalled(
          'SELECT * FROM project_budgets WHERE project_id = $1 ORDER BY period_number',
        ),
      ).toBe(true)
    })

    it('프로젝트 멤버를 조회해야 함', async () => {
      const mockMembers = [{ id: 'member-1', first_name: '홍', last_name: '길동' }]
      DBHelper.mockQueryResponse('FROM project_members pm', {
        rows: mockMembers,
        rowCount: mockMembers.length,
      })

      const result = await ValidationUtils.getProjectMembers('project-123')

      expect(result).toEqual(mockMembers)
    })

    it('증빙 항목을 조회해야 함', async () => {
      const mockEvidence = [{ id: 'evidence-1', category_name: '인건비' }]
      DBHelper.mockQueryResponse('FROM evidence_items ei', {
        rows: mockEvidence,
        rowCount: mockEvidence.length,
      })

      const result = await ValidationUtils.getEvidenceItems('project-123')

      expect(result).toEqual(mockEvidence)
    })

    it('카테고리별 증빙 항목을 조회해야 함', async () => {
      const mockEvidence = [{ id: 'evidence-1', category_name: '인건비' }]
      DBHelper.mockQueryResponse('FROM evidence_items ei', {
        rows: mockEvidence,
        rowCount: mockEvidence.length,
      })

      const result = await ValidationUtils.getEvidenceItems('project-123', '인건비')

      expect(result).toEqual(mockEvidence)
    })

    it('직원 정보를 조회해야 함', async () => {
      const mockEmployee = { id: 'emp-1', first_name: '홍', last_name: '길동' }
      DBHelper.mockQueryResponse('FROM employees', { rows: [mockEmployee], rowCount: 1 })

      const result = await ValidationUtils.getEmployeeInfo('emp-1')

      expect(result).toEqual(mockEmployee)
    })

    it('존재하지 않는 직원 조회 시 null을 반환해야 함', async () => {
      DBHelper.mockQueryResponse('FROM employees', { rows: [], rowCount: 0 })

      const result = await ValidationUtils.getEmployeeInfo('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('Update operations', () => {
    beforeEach(() => {
      DBHelper.setupMockQuery()
    })

    it('프로젝트 예산을 업데이트해야 함', async () => {
      DBHelper.mockUpdateResponse('project_budgets', { id: 'budget-1', updated: true })

      const result = await ValidationUtils.updateProjectBudget('budget-1', {
        total_budget: 1000000,
      })

      expect(result).toBe(true)
    })

    it('프로젝트 예산 업데이트 실패 시 false를 반환해야 함', async () => {
      DBHelper.mockQueryResponse('UPDATE project_budgets SET', { rows: [], rowCount: 0 })
      // 에러를 발생시키기 위해 reject 처리
      DBHelper.getMockQuery().mockRejectedValueOnce(new Error('Database error'))

      const result = await ValidationUtils.updateProjectBudget('budget-1', {
        total_budget: 1000000,
      })

      expect(result).toBe(false)
    })

    it('프로젝트를 업데이트해야 함', async () => {
      DBHelper.mockUpdateResponse('projects', { id: 'project-1', updated: true })

      const result = await ValidationUtils.updateProject('project-1', {
        title: '새로운 제목',
      })

      expect(result).toBe(true)
    })

    it('프로젝트 멤버를 업데이트해야 함', async () => {
      DBHelper.mockUpdateResponse('project_members', { id: 'member-1', updated: true })

      const result = await ValidationUtils.updateProjectMember('member-1', {
        participation_rate: 50,
      })

      expect(result).toBe(true)
    })

    it('증빙 항목을 업데이트해야 함', async () => {
      DBHelper.mockUpdateResponse('evidence_items', { id: 'evidence-1', updated: true })

      const result = await ValidationUtils.updateEvidenceItem('evidence-1', {
        spent_amount: 500000,
      })

      expect(result).toBe(true)
    })
  })
})

describe('PersonnelCostValidator', () => {
  describe('calculateActualPersonnelCost', () => {
    it('실제 인건비를 올바르게 계산해야 함', () => {
      const members: ProjectMember[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 50,
          first_name: '홍',
          last_name: '길동',
        },
      ]

      const budget: ProjectBudget = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        personnel_cost: 1500000,
      }

      const result = PersonnelCostValidator.calculateActualPersonnelCost(members, budget)

      // 3개월 × 1,000,000원 × 50% = 1,500,000원
      expect(result).toBe(1500000)
    })

    it('예산 기간과 겹치지 않는 멤버는 제외해야 함', () => {
      const members: ProjectMember[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 50,
          first_name: '홍',
          last_name: '길동',
        },
        {
          start_date: '2025-04-01',
          end_date: '2025-06-30',
          monthly_amount: 1000000,
          participation_rate: 50,
          first_name: '김',
          last_name: '철수',
        },
      ]

      const budget: ProjectBudget = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        personnel_cost: 1500000,
      }

      const result = PersonnelCostValidator.calculateActualPersonnelCost(members, budget)

      // 첫 번째 멤버만 계산됨: 3개월 × 1,000,000원 × 50% = 1,500,000원
      expect(result).toBe(1500000)
    })

    it('부분적으로 겹치는 기간을 올바르게 계산해야 함', () => {
      const members: ProjectMember[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-04-30',
          monthly_amount: 1000000,
          participation_rate: 100,
          first_name: '홍',
          last_name: '길동',
        },
      ]

      const budget: ProjectBudget = {
        start_date: '2025-02-01',
        end_date: '2025-03-31',
        personnel_cost: 2000000,
      }

      const result = PersonnelCostValidator.calculateActualPersonnelCost(members, budget)

      // 2개월 × 1,000,000원 × 100% = 2,000,000원
      expect(result).toBe(2000000)
    })
  })

  describe('validatePersonnelCost', () => {
    it('허용 오차 내의 인건비를 유효하다고 판단해야 함', () => {
      const budget: ProjectBudget = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        personnel_cost: 1500000,
      }

      const result = PersonnelCostValidator.validatePersonnelCost(budget, 1500500)

      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('VALID')
      expect(result.message).toBe('인건비가 예산과 일치합니다.')
    })

    it('허용 오차를 초과하는 인건비를 무효하다고 판단해야 함', () => {
      const budget: ProjectBudget = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        personnel_cost: 1500000,
      }

      const result = PersonnelCostValidator.validatePersonnelCost(budget, 2000000)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('PERSONNEL_COST_MISMATCH')
      expect(result.message).toContain('인건비 불일치')
      expect(result.issues).toContain('예산: 1,500,000원')
      expect(result.issues).toContain('실제: 2,000,000원')
      expect(result.details).toEqual({
        budgetedCost: 1500000,
        actualCost: 2000000,
        difference: 500000,
      })
    })
  })
})

describe('EmploymentPeriodValidator', () => {
  describe('validateMemberEmploymentPeriod', () => {
    it('유효한 재직 기간을 올바르게 검증해야 함', () => {
      const member: ProjectMember = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        monthly_amount: 1000000,
        participation_rate: 50,
        first_name: '홍',
        last_name: '길동',
        hire_date: '2024-01-01',
        termination_date: undefined,
      }

      const project = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
      }

      const result = EmploymentPeriodValidator.validateMemberEmploymentPeriod(member, project)

      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('VALID')
    })

    it('직원 정보가 없는 경우를 무효하다고 판단해야 함', () => {
      const member: ProjectMember = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        monthly_amount: 1000000,
        participation_rate: 50,
      }

      const project = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
      }

      const result = EmploymentPeriodValidator.validateMemberEmploymentPeriod(member, project)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('EMPLOYEE_NOT_FOUND')
    })

    it('입사 전 프로젝트 참여를 무효하다고 판단해야 함', () => {
      const member: ProjectMember = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        monthly_amount: 1000000,
        participation_rate: 50,
        first_name: '홍',
        last_name: '길동',
        hire_date: '2025-02-01', // 프로젝트 시작 후 입사
      }

      const project = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
      }

      const result = EmploymentPeriodValidator.validateMemberEmploymentPeriod(member, project)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('EMPLOYMENT_PERIOD_INVALID')
      expect(result.issues).toContain(expect.stringContaining('입사일'))
    })

    it('퇴사 후 프로젝트 참여를 무효하다고 판단해야 함', () => {
      const member: ProjectMember = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        monthly_amount: 1000000,
        participation_rate: 50,
        first_name: '홍',
        last_name: '길동',
        hire_date: '2024-01-01',
        termination_date: '2025-02-01', // 프로젝트 종료 전 퇴사
      }

      const project = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
      }

      const result = EmploymentPeriodValidator.validateMemberEmploymentPeriod(member, project)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('EMPLOYMENT_PERIOD_INVALID')
    })
  })

  describe('validateEvidenceEmploymentPeriod', () => {
    it('유효한 증빙 재직 기간을 올바르게 검증해야 함', () => {
      const evidence: EvidenceItem = {
        period_number: 1,
        category_name: '인건비',
        spent_amount: 500000,
      }

      const employee = {
        hire_date: '2024-01-01',
        termination_date: undefined,
      }

      const result = EmploymentPeriodValidator.validateEvidenceEmploymentPeriod(
        evidence as any,
        employee,
      )

      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('VALID')
    })

    it('직원 정보가 없는 경우를 무효하다고 판단해야 함', () => {
      const evidence: EvidenceItem = {
        period_number: 1,
        category_name: '인건비',
        spent_amount: 500000,
      }

      const result = EmploymentPeriodValidator.validateEvidenceEmploymentPeriod(
        evidence as any,
        null as any,
      )

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('EMPLOYEE_NOT_FOUND')
    })
  })
})

describe('ParticipationRateValidator', () => {
  describe('validateParticipationRate', () => {
    it('유효한 참여율을 올바르게 검증해야 함', () => {
      const members: ProjectMember[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 50,
          first_name: '홍',
          last_name: '길동',
        },
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 30,
          first_name: '김',
          last_name: '철수',
        },
      ]

      const result = ParticipationRateValidator.validateParticipationRate(members)

      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('VALID')
    })

    it('100%를 초과하는 개별 참여율을 무효하다고 판단해야 함', () => {
      const members: ProjectMember[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 150, // 100% 초과
          first_name: '홍',
          last_name: '길동',
        },
      ]

      const result = ParticipationRateValidator.validateParticipationRate(members)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('PARTICIPATION_RATE_INVALID')
      expect(result.issues).toContain(expect.stringContaining('100% 초과'))
    })

    it('동일 기간 내 총 참여율이 100%를 초과하는 경우를 무효하다고 판단해야 함', () => {
      const members: ProjectMember[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 60,
          first_name: '홍',
          last_name: '길동',
        },
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          monthly_amount: 1000000,
          participation_rate: 50, // 총 110%
          first_name: '김',
          last_name: '철수',
        },
      ]

      const result = ParticipationRateValidator.validateParticipationRate(members)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('PARTICIPATION_RATE_INVALID')
      expect(result.issues).toContain(expect.stringContaining('100% 초과'))
    })
  })
})

describe('BudgetConsistencyValidator', () => {
  describe('validateBudgetConsistency', () => {
    it('일관성 있는 예산을 올바르게 검증해야 함', () => {
      const project = { total_budget: 10000000 }

      const budgets: ProjectBudget[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          total_budget: 5000000,
        },
        {
          start_date: '2025-04-01',
          end_date: '2025-06-30',
          total_budget: 5000000,
        },
      ]

      const result = BudgetConsistencyValidator.validateBudgetConsistency(project, budgets)

      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('VALID')
    })

    it('일관성 없는 예산을 무효하다고 판단해야 함', () => {
      const project = { total_budget: 10000000 }

      const budgets: ProjectBudget[] = [
        {
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          total_budget: 3000000,
        },
        {
          start_date: '2025-04-01',
          end_date: '2025-06-30',
          total_budget: 4000000,
        },
      ]

      const result = BudgetConsistencyValidator.validateBudgetConsistency(project, budgets)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('BUDGET_INCONSISTENCY')
      expect(result.issues).toContain(expect.stringContaining('프로젝트 총 예산'))
      expect(result.issues).toContain(expect.stringContaining('연차별 예산 합계'))
    })
  })
})

describe('UsageRateValidator', () => {
  describe('validateUsageRate', () => {
    it('일관성 있는 사용률을 올바르게 검증해야 함', () => {
      const budget: ProjectBudget = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        total_budget: 10000000,
        spent_amount: 5000000,
        period_number: 1,
        personnel_cost: 6000000,
      }

      const evidenceItems: EvidenceItem[] = [
        {
          period_number: 1,
          category_name: '인건비',
          spent_amount: 3000000, // 50% 사용률
        },
      ]

      const result = UsageRateValidator.validateUsageRate(budget, evidenceItems)

      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('VALID')
    })

    it('일관성 없는 사용률을 무효하다고 판단해야 함', () => {
      const budget: ProjectBudget = {
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        total_budget: 10000000,
        spent_amount: 5000000, // 전체 50% 사용률
        period_number: 1,
        personnel_cost: 6000000,
      }

      const evidenceItems: EvidenceItem[] = [
        {
          period_number: 1,
          category_name: '인건비',
          spent_amount: 6000000, // 인건비 100% 사용 (전체 50%와 큰 차이)
        },
      ]

      const result = UsageRateValidator.validateUsageRate(budget, evidenceItems)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('USAGE_RATE_INCONSISTENCY')
      expect(result.issues).toContain(expect.stringContaining('인건비'))
    })
  })
})
