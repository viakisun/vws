import * as validationService from '$lib/services/research-development/validation.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('validation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('validateEvidenceRegistration', () => {
    it('should validate evidence registration successfully', async () => {
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1', 'employment-2'],
        assigneeId: 'employee-1',
        dueDate: '2024-12-31',
        projectBudgetId: 'budget-1',
      }

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: ['참여율이 100%를 초과할 수 있습니다.'],
        success: true,
        data: {
          totalParticipationRate: 110,
          maxAllowedRate: 100,
          recommendedAdjustments: [
            {
              employmentId: 'employment-1',
              currentRate: 60,
              recommendedRate: 50,
            },
            {
              employmentId: 'employment-2',
              currentRate: 50,
              recommendedRate: 50,
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/research-development/evidence-items/validate-employment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validationPayload),
        },
      )
    })

    it('should handle validation errors', async () => {
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
        dueDate: '2024-12-31',
        projectBudgetId: 'budget-1',
      }

      const mockValidationResult = {
        valid: false,
        errors: ['프로젝트 예산이 부족합니다.', '참여 기간이 프로젝트 기간을 초과합니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })

    it('should handle fetch errors', async () => {
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(validationService.validateEvidenceRegistration(validationPayload)).rejects.toThrow(
        'Failed to validate evidence: 500 Internal Server Error',
      )
    })

    it('should handle empty payload', async () => {
      const validationPayload = {}

      const mockValidationResult = {
        valid: false,
        errors: ['필수 필드가 누락되었습니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
    })

    it('should handle partial payload', async () => {
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1'],
      }

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: ['담당자 정보가 누락되었습니다.'],
        success: true,
        data: {
          totalParticipationRate: 60,
          maxAllowedRate: 100,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
    })
  })

  describe('validateMembers', () => {
    it('should validate members successfully', async () => {
      const projectId = 'project-1'

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        success: true,
        data: {
          totalMembers: 3,
          totalParticipationRate: 250,
          maxAllowedRate: 300,
          memberDetails: [
            {
              memberId: 'member-1',
              name: '홍길동',
              participationRate: 100,
              role: '연구책임자',
              status: 'valid',
            },
            {
              memberId: 'member-2',
              name: '김철수',
              participationRate: 80,
              role: '연구원',
              status: 'valid',
            },
            {
              memberId: 'member-3',
              name: '이영희',
              participationRate: 70,
              role: '연구원',
              status: 'valid',
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateMembers(projectId)

      expect(result).toEqual(mockValidationResult)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/research-development/researcher-validation?projectId=${projectId}`,
      )
    })

    it('should handle member validation errors', async () => {
      const projectId = 'project-1'

      const mockValidationResult = {
        valid: false,
        errors: [
          '참여율이 300%를 초과합니다.',
          '연구책임자가 지정되지 않았습니다.',
          '프로젝트 멤버가 없습니다.',
        ],
        warnings: [],
        success: false,
        data: {
          totalMembers: 0,
          totalParticipationRate: 0,
          maxAllowedRate: 300,
          memberDetails: [],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateMembers(projectId)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })

    it('should handle fetch errors for member validation', async () => {
      const projectId = 'project-1'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(validationService.validateMembers(projectId)).rejects.toThrow(
        'Failed to validate members: 404 Not Found',
      )
    })

    it('should handle nonexistent project', async () => {
      const projectId = 'nonexistent-project'

      const mockValidationResult = {
        valid: false,
        errors: ['프로젝트를 찾을 수 없습니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateMembers(projectId)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
    })
  })

  describe('comprehensiveValidation', () => {
    it('should run comprehensive validation successfully', async () => {
      const projectId = 'project-1'

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: ['프로젝트 예산 집행율이 낮습니다.'],
        success: true,
        data: {
          projectValidation: {
            valid: true,
            errors: [],
            warnings: [],
          },
          memberValidation: {
            valid: true,
            errors: [],
            warnings: [],
            totalMembers: 3,
            totalParticipationRate: 250,
          },
          budgetValidation: {
            valid: true,
            errors: [],
            warnings: ['인건비 집행율이 낮습니다.'],
            totalBudget: 100000000,
            spentAmount: 30000000,
            executionRate: 30,
          },
          evidenceValidation: {
            valid: true,
            errors: [],
            warnings: [],
            totalEvidenceItems: 15,
            completedItems: 10,
            pendingItems: 5,
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.comprehensiveValidation(projectId)

      expect(result).toEqual(mockValidationResult)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/comprehensive-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
    })

    it('should handle comprehensive validation errors', async () => {
      const projectId = 'project-1'

      const mockValidationResult = {
        valid: false,
        errors: [
          '프로젝트 기간이 유효하지 않습니다.',
          '프로젝트 예산이 부족합니다.',
          '필수 멤버가 누락되었습니다.',
        ],
        warnings: ['증빙 항목의 진행률이 낮습니다.'],
        success: false,
        data: {
          projectValidation: {
            valid: false,
            errors: ['프로젝트 기간이 유효하지 않습니다.'],
            warnings: [],
          },
          memberValidation: {
            valid: false,
            errors: ['필수 멤버가 누락되었습니다.'],
            warnings: [],
            totalMembers: 1,
            totalParticipationRate: 100,
          },
          budgetValidation: {
            valid: false,
            errors: ['프로젝트 예산이 부족합니다.'],
            warnings: [],
            totalBudget: 10000000,
            spentAmount: 15000000,
            executionRate: 150,
          },
          evidenceValidation: {
            valid: true,
            errors: [],
            warnings: ['증빙 항목의 진행률이 낮습니다.'],
            totalEvidenceItems: 10,
            completedItems: 2,
            pendingItems: 8,
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.comprehensiveValidation(projectId)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })

    it('should handle fetch errors for comprehensive validation', async () => {
      const projectId = 'project-1'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(validationService.comprehensiveValidation(projectId)).rejects.toThrow(
        'Failed to run comprehensive validation: 500 Internal Server Error',
      )
    })

    it('should handle validation timeout', async () => {
      const projectId = 'project-1'

      const mockValidationResult = {
        valid: false,
        errors: ['검증 시간이 초과되었습니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.comprehensiveValidation(projectId)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(validationService.validateEvidenceRegistration({})).rejects.toThrow(
        'Network error',
      )
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(validationService.validateMembers('project-1')).rejects.toThrow('Invalid JSON')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(validationService.comprehensiveValidation('project-1')).rejects.toThrow(
        'Request timeout',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle very large project IDs', async () => {
      const largeProjectId = 'project-with-very-long-id-that-exceeds-normal-length-limits'
      const validationPayload = {
        projectId: largeProjectId,
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
      }

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        success: true,
        data: {
          totalParticipationRate: 100,
          maxAllowedRate: 100,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
    })

    it('should handle special characters in project IDs', async () => {
      const specialProjectId = 'project-with-special-chars-@#$%'
      const validationPayload = {
        projectId: specialProjectId,
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
      }

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        success: true,
        data: {
          totalParticipationRate: 100,
          maxAllowedRate: 100,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
    })

    it('should handle empty employment IDs array', async () => {
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: [],
        assigneeId: 'employee-1',
      }

      const mockValidationResult = {
        valid: false,
        errors: ['고용 정보가 없습니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
    })

    it('should handle very large employment IDs array', async () => {
      const largeEmploymentIds = Array.from({ length: 1000 }, (_, i) => `employment-${i}`)
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: largeEmploymentIds,
        assigneeId: 'employee-1',
      }

      const mockValidationResult = {
        valid: false,
        errors: ['고용 정보가 너무 많습니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
    })

    it('should handle invalid date formats', async () => {
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
        dueDate: 'invalid-date-format',
      }

      const mockValidationResult = {
        valid: false,
        errors: ['날짜 형식이 올바르지 않습니다.'],
        warnings: [],
        success: false,
        data: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(false)
    })

    it('should handle future dates', async () => {
      const futureDate = '2030-12-31'
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
        dueDate: futureDate,
      }

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: ['마감일이 미래 날짜입니다.'],
        success: true,
        data: {
          totalParticipationRate: 100,
          maxAllowedRate: 100,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
    })

    it('should handle past dates', async () => {
      const pastDate = '2020-12-31'
      const validationPayload = {
        projectId: 'project-1',
        employmentIds: ['employment-1'],
        assigneeId: 'employee-1',
        dueDate: pastDate,
      }

      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: ['마감일이 과거 날짜입니다.'],
        success: true,
        data: {
          totalParticipationRate: 100,
          maxAllowedRate: 100,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidationResult),
      })

      const result = await validationService.validateEvidenceRegistration(validationPayload)

      expect(result).toEqual(mockValidationResult)
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
    })
  })
})
