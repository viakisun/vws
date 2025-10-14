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
          name: '테스트 프로젝트 1',
          description: '첫 번째 테스트 프로젝트',
          status: 'active',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
        {
          id: 'project-2',
          name: '테스트 프로젝트 2',
          description: '두 번째 테스트 프로젝트',
          status: 'completed',
          startDate: '2023-02-01',
          endDate: '2023-11-30',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockProjects,
        rowCount: 2,
      })

      const result = await projectService.getProjects()

      expect(result).toEqual(mockProjects)
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.getProjects()).rejects.toThrow('Database connection failed')
    })

    it('should return empty array when no projects found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await projectService.getProjects()

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })
  })

  describe('getProjectById', () => {
    it('should fetch project by ID successfully', async () => {
      const mockProject = {
        id: 'project-1',
        name: '테스트 프로젝트',
        description: '테스트 프로젝트 설명',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.getProjectById('project-1')

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

      const result = await projectService.getProjectById('non-existent')

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Database query failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.getProjectById('project-1')).rejects.toThrow(
        'Database query failed',
      )
    })
  })

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: '새로운 프로젝트',
        description: '새로운 프로젝트 설명',
        status: 'active',
        startDate: '2023-06-01',
        endDate: '2023-12-31',
      }

      const mockCreatedProject = {
        id: 'project-new',
        ...projectData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCreatedProject],
        rowCount: 1,
      })

      const result = await projectService.createProject(projectData)

      expect(result).toEqual(mockCreatedProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          projectData.name,
          projectData.description,
          projectData.status,
          projectData.startDate,
          projectData.endDate,
        ]),
      )
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        description: '',
        status: 'invalid',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
      }

      const error = new Error('Validation failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.createProject(invalidData)).rejects.toThrow('Validation failed')
    })

    it('should handle duplicate project name errors', async () => {
      const projectData = {
        name: '중복 프로젝트명',
        description: '중복 프로젝트 설명',
        status: 'active',
        startDate: '2023-06-01',
        endDate: '2023-12-31',
      }

      const error = new Error('Duplicate project name')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.createProject(projectData)).rejects.toThrow(
        'Duplicate project name',
      )
    })
  })

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updateData = {
        name: '업데이트된 프로젝트',
        description: '업데이트된 프로젝트 설명',
        status: 'completed',
        startDate: '2023-01-01',
        endDate: '2023-11-30',
      }

      const mockUpdatedProject = {
        id: 'project-1',
        ...updateData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockUpdatedProject],
        rowCount: 1,
      })

      const result = await projectService.updateProject('project-1', updateData)

      expect(result).toEqual(mockUpdatedProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([
          updateData.name,
          updateData.description,
          updateData.status,
          updateData.startDate,
          updateData.endDate,
          'project-1',
        ]),
      )
    })

    it('should return null when project not found', async () => {
      const updateData = {
        name: '업데이트된 프로젝트',
        description: '업데이트된 프로젝트 설명',
        status: 'completed',
        startDate: '2023-01-01',
        endDate: '2023-11-30',
      }

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await projectService.updateProject('non-existent', updateData)

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([
          updateData.name,
          updateData.description,
          updateData.status,
          updateData.startDate,
          updateData.endDate,
          'non-existent',
        ]),
      )
    })

    it('should handle database errors', async () => {
      const updateData = {
        name: '업데이트된 프로젝트',
        description: '업데이트된 프로젝트 설명',
        status: 'completed',
        startDate: '2023-01-01',
        endDate: '2023-11-30',
      }

      const error = new Error('Update failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.updateProject('project-1', updateData)).rejects.toThrow(
        'Update failed',
      )
    })
  })

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      })

      const result = await projectService.deleteProject('project-1')

      expect(result).toBe(true)
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

      const result = await projectService.deleteProject('non-existent')

      expect(result).toBe(false)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Delete failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.deleteProject('project-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('getProjectsByStatus', () => {
    it('should fetch projects by status successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: '활성 프로젝트 1',
          description: '첫 번째 활성 프로젝트',
          status: 'active',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
        {
          id: 'project-3',
          name: '활성 프로젝트 2',
          description: '두 번째 활성 프로젝트',
          status: 'active',
          startDate: '2023-03-01',
          endDate: '2023-12-31',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockProjects,
        rowCount: 2,
      })

      const result = await projectService.getProjectsByStatus('active')

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

      const result = await projectService.getProjectsByStatus('cancelled')

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['cancelled']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Status query failed')
      mockQuery.mockRejectedValue(error)

      await expect(projectService.getProjectsByStatus('active')).rejects.toThrow(
        'Status query failed',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in project data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()프로젝트',
        description: '특수@#$%^&*()설명',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      }

      const mockProject = {
        id: 'project-special',
        ...specialData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.createProject(specialData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          specialData.name,
          specialData.description,
          specialData.status,
          specialData.startDate,
          specialData.endDate,
        ]),
      )
    })

    it('should handle Unicode characters in project data', async () => {
      const unicodeData = {
        name: '한글프로젝트한글',
        description: '한글설명한글',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      }

      const mockProject = {
        id: 'project-unicode',
        ...unicodeData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.createProject(unicodeData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          unicodeData.name,
          unicodeData.description,
          unicodeData.status,
          unicodeData.startDate,
          unicodeData.endDate,
        ]),
      )
    })

    it('should handle very long project descriptions', async () => {
      const longDescriptionData = {
        name: '긴 설명 프로젝트',
        description: 'A'.repeat(10000),
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      }

      const mockProject = {
        id: 'project-long',
        ...longDescriptionData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.createProject(longDescriptionData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          longDescriptionData.name,
          longDescriptionData.description,
          longDescriptionData.status,
          longDescriptionData.startDate,
          longDescriptionData.endDate,
        ]),
      )
    })

    it('should handle concurrent operations', async () => {
      const projectData = {
        name: '동시 생성 프로젝트',
        description: '동시 생성 프로젝트 설명',
        status: 'active',
        startDate: '2023-06-01',
        endDate: '2023-12-31',
      }

      const mockProject = {
        id: 'project-concurrent',
        ...projectData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const promises = Array.from({ length: 5 }, () => projectService.createProject(projectData))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toEqual(mockProject)
      })
      expect(mockQuery).toHaveBeenCalledTimes(5)
    })

    it('should handle date edge cases', async () => {
      const dateEdgeCaseData = {
        name: '날짜 엣지케이스 프로젝트',
        description: '날짜 엣지케이스 설명',
        status: 'active',
        startDate: '1900-01-01',
        endDate: '2099-12-31',
      }

      const mockProject = {
        id: 'project-date-edge',
        ...dateEdgeCaseData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockProject],
        rowCount: 1,
      })

      const result = await projectService.createProject(dateEdgeCaseData)

      expect(result).toEqual(mockProject)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          dateEdgeCaseData.name,
          dateEdgeCaseData.description,
          dateEdgeCaseData.status,
          dateEdgeCaseData.startDate,
          dateEdgeCaseData.endDate,
        ]),
      )
    })
  })
})
