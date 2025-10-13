import * as budgetService from '$lib/services/research-development/budget.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('budget.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('getProjectBudgets', () => {
    it('should fetch project budgets successfully', async () => {
      const mockBudgets = [
        {
          id: 'budget-1',
          projectId: 'project-1',
          year: 2024,
          totalBudget: 10000000,
          personnelCostCash: 5000000,
          personnelCostInKind: 2000000,
          researchMaterialCostCash: 1500000,
          researchMaterialCostInKind: 500000,
          researchActivityCostCash: 800000,
          researchActivityCostInKind: 200000,
          researchStipendCash: 0,
          researchStipendInKind: 0,
          indirectCostCash: 0,
          indirectCostInKind: 0,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'budget-2',
          projectId: 'project-1',
          year: 2025,
          totalBudget: 12000000,
          personnelCostCash: 6000000,
          personnelCostInKind: 2500000,
          researchMaterialCostCash: 1800000,
          researchMaterialCostInKind: 700000,
          researchActivityCostCash: 1000000,
          researchActivityCostInKind: 0,
          researchStipendCash: 0,
          researchStipendInKind: 0,
          indirectCostCash: 0,
          indirectCostInKind: 0,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockBudgets }),
      })

      const result = await budgetService.getProjectBudgets('project-1')

      expect(result).toEqual(mockBudgets)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/research-development/project-budgets?projectId=project-1',
      )
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(budgetService.getProjectBudgets('project-1')).rejects.toThrow(
        'Failed to fetch project budgets: 500 Internal Server Error',
      )
    })

    it('should return empty array when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await budgetService.getProjectBudgets('project-1')

      expect(result).toEqual([])
    })
  })

  describe('createBudget', () => {
    it('should create a budget successfully', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: 5000000,
        personnelCostInKind: 2000000,
        researchMaterialCostCash: 1500000,
        researchMaterialCostInKind: 500000,
        researchActivityCostCash: 800000,
        researchActivityCostInKind: 200000,
        researchStipendCash: 0,
        researchStipendInKind: 0,
        indirectCostCash: 0,
        indirectCostInKind: 0,
      }

      const mockCreatedBudget = {
        id: 'budget-new',
        ...budgetData,
        totalBudget: 10000000,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/project-budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData),
      })
    })

    it('should handle creation errors', async () => {
      const budgetData = {
        projectId: 'nonexistent-project',
        year: 2024,
        personnelCostCash: 5000000,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(budgetService.createBudget(budgetData)).rejects.toThrow(
        'Failed to create budget: 400 Bad Request',
      )
    })

    it('should handle duplicate budget creation', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2024, // Already exists
        personnelCostCash: 5000000,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      await expect(budgetService.createBudget(budgetData)).rejects.toThrow(
        'Failed to create budget: 409 Conflict',
      )
    })
  })

  describe('updateBudget', () => {
    it('should update a budget successfully', async () => {
      const budgetId = 'budget-1'
      const updateData = {
        id: budgetId,
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: 6000000,
        researchMaterialCostCash: 2000000,
        personnelCostInKind: 2000000,
        researchMaterialCostInKind: 500000,
        researchActivityCostCash: 800000,
        researchActivityCostInKind: 200000,
        researchStipendCash: 0,
        researchStipendInKind: 0,
        indirectCostCash: 0,
        indirectCostInKind: 0,
        periodNumber: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      const mockUpdatedBudget = {
        id: budgetId,
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: updateData.personnelCostCash,
        researchMaterialCostCash: updateData.researchMaterialCostCash,
        personnelCostInKind: 2000000,
        researchMaterialCostInKind: 500000,
        researchActivityCostCash: 800000,
        researchActivityCostInKind: 200000,
        researchStipendCash: 0,
        researchStipendInKind: 0,
        indirectCostCash: 0,
        indirectCostInKind: 0,
        totalBudget: 11100000,
        status: 'active',
        updatedAt: '2024-01-15T10:30:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUpdatedBudget }),
      })

      const result = await budgetService.updateBudget(updateData)

      expect(result).toEqual(mockUpdatedBudget)
      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/project-budgets/${budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'project-1',
          year: 2024,
          personnelCostCash: 6000000,
          researchMaterialCostCash: 2000000,
          personnelCostInKind: 2000000,
          researchMaterialCostInKind: 500000,
          researchActivityCostCash: 800000,
          researchActivityCostInKind: 200000,
          researchStipendCash: 0,
          researchStipendInKind: 0,
          indirectCostCash: 0,
          indirectCostInKind: 0,
          periodNumber: 1,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      })
    })

    it('should handle update errors', async () => {
      const budgetId = 'budget-1'
      const updateData = { 
        id: budgetId,
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: 6000000,
        personnelCostInKind: 0,
        researchMaterialCostCash: 0,
        researchMaterialCostInKind: 0,
        researchActivityCostCash: 0,
        researchActivityCostInKind: 0,
        researchStipendCash: 0,
        researchStipendInKind: 0,
        indirectCostCash: 0,
        indirectCostInKind: 0,
        periodNumber: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(budgetService.updateBudget(updateData)).rejects.toThrow(
        'Failed to update budget: 404 Not Found',
      )
    })

    it('should handle invalid budget amounts', async () => {
      const budgetId = 'budget-1'
      const updateData = { 
        id: budgetId,
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: -1000000, // Negative amount
        personnelCostInKind: 0,
        researchMaterialCostCash: 0,
        researchMaterialCostInKind: 0,
        researchActivityCostCash: 0,
        researchActivityCostInKind: 0,
        researchStipendCash: 0,
        researchStipendInKind: 0,
        indirectCostCash: 0,
        indirectCostInKind: 0,
        periodNumber: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(budgetService.updateBudget(updateData)).rejects.toThrow(
        'Failed to update budget: 400 Bad Request',
      )
    })
  })

  describe('deleteBudget', () => {
    it('should delete a budget successfully', async () => {
      const budgetId = 'budget-1'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await budgetService.deleteBudget(budgetId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/project-budgets/${budgetId}`, {
        method: 'DELETE',
      })
    })

    it('should handle deletion errors', async () => {
      const budgetId = 'budget-1'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(budgetService.deleteBudget(budgetId)).rejects.toThrow(
        'Failed to delete budget: 404 Not Found',
      )
    })

    it('should handle deletion when budget has evidence items', async () => {
      const budgetId = 'budget-with-evidence'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      await expect(budgetService.deleteBudget(budgetId)).rejects.toThrow(
        'Failed to delete budget: 409 Conflict',
      )
    })
  })

  describe('getBudgetCategories', () => {
    it('should fetch budget categories successfully', async () => {
      const mockCategories = [
        {
          id: 'category-1',
          code: 'PERSONNEL',
          name: '인건비',
          description: '연구원 인건비',
          displayOrder: 1,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'category-2',
          code: 'MATERIALS',
          name: '연구재료비',
          description: '연구에 필요한 재료비',
          displayOrder: 2,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'category-3',
          code: 'ACTIVITY',
          name: '연구활동비',
          description: '연구활동 관련 비용',
          displayOrder: 3,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCategories }),
      })

      const result = await budgetService.getBudgetCategories()

      expect(result).toEqual(mockCategories)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/budget-categories')
    })

    it('should handle fetch errors for categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(budgetService.getBudgetCategories()).rejects.toThrow(
        'Failed to fetch budget categories: 500 Internal Server Error',
      )
    })

    it('should return empty array when no categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      const result = await budgetService.getBudgetCategories()

      expect(result).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(budgetService.getProjectBudgets('project-1')).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(budgetService.getProjectBudgets('project-1')).rejects.toThrow('Invalid JSON')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(budgetService.createBudget({ projectId: 'project-1', year: 2024 })).rejects.toThrow(
        'Request timeout',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle very large budget amounts', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: 999999999999,
        researchMaterialCostCash: 999999999999,
      }

      const mockCreatedBudget = {
        id: 'budget-large',
        ...budgetData,
        totalBudget: 1999999999998,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
    })

    it('should handle zero budget amounts', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: 0,
        personnelCostInKind: 0,
        researchMaterialCostCash: 0,
        researchMaterialCostInKind: 0,
        researchActivityCostCash: 0,
        researchActivityCostInKind: 0,
        researchStipendCash: 0,
        researchStipendInKind: 0,
        indirectCostCash: 0,
        indirectCostInKind: 0,
      }

      const mockCreatedBudget = {
        id: 'budget-zero',
        ...budgetData,
        totalBudget: 0,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
    })

    it('should handle decimal budget amounts', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2024,
        personnelCostCash: 1234567.89,
        researchMaterialCostCash: 987654.32,
      }

      const mockCreatedBudget = {
        id: 'budget-decimal',
        ...budgetData,
        totalBudget: 2222222.21,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
    })

    it('should handle special characters in project IDs', async () => {
      const budgetData = {
        projectId: 'project-with-special-chars-@#$%',
        year: 2024,
        personnelCostCash: 5000000,
      }

      const mockCreatedBudget = {
        id: 'budget-special',
        ...budgetData,
        totalBudget: 5000000,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
    })

    it('should handle future years', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2030,
        personnelCostCash: 5000000,
      }

      const mockCreatedBudget = {
        id: 'budget-future',
        ...budgetData,
        totalBudget: 5000000,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
    })

    it('should handle past years', async () => {
      const budgetData = {
        projectId: 'project-1',
        year: 2020,
        personnelCostCash: 5000000,
      }

      const mockCreatedBudget = {
        id: 'budget-past',
        ...budgetData,
        totalBudget: 5000000,
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedBudget }),
      })

      const result = await budgetService.createBudget(budgetData)

      expect(result).toEqual(mockCreatedBudget)
    })
  })
})
