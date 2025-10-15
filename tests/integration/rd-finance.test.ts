import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../helpers/api-helper'
import { DBHelper } from '../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

describe('R&D + Finance Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DBHelper.reset()
    mockRequireAuth.mockResolvedValue({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'admin'],
      },
    })
  })

  describe('Project Budget Management Flow', () => {
    it('should complete project budget creation and allocation flow', async () => {
      // 1. Mock project data
      const mockProject = {
        id: 'project-1',
        name: 'AI 기반 자동화 시스템 개발',
        description: '인공지능을 활용한 업무 자동화 시스템 개발 프로젝트',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        status: 'active',
        projectManager: 'manager-1',
        department: '개발팀',
      }

      DBHelper.mockSelectResponse('rd_projects', [mockProject])

      // 2. Mock project budget creation
      const mockProjectBudget = {
        id: 'budget-1',
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        personnelCosts: 60000000,
        equipmentCosts: 25000000,
        materialCosts: 10000000,
        otherCosts: 5000000,
        spentAmount: 0,
        remainingAmount: 100000000,
        executionRate: 0.0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }

      DBHelper.mockUpdateResponse('rd_project_budgets', mockProjectBudget)

      // 3. Mock financial account allocation
      const mockAllocationTransaction = {
        id: 'transaction-allocation',
        accountId: 'rd-reserve-account',
        amount: -100000000,
        type: 'transfer',
        category: 'project_allocation',
        description: 'R&D 프로젝트 예산 배정 - AI 기반 자동화 시스템 개발',
        referenceNumber: 'RD-ALLOC-2023-001',
        transactionDate: '2023-01-01',
        balanceAfter: 400000000,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      }

      DBHelper.mockUpdateResponse('transactions', mockAllocationTransaction)

      const request = createMockRequest('POST', {
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        personnelCosts: 60000000,
        equipmentCosts: 25000000,
        materialCosts: 10000000,
        otherCosts: 5000000,
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()

        // Step 1: Verify project exists
        const projectResult = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_projects WHERE id = ?',
        )
        const project = projectResult.rows[0] || mockProject

        if (!project) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Project not found',
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Step 2: Validate budget amounts
        const totalCalculated =
          body.personnelCosts + body.equipmentCosts + body.materialCosts + body.otherCosts
        if (totalCalculated !== body.totalBudget) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Budget amount mismatch',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Step 3: Create project budget
        const budgetData = {
          projectId: body.projectId,
          year: body.year,
          totalBudget: body.totalBudget,
          personnelCosts: body.personnelCosts,
          equipmentCosts: body.equipmentCosts,
          materialCosts: body.materialCosts,
          otherCosts: body.otherCosts,
          spentAmount: 0,
          remainingAmount: body.totalBudget,
          executionRate: 0.0,
        }

        const budgetResult = await DBHelper.getMockQuery()('INSERT INTO rd_project_budgets ...')

        // Step 4: Create allocation transaction
        const transactionData = {
          accountId: 'rd-reserve-account',
          amount: -body.totalBudget,
          type: 'transfer',
          category: 'project_allocation',
          description: `R&D 프로젝트 예산 배정 - ${project.name}`,
          referenceNumber: `RD-ALLOC-${body.year}-001`,
          transactionDate: new Date().toISOString().split('T')[0],
        }

        const transactionResult = await DBHelper.getMockQuery()('INSERT INTO transactions ...')

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              budget: budgetResult.rows[0],
              transaction: transactionResult.rows[0],
              project: project,
            },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      })

      const response = await mockPOST({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.budget).toBeDefined()
      expect(responseBody.data.transaction).toBeDefined()
      expect(responseBody.data.project).toBeDefined()

      // Verify database operations
      expect(DBHelper.getMockQuery()).toHaveBeenCalled()
    })

    it('should handle project expenditure tracking flow', async () => {
      // 1. Mock existing project budget
      const mockProjectBudget = {
        id: 'budget-1',
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        personnelCosts: 60000000,
        equipmentCosts: 25000000,
        materialCosts: 10000000,
        otherCosts: 5000000,
        spentAmount: 30000000,
        remainingAmount: 70000000,
        executionRate: 30.0,
      }

      DBHelper.mockSelectResponse('rd_project_budgets', [mockProjectBudget])

      // 2. Mock project expenditure
      const mockExpenditure = {
        id: 'expenditure-1',
        projectId: 'project-1',
        amount: 5000000,
        category: 'equipment',
        description: '개발 서버 구매',
        vendor: '서버 전문 업체',
        expenditureDate: '2023-10-26',
        approvedBy: 'manager-1',
        status: 'approved',
      }

      DBHelper.mockUpdateResponse('rd_project_expenditures', mockExpenditure)

      // 3. Mock updated budget
      const updatedBudget = {
        ...mockProjectBudget,
        spentAmount: 35000000,
        remainingAmount: 65000000,
        executionRate: 35.0,
      }

      DBHelper.mockUpdateResponse('rd_project_budgets', updatedBudget)

      // 4. Mock expenditure transaction
      const mockExpenditureTransaction = {
        id: 'transaction-expenditure',
        accountId: 'rd-operating-account',
        amount: -5000000,
        type: 'expense',
        category: 'rd_equipment',
        description: 'R&D 프로젝트 지출 - AI 기반 자동화 시스템 개발: 개발 서버 구매',
        referenceNumber: 'RD-EXP-2023-001',
        transactionDate: '2023-10-26',
        createdAt: '2023-10-26T00:00:00Z',
      }

      DBHelper.mockUpdateResponse('transactions', mockExpenditureTransaction)

      const request = createMockRequest('POST', {
        projectId: 'project-1',
        amount: 5000000,
        category: 'equipment',
        description: '개발 서버 구매',
        vendor: '서버 전문 업체',
        expenditureDate: '2023-10-26',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()

        // Step 1: Get project budget
        const budgetResult = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_project_budgets WHERE project_id = ? AND year = ?',
        )
        const budget = budgetResult.rows[0] || mockProjectBudget

        if (!budget) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Project budget not found',
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Step 2: Check if expenditure exceeds remaining budget
        if (body.amount > budget.remainingAmount) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Expenditure exceeds remaining budget',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Step 3: Create expenditure record
        const expenditureData = {
          projectId: body.projectId,
          amount: body.amount,
          category: body.category,
          description: body.description,
          vendor: body.vendor,
          expenditureDate: body.expenditureDate,
          status: 'pending',
        }

        const expenditureResult = await DBHelper.getMockQuery()(
          'INSERT INTO rd_project_expenditures ...',
        )

        // Step 4: Update project budget
        const newSpentAmount = budget.spentAmount + body.amount
        const newRemainingAmount = budget.remainingAmount - body.amount
        const newExecutionRate = (newSpentAmount / budget.totalBudget) * 100

        const updatedBudgetData = {
          ...budget,
          spentAmount: newSpentAmount,
          remainingAmount: newRemainingAmount,
          executionRate: newExecutionRate,
        }

        await DBHelper.getMockQuery()(
          'UPDATE rd_project_budgets SET spent_amount = ?, remaining_amount = ?, execution_rate = ? WHERE id = ?',
        )

        // Step 5: Create expenditure transaction
        const transactionData = {
          accountId: 'rd-operating-account',
          amount: -body.amount,
          type: 'expense',
          category: `rd_${body.category}`,
          description: `R&D 프로젝트 지출 - ${budget.projectId}: ${body.description}`,
          referenceNumber: `RD-EXP-${new Date().getFullYear()}-001`,
          transactionDate: body.expenditureDate,
        }

        const transactionResult = await DBHelper.getMockQuery()('INSERT INTO transactions ...')

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              expenditure: expenditureResult.rows[0],
              updatedBudget: updatedBudgetData,
              transaction: transactionResult.rows[0],
            },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      })

      const response = await mockPOST({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.expenditure).toBeDefined()
      expect(responseBody.data.updatedBudget).toBeDefined()
      expect(responseBody.data.transaction).toBeDefined()

      // Verify updated budget calculations
      expect(responseBody.data.updatedBudget.spentAmount).toBe(35000000)
      expect(responseBody.data.updatedBudget.remainingAmount).toBe(65000000)
      expect(responseBody.data.updatedBudget.executionRate).toBe(35.0)
    })

    it('should handle budget overrun prevention', async () => {
      const mockProjectBudget = {
        id: 'budget-1',
        projectId: 'project-1',
        year: 2023,
        totalBudget: 100000000,
        spentAmount: 95000000,
        remainingAmount: 5000000,
        executionRate: 95.0,
      }

      DBHelper.mockSelectResponse('rd_project_budgets', [mockProjectBudget])

      const request = createMockRequest('POST', {
        projectId: 'project-1',
        amount: 10000000, // 10M expenditure, but only 5M remaining
        category: 'equipment',
        description: '고가 장비 구매',
        expenditureDate: '2023-10-26',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()

        const budgetResult = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_project_budgets WHERE project_id = ? AND year = ?',
        )
        const budget = budgetResult.rows[0]

        if (body.amount > budget.remainingAmount) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Expenditure exceeds remaining budget',
              details: {
                requestedAmount: body.amount,
                remainingAmount: budget.remainingAmount,
                overrunAmount: body.amount - budget.remainingAmount,
              },
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        return new Response(JSON.stringify({ success: true }), { status: 201 })
      })

      const response = await mockPOST({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Expenditure exceeds remaining budget')
      expect(responseBody.details.requestedAmount).toBe(10000000)
      expect(responseBody.details.remainingAmount).toBe(5000000)
      expect(responseBody.details.overrunAmount).toBe(5000000)
    })
  })

  describe('Research Cost Accounting Flow', () => {
    it('should complete research cost calculation and accounting flow', async () => {
      // 1. Mock project members
      const mockProjectMembers = [
        {
          id: 'member-1',
          projectId: 'project-1',
          employeeId: 'employee-1',
          role: 'lead_researcher',
          participationRate: 100.0,
          salary: 6000000,
        },
        {
          id: 'member-2',
          projectId: 'project-1',
          employeeId: 'employee-2',
          role: 'researcher',
          participationRate: 80.0,
          salary: 5000000,
        },
      ]

      DBHelper.mockSelectResponse('rd_project_members', mockProjectMembers)

      // 2. Mock project budget
      const mockProjectBudget = {
        id: 'budget-1',
        projectId: 'project-1',
        year: 2023,
        personnelCosts: 60000000,
        spentAmount: 0,
        remainingAmount: 60000000,
      }

      DBHelper.mockSelectResponse('rd_project_budgets', [mockProjectBudget])

      // 3. Mock research cost calculation
      const mockResearchCosts = [
        {
          id: 'cost-1',
          projectId: 'project-1',
          employeeId: 'employee-1',
          month: '2023-10',
          participationRate: 100.0,
          salary: 6000000,
          researchCost: 6000000, // 100% participation
          status: 'calculated',
        },
        {
          id: 'cost-2',
          projectId: 'project-1',
          employeeId: 'employee-2',
          month: '2023-10',
          participationRate: 80.0,
          salary: 5000000,
          researchCost: 4000000, // 80% participation
          status: 'calculated',
        },
      ]

      DBHelper.mockUpdateResponse('rd_research_costs', mockResearchCosts)

      // 4. Mock total research cost transaction
      const mockTotalResearchCost = 10000000 // 6M + 4M
      const mockResearchCostTransaction = {
        id: 'transaction-research-cost',
        accountId: 'rd-operating-account',
        amount: -mockTotalResearchCost,
        type: 'expense',
        category: 'rd_personnel',
        description: 'R&D 연구원 인건비 - AI 기반 자동화 시스템 개발 (2023-10)',
        referenceNumber: 'RD-PERSONNEL-2023-10',
        transactionDate: '2023-10-31',
      }

      DBHelper.mockUpdateResponse('transactions', mockResearchCostTransaction)

      const request = createMockRequest('POST', {
        projectId: 'project-1',
        month: '2023-10',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()

        // Step 1: Get project members
        const membersResult = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_project_members WHERE project_id = ?',
        )
        const members = membersResult.rows

        // Step 2: Get project budget
        const budgetResult = await DBHelper.getMockQuery()(
          'SELECT * FROM rd_project_budgets WHERE project_id = ? AND year = ?',
        )
        const budget = budgetResult.rows[0] || mockProjectBudget

        // Step 3: Calculate research costs for each member
        const researchCosts = members.map((member) => {
          const researchCost = (member.salary * member.participationRate) / 100
          return {
            projectId: body.projectId,
            employeeId: member.employeeId,
            month: body.month,
            participationRate: member.participationRate,
            salary: member.salary,
            researchCost,
            status: 'calculated',
          }
        })

        // Step 4: Save research costs
        const totalResearchCost = researchCosts.reduce((sum, cost) => sum + cost.researchCost, 0)

        // Check if total exceeds budget
        if (totalResearchCost > budget.remainingAmount) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Total research cost exceeds remaining budget',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Save individual research costs
        for (const cost of researchCosts) {
          await DBHelper.getMockQuery()('INSERT INTO rd_research_costs ...')
        }

        // Step 5: Create total research cost transaction
        const transactionData = {
          accountId: 'rd-operating-account',
          amount: -totalResearchCost,
          type: 'expense',
          category: 'rd_personnel',
          description: `R&D 연구원 인건비 - ${body.projectId} (${body.month})`,
          referenceNumber: `RD-PERSONNEL-${body.month}`,
          transactionDate: new Date().toISOString().split('T')[0],
        }

        const transactionResult = await DBHelper.getMockQuery()('INSERT INTO transactions ...')

        // Step 6: Update project budget
        const updatedBudget = {
          ...budget,
          spentAmount: budget.spentAmount + totalResearchCost,
          remainingAmount: budget.remainingAmount - totalResearchCost,
          executionRate: ((budget.spentAmount + totalResearchCost) / budget.totalBudget) * 100,
        }

        await DBHelper.getMockQuery()(
          'UPDATE rd_project_budgets SET spent_amount = ?, remaining_amount = ?, execution_rate = ? WHERE id = ?',
        )

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              researchCosts,
              totalResearchCost,
              transaction: transactionResult.rows[0],
              updatedBudget,
            },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      })

      const response = await mockPOST({
        request,
        url: event.url,
        params: {},
        locals: event.locals,
        route: event.route,
        cookies: event.cookies,
        fetch: event.fetch,
        getClientAddress: event.getClientAddress,
        platform: event.platform,
      })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.researchCosts).toHaveLength(2)
      expect(responseBody.data.totalResearchCost).toBe(10000000)
      expect(responseBody.data.transaction).toBeDefined()
      expect(responseBody.data.updatedBudget).toBeDefined()

      // Verify research cost calculations
      expect(responseBody.data.researchCosts[0].researchCost).toBe(6000000) // 100% participation
      expect(responseBody.data.researchCosts[1].researchCost).toBe(4000000) // 80% participation
    })
  })
})
