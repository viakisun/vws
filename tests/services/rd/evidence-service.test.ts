import * as evidenceService from '$lib/services/research-development/evidence.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('evidence.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('getEvidence', () => {
    it('should fetch evidence successfully', async () => {
      const mockEvidence = {
        id: 'evidence-1',
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        categoryCode: 'PERSONNEL',
        categoryName: '인건비',
        name: '연구원 인건비',
        description: '프로젝트 연구원 인건비',
        budgetAmount: 5000000,
        spentAmount: 2500000,
        assigneeId: 'employee-1',
        assigneeName: '홍길동',
        progress: 50,
        status: 'in_progress',
        dueDate: '2024-12-31',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        vendorId: 'vendor-1',
        vendorName: '협력업체',
        vendorFullName: '협력업체 주식회사',
        vendorBusinessNumber: '123-45-67890',
        itemDetail: '연구원 인건비',
        taxAmount: 250000,
        paymentDate: '2024-06-15',
        notes: '1분기 인건비',
        employeeId: 'employee-1',
        projectMemberId: 'member-1',
        evidenceMonth: '2024-06',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
        documentCount: 5,
        approvedDocumentCount: 3,
        scheduleCount: 2,
        overdueScheduleCount: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockEvidence }),
      })

      const result = await evidenceService.getEvidence('evidence-1')

      expect(result).toEqual(mockEvidence)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/evidence/evidence-1')
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(evidenceService.getEvidence('nonexistent')).rejects.toThrow(
        'Failed to fetch evidence: 404 Not Found',
      )
    })
  })

  describe('getEvidenceCategories', () => {
    it('should fetch evidence categories successfully', async () => {
      const mockCategories = [
        {
          id: 'category-1',
          code: 'PERSONNEL',
          name: '인건비',
          description: '연구원 인건비',
          parentCode: null,
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
          parentCode: null,
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
          parentCode: null,
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

      const result = await evidenceService.getEvidenceCategories()

      expect(result).toEqual(mockCategories)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/evidence-categories')
    })

    it('should handle fetch errors for categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(evidenceService.getEvidenceCategories()).rejects.toThrow(
        'Failed to fetch evidence categories: 500 Internal Server Error',
      )
    })

    it('should return empty array when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await evidenceService.getEvidenceCategories()

      expect(result).toEqual([])
    })
  })

  describe('getEvidenceTypes', () => {
    it('should fetch evidence types successfully', async () => {
      const mockTypes = [
        {
          id: 'type-1',
          name: '인건비',
          code: 'PERSONNEL',
        },
        {
          id: 'type-2',
          name: '재료비',
          code: 'MATERIALS',
        },
        {
          id: 'type-3',
          name: '활동비',
          code: 'ACTIVITY',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockTypes }),
      })

      const result = await evidenceService.getEvidenceTypes()

      expect(result).toEqual(mockTypes)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/evidence-types')
    })

    it('should handle fetch errors for types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(evidenceService.getEvidenceTypes()).rejects.toThrow(
        'Failed to fetch evidence types: 500 Internal Server Error',
      )
    })

    it('should return empty array when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await evidenceService.getEvidenceTypes()

      expect(result).toEqual([])
    })
  })

  describe('createEvidence', () => {
    it('should create evidence successfully', async () => {
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: '연구원 인건비',
        description: '프로젝트 연구원 인건비',
        budgetAmount: 5000000,
        spentAmount: 0,
        assigneeId: 'employee-1',
        progress: 0,
        status: 'pending' as const,
        dueDate: '2024-12-31',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      const mockCreatedEvidence = {
        id: 'evidence-new',
        ...evidenceData,
        categoryCode: 'PERSONNEL',
        categoryName: '인건비',
        assigneeName: '홍길동',
        vendorId: null,
        vendorName: null,
        vendorFullName: null,
        vendorBusinessNumber: null,
        itemDetail: null,
        taxAmount: null,
        paymentDate: null,
        notes: null,
        employeeId: null,
        projectMemberId: null,
        evidenceMonth: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        documentCount: 0,
        approvedDocumentCount: 0,
        scheduleCount: 0,
        overdueScheduleCount: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedEvidence }),
      })

      const result = await evidenceService.createEvidence(evidenceData)

      expect(result).toEqual(mockCreatedEvidence)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidenceData),
      })
    })

    it('should handle creation errors', async () => {
      const evidenceData = {
        projectBudgetId: 'nonexistent-budget',
        categoryId: 'category-1',
        name: 'Invalid Evidence',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(evidenceService.createEvidence(evidenceData)).rejects.toThrow(
        'Failed to create evidence: 400 Bad Request',
      )
    })

    it('should handle duplicate evidence creation', async () => {
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: 'Duplicate Evidence',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      await expect(evidenceService.createEvidence(evidenceData)).rejects.toThrow(
        'Failed to create evidence: 409 Conflict',
      )
    })
  })

  describe('updateEvidence', () => {
    it('should update evidence successfully', async () => {
      const evidenceId = 'evidence-1'
      const updateData = {
        spentAmount: 3000000,
        progress: 60,
        status: 'in_progress' as const,
        notes: 'Updated notes',
      }

      const mockUpdatedEvidence = {
        id: evidenceId,
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        categoryCode: 'PERSONNEL',
        categoryName: '인건비',
        name: '연구원 인건비',
        description: '프로젝트 연구원 인건비',
        budgetAmount: 5000000,
        spentAmount: updateData.spentAmount,
        assigneeId: 'employee-1',
        assigneeName: '홍길동',
        progress: updateData.progress,
        status: updateData.status,
        dueDate: '2024-12-31',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        vendorId: null,
        vendorName: null,
        vendorFullName: null,
        vendorBusinessNumber: null,
        itemDetail: null,
        taxAmount: null,
        paymentDate: null,
        notes: updateData.notes,
        employeeId: null,
        projectMemberId: null,
        evidenceMonth: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        documentCount: 5,
        approvedDocumentCount: 3,
        scheduleCount: 2,
        overdueScheduleCount: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUpdatedEvidence }),
      })

      const result = await evidenceService.updateEvidence(evidenceId, updateData)

      expect(result).toEqual(mockUpdatedEvidence)
      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/evidence/${evidenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    })

    it('should handle update errors', async () => {
      const evidenceId = 'evidence-1'
      const updateData = { spent_amount: 3000000 }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(evidenceService.updateEvidence(evidenceId, updateData)).rejects.toThrow(
        'Failed to update evidence: 404 Not Found',
      )
    })

    it('should handle invalid update data', async () => {
      const evidenceId = 'evidence-1'
      const updateData = { spent_amount: -1000000 } // Negative amount

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(evidenceService.updateEvidence(evidenceId, updateData)).rejects.toThrow(
        'Failed to update evidence: 400 Bad Request',
      )
    })
  })

  describe('deleteEvidence', () => {
    it('should delete evidence successfully', async () => {
      const evidenceId = 'evidence-1'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await evidenceService.deleteEvidence(evidenceId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/evidence/${evidenceId}`, {
        method: 'DELETE',
      })
    })

    it('should handle deletion errors', async () => {
      const evidenceId = 'evidence-1'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(evidenceService.deleteEvidence(evidenceId)).rejects.toThrow(
        'Failed to delete evidence: 404 Not Found',
      )
    })

    it('should handle deletion when evidence has documents', async () => {
      const evidenceId = 'evidence-with-documents'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      await expect(evidenceService.deleteEvidence(evidenceId)).rejects.toThrow(
        'Failed to delete evidence: 409 Conflict',
      )
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(evidenceService.getEvidence('evidence-1')).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(evidenceService.getEvidence('evidence-1')).rejects.toThrow('Invalid JSON')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(evidenceService.createEvidence({ name: 'Test Evidence' })).rejects.toThrow(
        'Request timeout',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle very large amounts', async () => {
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: 'Large Amount Evidence',
        budgetAmount: 999999999999,
        spentAmount: 999999999999,
      }

      const mockCreatedEvidence = {
        id: 'evidence-large',
        ...evidenceData,
        progress: 100,
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedEvidence }),
      })

      const result = await evidenceService.createEvidence(evidenceData)

      expect(result).toEqual(mockCreatedEvidence)
    })

    it('should handle zero amounts', async () => {
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: 'Zero Amount Evidence',
        budgetAmount: 0,
        spentAmount: 0,
      }

      const mockCreatedEvidence = {
        id: 'evidence-zero',
        ...evidenceData,
        progress: 0,
        status: 'pending',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedEvidence }),
      })

      const result = await evidenceService.createEvidence(evidenceData)

      expect(result).toEqual(mockCreatedEvidence)
    })

    it('should handle decimal amounts', async () => {
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: 'Decimal Amount Evidence',
        budgetAmount: 1234567.89,
        spentAmount: 987654.32,
      }

      const mockCreatedEvidence = {
        id: 'evidence-decimal',
        ...evidenceData,
        progress: 80,
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedEvidence }),
      })

      const result = await evidenceService.createEvidence(evidenceData)

      expect(result).toEqual(mockCreatedEvidence)
    })

    it('should handle special characters in names and descriptions', async () => {
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: '증빙 이름 (특수문자: @#$%)',
        description: '설명 with 한글 & English',
        budgetAmount: 1000000,
        spentAmount: 500000,
      }

      const mockCreatedEvidence = {
        id: 'evidence-special',
        ...evidenceData,
        progress: 50,
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedEvidence }),
      })

      const result = await evidenceService.createEvidence(evidenceData)

      expect(result).toEqual(mockCreatedEvidence)
    })

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(10000)
      const evidenceData = {
        projectBudgetId: 'budget-1',
        categoryId: 'category-1',
        name: 'Long Description Evidence',
        description: longDescription,
        budgetAmount: 1000000,
        spentAmount: 500000,
      }

      const mockCreatedEvidence = {
        id: 'evidence-long-desc',
        ...evidenceData,
        progress: 50,
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedEvidence }),
      })

      const result = await evidenceService.createEvidence(evidenceData)

      expect(result).toEqual(mockCreatedEvidence)
    })

    it('should handle all status values', async () => {
      const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const

      for (const status of statuses) {
        const evidenceData = {
          projectBudgetId: 'budget-1',
          categoryId: 'category-1',
          name: `Evidence with status ${status}`,
          budgetAmount: 1000000,
          spentAmount: 500000,
          status,
        }

        const mockCreatedEvidence = {
          id: `evidence-${status}`,
          ...evidenceData,
          progress: status === 'completed' ? 100 : 50,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCreatedEvidence }),
        })

        const result = await evidenceService.createEvidence(evidenceData)

        expect(result).toEqual(mockCreatedEvidence)
      }
    })

    it('should handle progress values from 0 to 100', async () => {
      const progressValues = [0, 25, 50, 75, 100]

      for (const progress of progressValues) {
        const evidenceData = {
          projectBudgetId: 'budget-1',
          categoryId: 'category-1',
          name: `Evidence with progress ${progress}`,
          budgetAmount: 1000000,
          spentAmount: (1000000 * progress) / 100,
          progress,
        }

        const mockCreatedEvidence = {
          id: `evidence-progress-${progress}`,
          ...evidenceData,
          status: progress === 100 ? 'completed' : 'in_progress',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockCreatedEvidence }),
        })

        const result = await evidenceService.createEvidence(evidenceData)

        expect(result).toEqual(mockCreatedEvidence)
      }
    })
  })
})
