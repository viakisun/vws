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
import { CompanyService } from '$lib/services/company/company-service'

describe('CompanyService', () => {
  let companyService: CompanyService
  let mockQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = vi.mocked(query)
    companyService = new CompanyService()
  })

  describe('getCompanies', () => {
    it('should fetch all companies successfully', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          name: '테스트 회사 1',
          code: 'TEST1',
          status: 'active',
        },
        {
          id: 'company-2',
          name: '테스트 회사 2',
          code: 'TEST2',
          status: 'active',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockCompanies,
        rowCount: 2,
      })

      const result = await companyService.getCompanies()

      expect(result).toEqual(mockCompanies)
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.getCompanies()).rejects.toThrow('Database connection failed')
    })

    it('should return empty array when no companies found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await companyService.getCompanies()

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
    })
  })

  describe('getCompanyById', () => {
    it('should fetch company by ID successfully', async () => {
      const mockCompany = {
        id: 'company-1',
        name: '테스트 회사',
        code: 'TEST',
        status: 'active',
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.getCompanyById('company-1')

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['company-1']),
      )
    })

    it('should return null when company not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await companyService.getCompanyById('non-existent')

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Database query failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.getCompanyById('company-1')).rejects.toThrow(
        'Database query failed',
      )
    })
  })

  describe('createCompany', () => {
    it('should create company successfully', async () => {
      const companyData = {
        name: '새로운 회사',
        code: 'NEW',
        status: 'active',
      }

      const mockCreatedCompany = {
        id: 'company-new',
        ...companyData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCreatedCompany],
        rowCount: 1,
      })

      const result = await companyService.createCompany(companyData)

      expect(result).toEqual(mockCreatedCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([companyData.name, companyData.code, companyData.status]),
      )
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        code: '',
        status: 'invalid',
      }

      const error = new Error('Validation failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.createCompany(invalidData)).rejects.toThrow('Validation failed')
    })

    it('should handle duplicate code errors', async () => {
      const companyData = {
        name: '중복 코드 회사',
        code: 'DUPLICATE',
        status: 'active',
      }

      const error = new Error('Duplicate company code')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.createCompany(companyData)).rejects.toThrow(
        'Duplicate company code',
      )
    })
  })

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const updateData = {
        name: '업데이트된 회사',
        code: 'UPDATED',
        status: 'active',
      }

      const mockUpdatedCompany = {
        id: 'company-1',
        ...updateData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockUpdatedCompany],
        rowCount: 1,
      })

      const result = await companyService.updateCompany('company-1', updateData)

      expect(result).toEqual(mockUpdatedCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([updateData.name, updateData.code, updateData.status, 'company-1']),
      )
    })

    it('should return null when company not found', async () => {
      const updateData = {
        name: '업데이트된 회사',
        code: 'UPDATED',
        status: 'active',
      }

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await companyService.updateCompany('non-existent', updateData)

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([
          updateData.name,
          updateData.code,
          updateData.status,
          'non-existent',
        ]),
      )
    })

    it('should handle database errors', async () => {
      const updateData = {
        name: '업데이트된 회사',
        code: 'UPDATED',
        status: 'active',
      }

      const error = new Error('Update failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.updateCompany('company-1', updateData)).rejects.toThrow(
        'Update failed',
      )
    })
  })

  describe('deleteCompany', () => {
    it('should delete company successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      })

      const result = await companyService.deleteCompany('company-1')

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['company-1']),
      )
    })

    it('should return false when company not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await companyService.deleteCompany('non-existent')

      expect(result).toBe(false)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Delete failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.deleteCompany('company-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in company data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()회사',
        code: 'SPECIAL@#$%',
        status: 'active',
      }

      const mockCompany = {
        id: 'company-special',
        ...specialData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.createCompany(specialData)

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([specialData.name, specialData.code, specialData.status]),
      )
    })

    it('should handle Unicode characters in company data', async () => {
      const unicodeData = {
        name: '한글회사한글',
        code: '한글코드',
        status: 'active',
      }

      const mockCompany = {
        id: 'company-unicode',
        ...unicodeData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.createCompany(unicodeData)

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([unicodeData.name, unicodeData.code, unicodeData.status]),
      )
    })

    it('should handle very long company names', async () => {
      const longNameData = {
        name: 'A'.repeat(1000),
        code: 'LONG',
        status: 'active',
      }

      const mockCompany = {
        id: 'company-long',
        ...longNameData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.createCompany(longNameData)

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([longNameData.name, longNameData.code, longNameData.status]),
      )
    })

    it('should handle concurrent operations', async () => {
      const companyData = {
        name: '동시 생성 회사',
        code: 'CONCURRENT',
        status: 'active',
      }

      const mockCompany = {
        id: 'company-concurrent',
        ...companyData,
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const promises = Array.from({ length: 5 }, () => companyService.createCompany(companyData))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toEqual(mockCompany)
      })
      expect(mockQuery).toHaveBeenCalledTimes(5)
    })
  })
})
