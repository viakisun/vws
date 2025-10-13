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
import { EmployeeService } from '$lib/services/employee/employee-service'

describe('EmployeeService', () => {
  let employeeService: EmployeeService
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = vi.mocked(query)
    employeeService = new EmployeeService()
  })

  describe('getEmployees', () => {
    it('should fetch all employees successfully', async () => {
      const mockEmployees = [
        {
          id: 'employee-1',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          department: '개발팀',
          status: 'active',
        },
        {
          id: 'employee-2',
          name: '김철수',
          email: 'kim@example.com',
          position: '디자이너',
          department: '디자인팀',
          status: 'active',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockEmployees,
        rowCount: 2,
      })

      const result = await employeeService.getEmployees()

      expect(result).toEqual(mockEmployees)
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.getEmployees()).rejects.toThrow('Database connection failed')
    })

    it('should return empty array when no employees found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await employeeService.getEmployees()

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })
  })

  describe('getEmployeeById', () => {
    it('should fetch employee by ID successfully', async () => {
      const mockEmployee = {
        id: 'employee-1',
        name: '홍길동',
        email: 'hong@example.com',
        position: '개발자',
        department: '개발팀',
        status: 'active',
      }

      mockQuery.mockResolvedValue({
        rows: [mockEmployee],
        rowCount: 1,
      })

      const result = await employeeService.getEmployeeById('employee-1')

      expect(result).toEqual(mockEmployee)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['employee-1']),
      )
    })

    it('should return null when employee not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await employeeService.getEmployeeById('non-existent')

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Database query failed')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.getEmployeeById('employee-1')).rejects.toThrow(
        'Database query failed',
      )
    })
  })

  describe('createEmployee', () => {
    it('should create employee successfully', async () => {
      const employeeData = {
        name: '새로운 직원',
        email: 'new@example.com',
        position: '매니저',
        department: '기획팀',
        status: 'active',
      }

      const mockCreatedEmployee = {
        id: 'employee-new',
        ...employeeData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCreatedEmployee],
        rowCount: 1,
      })

      const result = await employeeService.createEmployee(employeeData)

      expect(result).toEqual(mockCreatedEmployee)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          employeeData.name,
          employeeData.email,
          employeeData.position,
          employeeData.department,
          employeeData.status,
        ]),
      )
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        position: '',
        department: '',
        status: 'invalid',
      }

      const error = new Error('Validation failed')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.createEmployee(invalidData)).rejects.toThrow('Validation failed')
    })

    it('should handle duplicate email errors', async () => {
      const employeeData = {
        name: '중복 이메일 직원',
        email: 'duplicate@example.com',
        position: '개발자',
        department: '개발팀',
        status: 'active',
      }

      const error = new Error('Duplicate email address')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.createEmployee(employeeData)).rejects.toThrow(
        'Duplicate email address',
      )
    })
  })

  describe('updateEmployee', () => {
    it('should update employee successfully', async () => {
      const updateData = {
        name: '업데이트된 직원',
        email: 'updated@example.com',
        position: '시니어 개발자',
        department: '개발팀',
        status: 'active',
      }

      const mockUpdatedEmployee = {
        id: 'employee-1',
        ...updateData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockUpdatedEmployee],
        rowCount: 1,
      })

      const result = await employeeService.updateEmployee('employee-1', updateData)

      expect(result).toEqual(mockUpdatedEmployee)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([
          updateData.name,
          updateData.email,
          updateData.position,
          updateData.department,
          updateData.status,
          'employee-1',
        ]),
      )
    })

    it('should return null when employee not found', async () => {
      const updateData = {
        name: '업데이트된 직원',
        email: 'updated@example.com',
        position: '시니어 개발자',
        department: '개발팀',
        status: 'active',
      }

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await employeeService.updateEmployee('non-existent', updateData)

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([
          updateData.name,
          updateData.email,
          updateData.position,
          updateData.department,
          updateData.status,
          'non-existent',
        ]),
      )
    })

    it('should handle database errors', async () => {
      const updateData = {
        name: '업데이트된 직원',
        email: 'updated@example.com',
        position: '시니어 개발자',
        department: '개발팀',
        status: 'active',
      }

      const error = new Error('Update failed')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.updateEmployee('employee-1', updateData)).rejects.toThrow(
        'Update failed',
      )
    })
  })

  describe('deleteEmployee', () => {
    it('should delete employee successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      })

      const result = await employeeService.deleteEmployee('employee-1')

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['employee-1']),
      )
    })

    it('should return false when employee not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await employeeService.deleteEmployee('non-existent')

      expect(result).toBe(false)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Delete failed')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.deleteEmployee('employee-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('getEmployeesByDepartment', () => {
    it('should fetch employees by department successfully', async () => {
      const mockEmployees = [
        {
          id: 'employee-1',
          name: '홍길동',
          email: 'hong@example.com',
          position: '개발자',
          department: '개발팀',
          status: 'active',
        },
        {
          id: 'employee-3',
          name: '이영희',
          email: 'lee@example.com',
          position: '시니어 개발자',
          department: '개발팀',
          status: 'active',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockEmployees,
        rowCount: 2,
      })

      const result = await employeeService.getEmployeesByDepartment('개발팀')

      expect(result).toEqual(mockEmployees)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['개발팀']),
      )
    })

    it('should return empty array when no employees in department', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await employeeService.getEmployeesByDepartment('빈 부서')

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['빈 부서']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Department query failed')
      mockQuery.mockRejectedValue(error)

      await expect(employeeService.getEmployeesByDepartment('개발팀')).rejects.toThrow(
        'Department query failed',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in employee data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()직원',
        email: 'special@example.com',
        position: '특수@#$%포지션',
        department: '특수@#$%부서',
        status: 'active',
      }

      const mockEmployee = {
        id: 'employee-special',
        ...specialData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockEmployee],
        rowCount: 1,
      })

      const result = await employeeService.createEmployee(specialData)

      expect(result).toEqual(mockEmployee)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          specialData.name,
          specialData.email,
          specialData.position,
          specialData.department,
          specialData.status,
        ]),
      )
    })

    it('should handle Unicode characters in employee data', async () => {
      const unicodeData = {
        name: '한글직원한글',
        email: '한글@example.com',
        position: '한글포지션',
        department: '한글부서',
        status: 'active',
      }

      const mockEmployee = {
        id: 'employee-unicode',
        ...unicodeData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockEmployee],
        rowCount: 1,
      })

      const result = await employeeService.createEmployee(unicodeData)

      expect(result).toEqual(mockEmployee)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          unicodeData.name,
          unicodeData.email,
          unicodeData.position,
          unicodeData.department,
          unicodeData.status,
        ]),
      )
    })

    it('should handle very long employee names', async () => {
      const longNameData = {
        name: 'A'.repeat(1000),
        email: 'long@example.com',
        position: '개발자',
        department: '개발팀',
        status: 'active',
      }

      const mockEmployee = {
        id: 'employee-long',
        ...longNameData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockEmployee],
        rowCount: 1,
      })

      const result = await employeeService.createEmployee(longNameData)

      expect(result).toEqual(mockEmployee)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          longNameData.name,
          longNameData.email,
          longNameData.position,
          longNameData.department,
          longNameData.status,
        ]),
      )
    })

    it('should handle concurrent operations', async () => {
      const employeeData = {
        name: '동시 생성 직원',
        email: 'concurrent@example.com',
        position: '개발자',
        department: '개발팀',
        status: 'active',
      }

      const mockEmployee = {
        id: 'employee-concurrent',
        ...employeeData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockEmployee],
        rowCount: 1,
      })

      const promises = Array.from({ length: 5 }, () => employeeService.createEmployee(employeeData))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toEqual(mockEmployee)
      })
      expect(mockQuery).toHaveBeenCalledTimes(5)
    })
  })
})