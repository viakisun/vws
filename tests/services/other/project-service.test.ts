import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock database connection
vi.mock('$lib/database/connection', () => ({
  query: vi.fn(),
}))

// Mock logger
vi.mock('$lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import { query } from '$lib/database/connection'
import { ProjectService } from '$lib/services/project/project-service'

describe('ProjectService', () => {
  let projectService: ProjectService
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = vi.mocked(query)
    projectService = new ProjectService()
  })

  describe('getProjects', () => {
    it('should fetch all projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          code: 'PROJ-001',
          title: '테스트 프로젝트 1',
          description: '첫 번째 테스트 프로젝트',
          status: 'active',
          start_date: '2023-01-01',
          end_date: '2023-12-31',
        },
        {
          id: 'project-2',
          code: 'PROJ-002',
          title: '테스트 프로젝트 2',
          description: '두 번째 테스트 프로젝트',
          status: 'completed',
          start_date: '2023-02-01',
          end_date: '2023-11-30',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockProjects,
        rowCount: 2,
      })

      const result = await projectService.list()

      expect(result).toEqual(mockProjects)
      expect(mockQuery).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.list()).rejects.toThrow('Database connection failed')
    })

    it('should return empty array when no projects found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await projectService.list()

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalled()
    })
  })

  describe('getProjectById', () => {
    it('should fetch project by ID successfully', async () => {
      const mockProject = {
        id: 'project-1',
        code: 'PROJ-001',
        title: '테스트 프로젝트',
        description: '테스트 프로젝트 설명',
        status: 'active',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.getById('project-1')

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['project-1']),
      )
    })

    it('should return null when project not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await projectService.getById('non-existent')

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Database query failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.getById('project-1')).rejects.toThrow('Database query failed')
    })
  })

  describe('create', () => {
    it('should create project successfully', async () => {
      const projectData = {
        code: 'PROJ-003',
        title: '새로운 프로젝트',
        description: '새로운 프로젝트 설명',
        status: 'active',
        start_date: '2023-06-01',
        end_date: '2023-12-31',
      }

      const mockCreatedProject = {
        id: 'project-new',
        ...projectData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCreatedProject],
        rowCount: 1,
      })

      const result = await projectService.create(projectData)

      expect(result).toEqual(mockCreatedProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          projectData.code,
          projectData.title,
          projectData.description,
          null, // sponsor
          null, // sponsor_type
          projectData.start_date,
          projectData.end_date,
          null, // manager_employee_id
          projectData.status,
          0, // budget_total
        ]),
      )
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        code: '',
        title: '',
        description: '',
        status: 'invalid',
        start_date: 'invalid-date',
        end_date: 'invalid-date',
      }

      const error = new Error('Validation failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.create(invalidData)).rejects.toThrow('Validation failed')
    })

    it('should handle duplicate project name errors', async () => {
      const projectData = {
        code: 'PROJ-004',
        title: '중복 프로젝트명',
        description: '중복 프로젝트 설명',
        status: 'active',
        start_date: '2023-06-01',
        end_date: '2023-12-31',
      }

      const error = new Error('Duplicate project name')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.create(projectData)).rejects.toThrow('Duplicate project name')
    })
  })

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updateData = {
        description: '업데이트된 프로젝트 설명',
        status: 'completed',
      }

      const mockUpdatedProject = {
        id: 'project-1',
        code: 'PROJ-001',
        title: '테스트 프로젝트',
        ...updateData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockUpdatedProject],
        rowCount: 1,
      })

      const result = await projectService.update('project-1', updateData)

      expect(result).toEqual(mockUpdatedProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['project-1', updateData.description, updateData.status]),
      )
    })

    it('should throw error when project not found', async () => {
      const updateData = {
        description: '업데이트된 프로젝트 설명',
        status: 'completed',
      }

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      await expect(projectService.update('non-existent', updateData)).rejects.toThrow(
        '프로젝트를 찾을 수 없습니다.',
      )
    })

    it('should handle database errors', async () => {
      const updateData = {
        description: '업데이트된 프로젝트 설명',
        status: 'completed',
      }

      const error = new Error('Update failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.update('project-1', updateData)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      })

      await projectService.delete('project-1')

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['project-1']),
      )
    })

    it('should return false when project not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      await projectService.delete('non-existent')

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Delete failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.delete('project-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('getProjectsByStatus', () => {
    it('should fetch projects by status successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          code: 'PROJ-001',
          title: '활성 프로젝트 1',
          description: '첫 번째 활성 프로젝트',
          status: 'active',
          start_date: '2023-01-01',
          end_date: '2023-12-31',
        },
        {
          id: 'project-3',
          code: 'PROJ-003',
          title: '활성 프로젝트 2',
          description: '두 번째 활성 프로젝트',
          status: 'active',
          start_date: '2023-03-01',
          end_date: '2023-12-31',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockProjects,
        rowCount: 2,
      })

      const result = await projectService.list({ status: 'active' })

      expect(result).toEqual(mockProjects)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['active']),
      )
    })

    it('should return empty array when no projects with status found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await projectService.list({ status: 'cancelled' })

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['cancelled']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Status query failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.list({ status: 'active' })).rejects.toThrow('Status query failed')
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in project data', async () => {
      const specialData = {
        code: 'PROJ-SPECIAL',
        title: '특수문자@#$%^&*()프로젝트',
        description: '특수@#$%^&*()설명',
        status: 'active',
      }

      const mockProject = {
        id: 'project-special',
        ...specialData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.create(specialData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          specialData.code,
          specialData.title,
          specialData.description,
          null, // sponsor
          null, // sponsor_type
          null, // start_date
          null, // end_date
          null, // manager_employee_id
          specialData.status,
          0, // budget_total
        ]),
      )
    })

    it('should handle Unicode characters in project data', async () => {
      const unicodeData = {
        code: 'PROJ-한글',
        title: '한글프로젝트한글',
        description: '한글설명한글',
        status: 'active',
      }

      const mockProject = {
        id: 'project-unicode',
        ...unicodeData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.create(unicodeData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          unicodeData.code,
          unicodeData.title,
          unicodeData.description,
          null, // sponsor
          null, // sponsor_type
          null, // start_date
          null, // end_date
          null, // manager_employee_id
          unicodeData.status,
          0, // budget_total
        ]),
      )
    })

    it('should handle very long project descriptions', async () => {
      const longDescriptionData = {
        code: 'PROJ-LONG',
        title: '긴 설명 프로젝트',
        description: 'A'.repeat(10000),
        status: 'active',
      }

      const mockProject = {
        id: 'project-long',
        ...longDescriptionData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.create(longDescriptionData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          longDescriptionData.code,
          longDescriptionData.title,
          longDescriptionData.description,
          null, // sponsor
          null, // sponsor_type
          null, // start_date
          null, // end_date
          null, // manager_employee_id
          longDescriptionData.status,
          0, // budget_total
        ]),
      )
    })

    it('should handle concurrent operations', async () => {
      const projectData = {
        code: 'PROJ-CONCURRENT',
        title: '동시 생성 프로젝트',
        description: '동시 생성 프로젝트 설명',
        status: 'active',
      }

      const mockProject = {
        id: 'project-concurrent',
        ...projectData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const promises = Array.from({ length: 5 }, () => projectService.create(projectData))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toEqual(mockProject)
      })
      expect(mockQuery).toHaveBeenCalledTimes(5)
    })

    it('should handle date edge cases', async () => {
      const dateEdgeCaseData = {
        code: 'PROJ-DATE-EDGE',
        title: '날짜 엣지케이스 프로젝트',
        description: '날짜 엣지케이스 설명',
        status: 'active',
        start_date: '1900-01-01',
        end_date: '2099-12-31',
      }

      const mockProject = {
        id: 'project-date-edge',
        ...dateEdgeCaseData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.create(dateEdgeCaseData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          dateEdgeCaseData.code,
          dateEdgeCaseData.title,
          dateEdgeCaseData.description,
          null, // sponsor
          null, // sponsor_type
          dateEdgeCaseData.start_date,
          dateEdgeCaseData.end_date,
          null, // manager_employee_id
          dateEdgeCaseData.status,
          0, // budget_total
        ]),
      )
    })
  })
})
