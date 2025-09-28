import { loadPayslips, loadSalaryHistory } from '$lib/stores/salary/salary-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch as unknown as typeof fetch

describe('Salary Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadPayslips', () => {
    it('should load payslips successfully', async () => {
      const mockPayslips = [
        {
          id: '1',
          employeeId: 'emp1',
          period: '2024-01',
          payDate: '2024-01-31',
          baseSalary: 3000000,
          totalPayments: 3500000,
          totalDeductions: 500000,
          netSalary: 3000000,
          payments: {},
          deductions: {},
          status: 'paid',
          isGenerated: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          employeeName: '김철수',
          employeeIdNumber: 'EMP001',
          department: '개발팀',
          position: '개발자',
          hireDate: '2023-01-01',
        },
      ]

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockPayslips,
          }),
      })

      await loadPayslips()

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/payslips')
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'API Error',
          }),
      })

      await loadPayslips()

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/payslips')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await loadPayslips()

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/payslips')
    })
  })

  describe('loadSalaryHistory', () => {
    it('should load salary history for all employees', async () => {
      const mockHistory = [
        {
          id: '1',
          employeeId: 'emp1',
          period: '2024-01',
          baseSalary: 3000000,
          totalAllowances: 500000,
          totalDeductions: 500000,
          grossSalary: 3500000,
          netSalary: 3000000,
          changeType: 'initial',
          changeReason: 'Initial salary',
          effectiveDate: '2024-01-01',
          createdAt: '2024-01-01',
          createdBy: 'admin',
        },
      ]

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockHistory,
          }),
      })

      await loadSalaryHistory()

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/history')
    })

    it('should load salary history for specific employee', async () => {
      const mockHistory = [
        {
          id: '1',
          employeeId: 'emp1',
          period: '2024-01',
          baseSalary: 3000000,
          totalAllowances: 500000,
          totalDeductions: 500000,
          grossSalary: 3500000,
          netSalary: 3000000,
          changeType: 'initial',
          changeReason: 'Initial salary',
          effectiveDate: '2024-01-01',
          createdAt: '2024-01-01',
          createdBy: 'admin',
        },
      ]

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockHistory,
          }),
      })

      await loadSalaryHistory('emp1')

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/history/emp1')
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'API Error',
          }),
      })

      await loadSalaryHistory()

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/history')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await loadSalaryHistory()

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/salary/history')
    })
  })
})
