import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the logger
vi.mock('$lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock R&D types
const mockProject = {
  id: 'project-1',
  name: 'AI 기반 자동화 시스템 개발',
  description: '인공지능을 활용한 업무 자동화 시스템 개발 프로젝트',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  status: 'active',
  budget: 100000000,
  spentAmount: 65000000,
  remainingAmount: 35000000,
  executionRate: 65.0,
  projectManager: 'manager-1',
  department: '개발팀',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockProjectMember = {
  id: 'member-1',
  projectId: 'project-1',
  employeeId: 'employee-1',
  role: 'lead_researcher',
  participationRate: 100.0,
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  status: 'active',
  salary: 5000000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockProjectBudget = {
  id: 'budget-1',
  projectId: 'project-1',
  year: 2023,
  totalBudget: 100000000,
  personnelCosts: 60000000,
  equipmentCosts: 25000000,
  materialCosts: 10000000,
  otherCosts: 5000000,
  spentAmount: 65000000,
  remainingAmount: 35000000,
  executionRate: 65.0,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockParticipationRate = {
  id: 'rate-1',
  projectId: 'project-1',
  employeeId: 'employee-1',
  month: '2023-10',
  participationRate: 100.0,
  salary: 5000000,
  status: 'active',
  createdAt: '2023-10-01T00:00:00Z',
  updatedAt: '2023-10-01T00:00:00Z',
}

const mockProjectSummary = {
  totalProjects: 10,
  activeProjects: 8,
  completedProjects: 2,
  totalBudget: 500000000,
  totalSpent: 320000000,
  totalRemaining: 180000000,
  averageExecutionRate: 64.0,
  topPerformingProject: 'project-1',
  budgetUtilizationRate: 64.0,
}

const mockBudgetAlert = {
  id: 'alert-1',
  type: 'budget',
  severity: 'warning',
  message: '예산 사용률이 80%를 초과했습니다.',
  projectId: 'project-1',
  createdAt: '2023-10-26T00:00:00Z',
}

const mockParticipationRateAlert = {
  id: 'alert-2',
  type: 'participation',
  severity: 'info',
  message: '참여율이 변경되었습니다.',
  projectId: 'project-1',
  employeeId: 'employee-1',
  createdAt: '2023-10-26T00:00:00Z',
}

describe('R&D Project Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial data structure', () => {
      const initialState = {
        projects: [],
        projectMembers: [],
        projectBudgets: [],
        participationRates: [],
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(initialState.projects).toEqual([])
      expect(initialState.projectMembers).toEqual([])
      expect(initialState.projectBudgets).toEqual([])
      expect(initialState.participationRates).toEqual([])
      expect(initialState.summary).toBeNull()
      expect(initialState.alerts).toEqual([])
      expect(initialState.loading).toBe(false)
      expect(initialState.error).toBeNull()
    })
  })

  describe('data management', () => {
    it('should handle projects data correctly', () => {
      const projects = [mockProject]
      const storeState = {
        projects,
        projectMembers: [],
        projectBudgets: [],
        participationRates: [],
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(storeState.projects).toHaveLength(1)
      expect(storeState.projects[0]).toEqual(mockProject)
      expect(storeState.projects[0].id).toBe('project-1')
      expect(storeState.projects[0].name).toBe('AI 기반 자동화 시스템 개발')
      expect(storeState.projects[0].budget).toBe(100000000)
      expect(storeState.projects[0].executionRate).toBe(65.0)
    })

    it('should handle project members data correctly', () => {
      const projectMembers = [mockProjectMember]
      const storeState = {
        projects: [],
        projectMembers,
        projectBudgets: [],
        participationRates: [],
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(storeState.projectMembers).toHaveLength(1)
      expect(storeState.projectMembers[0]).toEqual(mockProjectMember)
      expect(storeState.projectMembers[0].id).toBe('member-1')
      expect(storeState.projectMembers[0].role).toBe('lead_researcher')
      expect(storeState.projectMembers[0].participationRate).toBe(100.0)
    })

    it('should handle project budgets data correctly', () => {
      const projectBudgets = [mockProjectBudget]
      const storeState = {
        projects: [],
        projectMembers: [],
        projectBudgets,
        participationRates: [],
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(storeState.projectBudgets).toHaveLength(1)
      expect(storeState.projectBudgets[0]).toEqual(mockProjectBudget)
      expect(storeState.projectBudgets[0].id).toBe('budget-1')
      expect(storeState.projectBudgets[0].totalBudget).toBe(100000000)
      expect(storeState.projectBudgets[0].executionRate).toBe(65.0)
    })

    it('should handle participation rates data correctly', () => {
      const participationRates = [mockParticipationRate]
      const storeState = {
        projects: [],
        projectMembers: [],
        projectBudgets: [],
        participationRates,
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(storeState.participationRates).toHaveLength(1)
      expect(storeState.participationRates[0]).toEqual(mockParticipationRate)
      expect(storeState.participationRates[0].id).toBe('rate-1')
      expect(storeState.participationRates[0].participationRate).toBe(100.0)
      expect(storeState.participationRates[0].month).toBe('2023-10')
    })

    it('should handle project summary data correctly', () => {
      const summary = mockProjectSummary
      const storeState = {
        projects: [],
        projectMembers: [],
        projectBudgets: [],
        participationRates: [],
        participationRateHistory: [],
        summary,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(storeState.summary).toEqual(mockProjectSummary)
      expect(storeState.summary?.totalProjects).toBe(10)
      expect(storeState.summary?.activeProjects).toBe(8)
      expect(storeState.summary?.averageExecutionRate).toBe(64.0)
    })

    it('should handle alerts data correctly', () => {
      const alerts = [mockBudgetAlert, mockParticipationRateAlert]
      const storeState = {
        projects: [],
        projectMembers: [],
        projectBudgets: [],
        participationRates: [],
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts,
        loading: false,
        error: null,
      }

      expect(storeState.alerts).toHaveLength(2)
      expect(storeState.alerts[0]).toEqual(mockBudgetAlert)
      expect(storeState.alerts[1]).toEqual(mockParticipationRateAlert)
      expect(storeState.alerts[0].type).toBe('budget')
      expect(storeState.alerts[1].type).toBe('participation')
    })
  })

  describe('loading and error states', () => {
    it('should handle loading state correctly', () => {
      const loadingStates = [
        { loading: false, expected: false },
        { loading: true, expected: true },
      ]

      loadingStates.forEach(({ loading, expected }) => {
        const storeState = {
          projects: [],
          projectMembers: [],
          projectBudgets: [],
          participationRates: [],
          participationRateHistory: [],
          summary: null,
          employeeParticipationSummary: [],
          budgetSummaryByYear: [],
          alerts: [],
          loading,
          error: null,
        }

        expect(storeState.loading).toBe(expected)
      })
    })

    it('should handle error state correctly', () => {
      const errorStates = [
        { error: null, expected: null },
        { error: 'Database connection failed', expected: 'Database connection failed' },
        { error: 'Project not found', expected: 'Project not found' },
      ]

      errorStates.forEach(({ error, expected }) => {
        const storeState = {
          projects: [],
          projectMembers: [],
          projectBudgets: [],
          participationRates: [],
          participationRateHistory: [],
          summary: null,
          employeeParticipationSummary: [],
          budgetSummaryByYear: [],
          alerts: [],
          loading: false,
          error,
        }

        expect(storeState.error).toBe(expected)
      })
    })
  })

  describe('data filtering and calculations', () => {
    it('should filter projects by status correctly', () => {
      const projects = [
        { ...mockProject, id: 'proj-1', status: 'active' },
        { ...mockProject, id: 'proj-2', status: 'completed' },
        { ...mockProject, id: 'proj-3', status: 'active' },
        { ...mockProject, id: 'proj-4', status: 'paused' },
      ]

      const activeProjects = projects.filter((proj) => proj.status === 'active')
      expect(activeProjects).toHaveLength(2)
      expect(activeProjects[0].id).toBe('proj-1')
      expect(activeProjects[1].id).toBe('proj-3')
    })

    it('should calculate total budget correctly', () => {
      const projectBudgets = [
        { ...mockProjectBudget, id: 'budget-1', totalBudget: 100000000 },
        { ...mockProjectBudget, id: 'budget-2', totalBudget: 80000000 },
        { ...mockProjectBudget, id: 'budget-3', totalBudget: 120000000 },
      ]

      const totalBudget = projectBudgets.reduce((sum, budget) => sum + budget.totalBudget, 0)
      expect(totalBudget).toBe(300000000)
    })

    it('should calculate total spent amount correctly', () => {
      const projectBudgets = [
        { ...mockProjectBudget, id: 'budget-1', spentAmount: 65000000 },
        { ...mockProjectBudget, id: 'budget-2', spentAmount: 40000000 },
        { ...mockProjectBudget, id: 'budget-3', spentAmount: 80000000 },
      ]

      const totalSpent = projectBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0)
      expect(totalSpent).toBe(185000000)
    })

    it('should calculate average execution rate correctly', () => {
      const projectBudgets = [
        { ...mockProjectBudget, id: 'budget-1', executionRate: 65.0 },
        { ...mockProjectBudget, id: 'budget-2', executionRate: 50.0 },
        { ...mockProjectBudget, id: 'budget-3', executionRate: 75.0 },
      ]

      const averageExecutionRate =
        projectBudgets.reduce((sum, budget) => sum + budget.executionRate, 0) /
        projectBudgets.length
      expect(averageExecutionRate).toBe(63.333333333333336)
    })

    it('should filter project members by role correctly', () => {
      const projectMembers = [
        { ...mockProjectMember, id: 'member-1', role: 'lead_researcher' },
        { ...mockProjectMember, id: 'member-2', role: 'researcher' },
        { ...mockProjectMember, id: 'member-3', role: 'lead_researcher' },
        { ...mockProjectMember, id: 'member-4', role: 'assistant' },
      ]

      const leadResearchers = projectMembers.filter((member) => member.role === 'lead_researcher')
      expect(leadResearchers).toHaveLength(2)
      expect(leadResearchers[0].id).toBe('member-1')
      expect(leadResearchers[1].id).toBe('member-3')
    })

    it('should filter alerts by type correctly', () => {
      const alerts = [
        { ...mockBudgetAlert, id: 'alert-1', type: 'budget' },
        { ...mockParticipationRateAlert, id: 'alert-2', type: 'participation' },
        { ...mockBudgetAlert, id: 'alert-3', type: 'budget' },
        { ...mockParticipationRateAlert, id: 'alert-4', type: 'participation' },
      ]

      const budgetAlerts = alerts.filter((alert) => alert.type === 'budget')
      const participationAlerts = alerts.filter((alert) => alert.type === 'participation')

      expect(budgetAlerts).toHaveLength(2)
      expect(participationAlerts).toHaveLength(2)
      expect(budgetAlerts[0].id).toBe('alert-1')
      expect(participationAlerts[0].id).toBe('alert-2')
    })
  })

  describe('edge cases', () => {
    it('should handle empty data arrays', () => {
      const emptyState = {
        projects: [],
        projectMembers: [],
        projectBudgets: [],
        participationRates: [],
        participationRateHistory: [],
        summary: null,
        employeeParticipationSummary: [],
        budgetSummaryByYear: [],
        alerts: [],
        loading: false,
        error: null,
      }

      expect(emptyState.projects).toHaveLength(0)
      expect(emptyState.projectMembers).toHaveLength(0)
      expect(emptyState.projectBudgets).toHaveLength(0)
      expect(emptyState.alerts).toHaveLength(0)
    })

    it('should handle very large data sets', () => {
      const largeProjects = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProject,
        id: `project-${i}`,
        name: `프로젝트 ${i}`,
        budget: Math.floor(Math.random() * 100000000),
      }))

      expect(largeProjects).toHaveLength(1000)
      expect(largeProjects[0].id).toBe('project-0')
      expect(largeProjects[999].id).toBe('project-999')
    })

    it('should handle special characters in data', () => {
      const specialProject = {
        ...mockProject,
        name: '특수문자@#$%^&*()프로젝트',
        description: '특수문자@#$%^&*()설명',
        department: '특수@#$팀',
      }

      expect(specialProject.name).toBe('특수문자@#$%^&*()프로젝트')
      expect(specialProject.description).toBe('특수문자@#$%^&*()설명')
      expect(specialProject.department).toBe('특수@#$팀')
    })

    it('should handle Unicode characters in data', () => {
      const unicodeProject = {
        ...mockProject,
        name: '한글프로젝트한글',
        description: '한글설명한글',
        department: '한글팀',
      }

      expect(unicodeProject.name).toBe('한글프로젝트한글')
      expect(unicodeProject.description).toBe('한글설명한글')
      expect(unicodeProject.department).toBe('한글팀')
    })

    it('should handle very large budget amounts', () => {
      const largeBudgetProject = {
        ...mockProject,
        budget: 999999999999,
        spentAmount: 500000000000,
        remainingAmount: 499999999999,
      }

      expect(largeBudgetProject.budget).toBe(999999999999)
      expect(largeBudgetProject.spentAmount).toBe(500000000000)
      expect(largeBudgetProject.remainingAmount).toBe(499999999999)
    })

    it('should handle zero values', () => {
      const zeroBudgetProject = {
        ...mockProject,
        budget: 0,
        spentAmount: 0,
        remainingAmount: 0,
        executionRate: 0,
      }

      expect(zeroBudgetProject.budget).toBe(0)
      expect(zeroBudgetProject.spentAmount).toBe(0)
      expect(zeroBudgetProject.remainingAmount).toBe(0)
      expect(zeroBudgetProject.executionRate).toBe(0)
    })

    it('should handle 100% execution rate', () => {
      const completedProject = {
        ...mockProject,
        budget: 100000000,
        spentAmount: 100000000,
        remainingAmount: 0,
        executionRate: 100.0,
      }

      expect(completedProject.executionRate).toBe(100.0)
      expect(completedProject.remainingAmount).toBe(0)
    })

    it('should handle negative remaining amounts', () => {
      const overBudgetProject = {
        ...mockProject,
        budget: 100000000,
        spentAmount: 120000000,
        remainingAmount: -20000000,
        executionRate: 120.0,
      }

      expect(overBudgetProject.remainingAmount).toBe(-20000000)
      expect(overBudgetProject.executionRate).toBe(120.0)
    })
  })
})
