import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DBHelper } from '../../helpers/db-helper'

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
    DBHelper.reset()

    // Mock query를 DBHelper의 mock으로 설정
    const mockQueryFn = DBHelper.setupMockQuery()
    vi.mocked(query).mockImplementation(mockQueryFn)

    mockQuery = vi.mocked(query)
    companyService = new CompanyService()
  })

  describe('list', () => {
    it('should fetch all companies successfully', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          name: '테스트 회사 1',
          establishment_date: '2020-01-01',
          ceo_name: '홍길동',
          business_type: 'IT',
          address: '서울시 강남구',
          phone: '02-1234-5678',
          fax: '02-1234-5679',
          email: 'test1@company.com',
          website: 'https://test1.com',
          registration_number: '123-45-67890',
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2020-01-01T00:00:00Z',
        },
        {
          id: 'company-2',
          name: '테스트 회사 2',
          establishment_date: '2020-02-01',
          ceo_name: '김철수',
          business_type: 'Manufacturing',
          address: '서울시 서초구',
          phone: '02-9876-5432',
          fax: '02-9876-5433',
          email: 'test2@company.com',
          website: 'https://test2.com',
          registration_number: '987-65-43210',
          created_at: '2020-02-01T00:00:00Z',
          updated_at: '2020-02-01T00:00:00Z',
        },
      ]

      mockQuery.mockResolvedValue({
        rows: mockCompanies,
        rowCount: mockCompanies.length,
      })

      const result = await companyService.list()

      expect(result).toEqual(mockCompanies)
      expect(mockQuery).toHaveBeenCalled()
      expect(DBHelper.getLastQuery()).toContain('SELECT')
    })

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.list()).rejects.toThrow('Database connection failed')
    })

    it('should return empty array when no companies found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      const result = await companyService.list()

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalled()
      expect(DBHelper.getLastQuery()).toContain('SELECT')
    })
  })

  describe('getById', () => {
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

      const result = await companyService.getById('company-1')

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

      const result = await companyService.getById('non-existent')

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Database query failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.getById('company-1')).rejects.toThrow('Database query failed')
    })
  })

  describe('create', () => {
    it('should create company successfully', async () => {
      const companyData = {
        name: '새로운 회사',
        establishment_date: '2020-01-01',
        ceo_name: '홍길동',
        business_type: 'IT',
      }

      const mockCreatedCompany = {
        id: 'company-new',
        name: '새로운 회사',
        establishment_date: '2020-01-01',
        ceo_name: '홍길동',
        business_type: 'IT',
        address: null,
        phone: null,
        fax: null,
        email: null,
        website: null,
        registration_number: null,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValue({
        rows: [mockCreatedCompany],
        rowCount: 1,
      })

      const result = await companyService.create(companyData)

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

      await expect(companyService.create(invalidData)).rejects.toThrow('Validation failed')
    })

    it('should handle duplicate name errors', async () => {
      const companyData = {
        name: '중복 이름 회사',
        business_type: 'IT',
      }

      const error = new Error('Duplicate company name')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.create(companyData)).rejects.toThrow('Duplicate company name')
    })
  })

  describe('update', () => {
    it('should update company successfully', async () => {
      const updateData = {
        name: '업데이트된 회사',
        business_type: 'Manufacturing',
      }

      const mockUpdatedCompany = {
        id: 'company-1',
        name: '업데이트된 회사',
        establishment_date: '2020-01-01',
        ceo_name: '홍길동',
        business_type: 'Manufacturing',
        address: '서울시 강남구',
        phone: '02-1234-5678',
        fax: '02-1234-5679',
        email: 'test@company.com',
        website: 'https://test.com',
        registration_number: '123-45-67890',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValue({
        rows: [mockUpdatedCompany],
        rowCount: 1,
      })

      const result = await companyService.update('company-1', updateData)

      expect(result).toEqual(mockUpdatedCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([updateData.name, updateData.business_type, 'company-1']),
      )
    })

    it('should throw error when company not found', async () => {
      const updateData = {
        name: '업데이트된 회사',
        business_type: 'Manufacturing',
      }

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      await expect(companyService.update('non-existent', updateData)).rejects.toThrow(
        '회사를 찾을 수 없습니다.',
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

      await expect(companyService.update('company-1', updateData)).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete company successfully', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      })

      await companyService.delete('company-1')

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['company-1']),
      )
    })

    it('should handle delete when company not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      })

      await companyService.delete('non-existent')

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['non-existent']),
      )
    })

    it('should handle database errors', async () => {
      const error = new Error('Delete failed')
      mockQuery.mockRejectedValue(error)

      await expect(companyService.delete('company-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in company data', async () => {
      const specialData = {
        name: '특수문자@#$%^&*()회사',
        business_type: 'IT',
      }

      const mockCompany = {
        id: 'company-special',
        name: '특수문자@#$%^&*()회사',
        establishment_date: null,
        ceo_name: null,
        business_type: 'IT',
        address: null,
        phone: null,
        fax: null,
        email: null,
        website: null,
        registration_number: null,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.create(specialData)

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([specialData.name, specialData.business_type]),
      )
    })

    it('should handle Unicode characters in company data', async () => {
      const unicodeData = {
        name: '한글회사한글',
        business_type: 'IT',
      }

      const mockCompany = {
        id: 'company-unicode',
        name: '한글회사한글',
        establishment_date: null,
        ceo_name: null,
        business_type: 'IT',
        address: null,
        phone: null,
        fax: null,
        email: null,
        website: null,
        registration_number: null,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.create(unicodeData)

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([unicodeData.name, unicodeData.business_type]),
      )
    })

    it('should handle very long company names', async () => {
      const longNameData = {
        name: 'A'.repeat(1000),
        business_type: 'IT',
      }

      const mockCompany = {
        id: 'company-long',
        name: 'A'.repeat(1000),
        establishment_date: null,
        ceo_name: null,
        business_type: 'IT',
        address: null,
        phone: null,
        fax: null,
        email: null,
        website: null,
        registration_number: null,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const result = await companyService.create(longNameData)

      expect(result).toEqual(mockCompany)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([longNameData.name, longNameData.business_type]),
      )
    })

    it('should handle concurrent operations', async () => {
      const companyData = {
        name: '동시 생성 회사',
        business_type: 'IT',
      }

      const mockCompany = {
        id: 'company-concurrent',
        name: '동시 생성 회사',
        establishment_date: null,
        ceo_name: null,
        business_type: 'IT',
        address: null,
        phone: null,
        fax: null,
        email: null,
        website: null,
        registration_number: null,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      mockQuery.mockResolvedValue({
        rows: [mockCompany],
        rowCount: 1,
      })

      const promises = Array.from({ length: 5 }, () => companyService.create(companyData))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toEqual(mockCompany)
      })
      expect(mockQuery).toHaveBeenCalledTimes(5)
    })
  })
})
