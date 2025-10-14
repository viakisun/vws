import * as memberService from '$lib/services/research-development/member.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('member.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('getProjectMembers', () => {
    it('should fetch project members successfully', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          projectId: 'project-1',
          personnelId: 'personnel-1',
          role: '연구책임자',
          monthlyRate: 5000000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          participationRate: 100,
          isSalaryBased: true,
          contractualSalary: 60000000,
          weeklyHours: 40,
          employeeName: '홍길동',
          employeeEmail: 'hong@example.com',
          employeePosition: '선임연구원',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'member-2',
          projectId: 'project-1',
          personnelId: 'personnel-2',
          role: '연구원',
          monthlyRate: 3000000,
          startDate: '2024-02-01',
          endDate: '2024-11-30',
          participationRate: 80,
          isSalaryBased: false,
          contractualSalary: null,
          weeklyHours: 32,
          employeeName: '김철수',
          employeeEmail: 'kim@example.com',
          employeePosition: '연구원',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockMembers }),
      })

      const result = await memberService.getProjectMembers('project-1')

      expect(result).toEqual(mockMembers)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/research-development/project-members?projectId=project-1',
        undefined,
      )
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(memberService.getProjectMembers('project-1')).rejects.toThrow(
        'Failed to fetch: 500 Internal Server Error',
      )
    })

    it('should return empty array when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await memberService.getProjectMembers('project-1')

      expect(result).toEqual([])
    })
  })

  describe('addMember', () => {
    it('should add a member successfully', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구책임자',
        monthlyRate: 5000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: true,
        contractualSalary: 60000000,
        weeklyHours: 40,
      }

      const mockAddedMember = {
        id: 'member-new',
        ...memberPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '선임연구원',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAddedMember }),
      })

      const result = await memberService.addMember(memberPayload)

      expect(result).toEqual(mockAddedMember)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/project-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberPayload),
      })
    })

    it('should handle addition errors', async () => {
      const memberPayload = {
        projectId: 'nonexistent-project',
        personnelId: 'personnel-1',
        role: '연구원',
        monthlyRate: 3000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(memberService.addMember(memberPayload)).rejects.toThrow(
        'Failed to post: 400 Bad Request',
      )
    })

    it('should handle duplicate member addition', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1', // Already exists
        role: '연구원',
        monthlyRate: 3000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      await expect(memberService.addMember(memberPayload)).rejects.toThrow(
        'Failed to post: 409 Conflict',
      )
    })

    it('should handle invalid participation rate', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구원',
        monthlyRate: 3000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 150, // Invalid: over 100%
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(memberService.addMember(memberPayload)).rejects.toThrow(
        'Failed to post: 400 Bad Request',
      )
    })

    it('should handle invalid date range', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구원',
        monthlyRate: 3000000,
        startDate: '2024-12-31', // Invalid: start date after end date
        endDate: '2024-01-01',
        participationRate: 100,
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: null,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(memberService.addMember(memberPayload)).rejects.toThrow(
        'Failed to post: 400 Bad Request',
      )
    })
  })

  describe('updateMember', () => {
    it('should update a member successfully', async () => {
      const memberUpdatePayload = {
        id: 'member-1',
        role: '수석연구원',
        monthlyRate: 6000000,
        participationRate: 90,
        contractualSalary: 70000000,
      }

      const mockUpdatedMember = {
        id: 'member-1',
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: memberUpdatePayload.role,
        monthlyRate: memberUpdatePayload.monthlyRate,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: memberUpdatePayload.participationRate,
        isSalaryBased: true,
        contractualSalary: memberUpdatePayload.contractualSalary,
        weeklyHours: 40,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '수석연구원',
        updatedAt: '2024-01-15T10:30:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUpdatedMember }),
      })

      const result = await memberService.updateMember(memberUpdatePayload)

      expect(result).toEqual(mockUpdatedMember)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/project-members/member-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: memberUpdatePayload.role,
          monthlyRate: memberUpdatePayload.monthlyRate,
          participationRate: memberUpdatePayload.participationRate,
          contractualSalary: memberUpdatePayload.contractualSalary,
        }),
      })
    })

    it('should handle update errors', async () => {
      const memberUpdatePayload = {
        id: 'nonexistent-member',
        role: '연구원',
        monthlyRate: 3000000,
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(memberService.updateMember(memberUpdatePayload)).rejects.toThrow(
        'Failed to put: 404 Not Found',
      )
    })

    it('should handle invalid update data', async () => {
      const memberUpdatePayload = {
        id: 'member-1',
        monthlyRate: -1000000, // Negative amount
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(memberService.updateMember(memberUpdatePayload)).rejects.toThrow(
        'Failed to put: 400 Bad Request',
      )
    })
  })

  describe('deleteMember', () => {
    it('should delete a member successfully', async () => {
      const memberId = 'member-1'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await memberService.deleteMember(memberId)

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/research-development/project-members/${memberId}`,
        {
          method: 'DELETE',
        },
      )
    })

    it('should handle deletion errors', async () => {
      const memberId = 'member-1'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(memberService.deleteMember(memberId)).rejects.toThrow(
        'Failed to delete: 404 Not Found',
      )
    })

    it('should handle deletion when member has evidence items', async () => {
      const memberId = 'member-with-evidence'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      await expect(memberService.deleteMember(memberId)).rejects.toThrow(
        'Failed to delete: 409 Conflict',
      )
    })
  })

  describe('getAvailableEmployees', () => {
    it('should fetch available employees successfully', async () => {
      const mockEmployees = [
        {
          id: 'personnel-1',
          name: '홍길동',
          email: 'hong@example.com',
          position: '선임연구원',
          department: 'R&D팀',
          isAvailable: true,
          currentProjects: 0,
          maxProjects: 3,
        },
        {
          id: 'personnel-2',
          name: '김철수',
          email: 'kim@example.com',
          position: '연구원',
          department: 'R&D팀',
          isAvailable: true,
          currentProjects: 1,
          maxProjects: 2,
        },
        {
          id: 'personnel-3',
          name: '이영희',
          email: 'lee@example.com',
          position: '수석연구원',
          department: 'R&D팀',
          isAvailable: false,
          currentProjects: 3,
          maxProjects: 3,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockEmployees }),
      })

      const result = await memberService.getAvailableEmployees('project-1')

      expect(result).toEqual(mockEmployees)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/research-development/employees?projectId=project-1',
        undefined,
      )
    })

    it('should handle fetch errors for available employees', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(memberService.getAvailableEmployees('project-1')).rejects.toThrow(
        'Failed to fetch: 500 Internal Server Error',
      )
    })

    it('should return empty array when no employees available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      const result = await memberService.getAvailableEmployees('project-1')

      expect(result).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(memberService.getProjectMembers('project-1')).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(memberService.getProjectMembers('project-1')).rejects.toThrow('Invalid JSON')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(
        memberService.addMember({
          projectId: 'project-1',
          personnelId: 'personnel-1',
          role: '연구원',
          monthlyRate: 3000000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          participationRate: 100,
          isSalaryBased: false,
          contractualSalary: null,
          weeklyHours: null,
        }),
      ).rejects.toThrow('Request timeout')
    })
  })

  describe('edge cases', () => {
    it('should handle very large salary amounts', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구책임자',
        monthlyRate: 999999999999,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: true,
        contractualSalary: 999999999999,
        weeklyHours: 40,
      }

      const mockAddedMember = {
        id: 'member-large-salary',
        ...memberPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '연구책임자',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAddedMember }),
      })

      const result = await memberService.addMember(memberPayload)

      expect(result).toEqual(mockAddedMember)
    })

    it('should handle zero participation rate', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구원',
        monthlyRate: 0,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 0,
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: null,
      }

      const mockAddedMember = {
        id: 'member-zero-rate',
        ...memberPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '연구원',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAddedMember }),
      })

      const result = await memberService.addMember(memberPayload)

      expect(result).toEqual(mockAddedMember)
    })

    it('should handle decimal salary amounts', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구원',
        monthlyRate: 1234567.89,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 85.5,
        isSalaryBased: true,
        contractualSalary: 12345678.9,
        weeklyHours: 34.5,
      }

      const mockAddedMember = {
        id: 'member-decimal',
        ...memberPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '연구원',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAddedMember }),
      })

      const result = await memberService.addMember(memberPayload)

      expect(result).toEqual(mockAddedMember)
    })

    it('should handle special characters in role names', async () => {
      const memberPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-1',
        role: '연구책임자 (특수문자: @#$%)',
        monthlyRate: 5000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: true,
        contractualSalary: 60000000,
        weeklyHours: 40,
      }

      const mockAddedMember = {
        id: 'member-special-role',
        ...memberPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '연구책임자',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAddedMember }),
      })

      const result = await memberService.addMember(memberPayload)

      expect(result).toEqual(mockAddedMember)
    })

    it('should handle very long project IDs', async () => {
      const longProjectId = 'project-with-very-long-id-that-exceeds-normal-length-limits'
      const memberPayload = {
        projectId: longProjectId,
        personnelId: 'personnel-1',
        role: '연구원',
        monthlyRate: 3000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: null,
      }

      const mockAddedMember = {
        id: 'member-long-project',
        ...memberPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '연구원',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockAddedMember }),
      })

      const result = await memberService.addMember(memberPayload)

      expect(result).toEqual(mockAddedMember)
    })

    it('should handle all participation rate values from 0 to 100', async () => {
      const participationRates = [0, 25, 50, 75, 100]

      for (const rate of participationRates) {
        const memberPayload = {
          projectId: 'project-1',
          personnelId: `personnel-${rate}`,
          role: '연구원',
          monthlyRate: 3000000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          participationRate: rate,
          isSalaryBased: false,
          contractualSalary: null,
          weeklyHours: null,
        }

        const mockAddedMember = {
          id: `member-rate-${rate}`,
          ...memberPayload,
          employeeName: '홍길동',
          employeeEmail: 'hong@example.com',
          employeePosition: '연구원',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockAddedMember }),
        })

        const result = await memberService.addMember(memberPayload)

        expect(result).toEqual(mockAddedMember)
      }
    })

    it('should handle both salary-based and non-salary-based members', async () => {
      const salaryBasedPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-salary',
        role: '연구책임자',
        monthlyRate: 5000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 100,
        isSalaryBased: true,
        contractualSalary: 60000000,
        weeklyHours: 40,
      }

      const nonSalaryBasedPayload = {
        projectId: 'project-1',
        personnelId: 'personnel-non-salary',
        role: '연구원',
        monthlyRate: 3000000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        participationRate: 80,
        isSalaryBased: false,
        contractualSalary: null,
        weeklyHours: 32,
      }

      const mockSalaryBasedMember = {
        id: 'member-salary-based',
        ...salaryBasedPayload,
        employeeName: '홍길동',
        employeeEmail: 'hong@example.com',
        employeePosition: '연구책임자',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      const mockNonSalaryBasedMember = {
        id: 'member-non-salary-based',
        ...nonSalaryBasedPayload,
        employeeName: '김철수',
        employeeEmail: 'kim@example.com',
        employeePosition: '연구원',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockSalaryBasedMember }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockNonSalaryBasedMember }),
        })

      const result1 = await memberService.addMember(salaryBasedPayload)
      const result2 = await memberService.addMember(nonSalaryBasedPayload)

      expect(result1).toEqual(mockSalaryBasedMember)
      expect(result2).toEqual(mockNonSalaryBasedMember)
    })
  })
})
