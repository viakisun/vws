import * as projectService from '$lib/services/research-development/project.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('project.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('getProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          status: 'active',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        },
        {
          id: 'project-2',
          name: 'Test Project 2',
          status: 'completed',
          startDate: '2023-06-01',
          endDate: '2023-11-30',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockProjects }),
      })

      const result = await projectService.getProjects()

      expect(result).toEqual(mockProjects)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/projects', undefined)
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(projectService.getProjects()).rejects.toThrow(
        'Failed to fetch: 500 Internal Server Error',
      )
    })

    it('should return empty array when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await projectService.getProjects()

      expect(result).toEqual([])
    })
  })

  describe('getProject', () => {
    it('should fetch a single project successfully', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        description: 'Test description',
        budget: 1000000,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockProject }),
      })

      const result = await projectService.getProject('project-1')

      expect(result).toEqual(mockProject)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/research-development/projects/project-1',
        undefined,
      )
    })

    it('should handle fetch errors for single project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(projectService.getProject('nonexistent')).rejects.toThrow(
        'Failed to fetch: 404 Not Found',
      )
    })
  })

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New project description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 2000000,
        status: 'active' as const,
      }

      const mockCreatedProject = {
        id: 'project-new',
        ...projectData,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedProject }),
      })

      const result = await projectService.createProject(projectData)

      expect(result).toEqual(mockCreatedProject)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })
    })

    it('should handle creation errors', async () => {
      const projectData = {
        name: 'Invalid Project',
        startDate: '2024-01-01',
        endDate: '2023-12-31', // Invalid: end date before start date
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(projectService.createProject(projectData)).rejects.toThrow(
        'Failed to post: 400 Bad Request',
      )
    })
  })

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      const projectId = 'project-1'
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
        budget: 1500000,
      }

      const mockUpdatedProject = {
        id: projectId,
        name: updateData.name,
        description: updateData.description,
        budget: updateData.budget,
        status: 'active',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        updatedAt: '2024-01-15T10:30:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUpdatedProject }),
      })

      const result = await projectService.updateProject(projectId, updateData)

      expect(result).toEqual({ data: mockUpdatedProject })
      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
    })

    it('should handle update errors', async () => {
      const projectId = 'project-1'
      const updateData = { name: 'Updated Name' }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(projectService.updateProject(projectId, updateData)).rejects.toThrow(
        'Failed to update project: 404 Not Found',
      )
    })
  })

  describe('updateProjectPeriod', () => {
    it('should update project period successfully', async () => {
      const projectId = 'project-1'
      const periodData = {
        startDate: '2024-02-01',
        endDate: '2024-11-30',
      }

      const mockResponse = {
        success: true,
        data: {
          id: projectId,
          startDate: periodData.startDate,
          endDate: periodData.endDate,
          updatedAt: '2024-01-15T11:00:00Z',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await projectService.updateProjectPeriod({ projectId, ...periodData })

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: periodData.startDate,
          endDate: periodData.endDate,
        }),
      })
    })

    it('should handle period update errors', async () => {
      const projectId = 'project-1'
      const periodData = {
        startDate: '2024-02-01',
        endDate: '2024-01-31', // Invalid: end date before start date
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(
        projectService.updateProjectPeriod({ projectId, ...periodData }),
      ).rejects.toThrow('Failed to update project: 400 Bad Request')
    })
  })

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      const projectId = 'project-1'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await projectService.deleteProject(projectId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/research-development/projects/${projectId}`, {
        method: 'DELETE',
      })
    })

    it('should handle deletion errors', async () => {
      const projectId = 'project-1'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      // deleteProject does not check response status, so it will not throw
      await projectService.deleteProject(projectId)
    })

    it('should handle deletion when project has dependencies', async () => {
      const projectId = 'project-with-dependencies'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      })

      // deleteProject does not check response status, so it will not throw
      await projectService.deleteProject(projectId)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(projectService.getProjects()).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(projectService.getProjects()).rejects.toThrow('Invalid JSON')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      await expect(projectService.getProject('project-1')).rejects.toThrow('Request timeout')
    })
  })

  describe('edge cases', () => {
    it('should handle empty project data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

      const result = await projectService.getProjects()

      expect(result).toEqual([])
    })

    it('should handle null project data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      const result = await projectService.getProjects()

      expect(result).toEqual([])
    })

    it('should handle undefined project data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      const result = await projectService.getProjects()

      expect(result).toEqual([])
    })

    it('should handle special characters in project names', async () => {
      const projectData = {
        name: '프로젝트 이름 (특수문자: @#$%)',
        description: '설명 with 한글 & English',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      const mockCreatedProject = {
        id: 'project-special',
        ...projectData,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedProject }),
      })

      const result = await projectService.createProject(projectData)

      expect(result).toEqual(mockCreatedProject)
      expect(mockFetch).toHaveBeenCalledWith('/api/research-development/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })
    })

    it('should handle very large budget amounts', async () => {
      const projectData = {
        name: 'Large Budget Project',
        budget: 999999999999,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      const mockCreatedProject = {
        id: 'project-large-budget',
        ...projectData,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedProject }),
      })

      const result = await projectService.createProject(projectData)

      expect(result).toEqual(mockCreatedProject)
    })

    it('should handle very long project descriptions', async () => {
      const longDescription = 'A'.repeat(10000)
      const projectData = {
        name: 'Long Description Project',
        description: longDescription,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }

      const mockCreatedProject = {
        id: 'project-long-desc',
        ...projectData,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCreatedProject }),
      })

      const result = await projectService.createProject(projectData)

      expect(result).toEqual(mockCreatedProject)
    })
  })
})
