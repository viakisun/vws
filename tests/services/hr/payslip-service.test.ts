import {
  createPayslip,
  deletePayslip,
  downloadPayslip,
  fetchEmployeePayslips,
  fetchPayslips,
  fetchSalaryHistory,
  updatePayslip,
  uploadPayslipTemplate,
} from '$lib/services/salary/payslip.service'
import type { Payslip, SalaryHistory } from '$lib/types/salary'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Payslip Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchPayslips', () => {
    it('모든 급여명세서를 성공적으로 조회해야 함', async () => {
      const mockPayslips: Payslip[] = [
        {
          id: 'payslip-1',
          employeeId: 'employee-1',
          employeeName: '홍길동',
          period: '2025-01',
          basicSalary: 3000000,
          allowances: 500000,
          deductions: 200000,
          netSalary: 3300000,
          status: 'confirmed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
        {
          id: 'payslip-2',
          employeeId: 'employee-2',
          employeeName: '김철수',
          period: '2025-01',
          basicSalary: 2500000,
          allowances: 300000,
          deductions: 150000,
          netSalary: 2650000,
          status: 'draft',
          createdAt: '2025-01-15T11:00:00Z',
          updatedAt: '2025-01-15T11:00:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockPayslips,
          }),
      } as Response)

      const result = await fetchPayslips()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayslips)
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips')
    })

    it('API 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchPayslips()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('API 응답 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Database connection failed',
          }),
      } as Response)

      const result = await fetchPayslips()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('빈 급여명세서 목록을 올바르게 처리해야 함', async () => {
      const mockPayslips: Payslip[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockPayslips,
          }),
      } as Response)

      const result = await fetchPayslips()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(result.data).toHaveLength(0)
    })
  })

  describe('fetchEmployeePayslips', () => {
    it('특정 직원의 급여명세서를 성공적으로 조회해야 함', async () => {
      const mockPayslips: Payslip[] = [
        {
          id: 'payslip-1',
          employeeId: 'employee-1',
          employeeName: '홍길동',
          period: '2025-01',
          basicSalary: 3000000,
          allowances: 500000,
          deductions: 200000,
          netSalary: 3300000,
          status: 'confirmed',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-15T10:00:00Z',
        },
        {
          id: 'payslip-2',
          employeeId: 'employee-1',
          employeeName: '홍길동',
          period: '2024-12',
          basicSalary: 3000000,
          allowances: 450000,
          deductions: 180000,
          netSalary: 3270000,
          status: 'confirmed',
          createdAt: '2024-12-15T10:00:00Z',
          updatedAt: '2024-12-15T10:00:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockPayslips,
          }),
      } as Response)

      const result = await fetchEmployeePayslips('employee-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayslips)
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips/employee/employee-1')
    })

    it('존재하지 않는 직원의 급여명세서 조회 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Employee not found',
          }),
      } as Response)

      const result = await fetchEmployeePayslips('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Employee not found')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchEmployeePayslips('employee-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('createPayslip', () => {
    it('새 급여명세서를 성공적으로 생성해야 함', async () => {
      const mockCreatedPayslip: Payslip = {
        id: 'payslip-new',
        employeeId: 'employee-1',
        employeeName: '홍길동',
        period: '2025-02',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 200000,
        netSalary: 3300000,
        status: 'draft',
        createdAt: '2025-02-01T10:00:00Z',
        updatedAt: '2025-02-01T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockCreatedPayslip,
          }),
      } as Response)

      const result = await createPayslip('employee-1', '2025-02')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCreatedPayslip)
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: 'employee-1', period: '2025-02' }),
      })
    })

    it('중복 기간의 급여명세서 생성 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Payslip already exists for this period',
          }),
      } as Response)

      const result = await createPayslip('employee-1', '2025-01')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payslip already exists for this period')
    })

    it('존재하지 않는 직원의 급여명세서 생성 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Employee not found',
          }),
      } as Response)

      const result = await createPayslip('non-existent', '2025-02')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Employee not found')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await createPayslip('employee-1', '2025-02')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('updatePayslip', () => {
    it('급여명세서를 성공적으로 수정해야 함', async () => {
      const updates = {
        basicSalary: 3200000,
        allowances: 600000,
        deductions: 220000,
        netSalary: 3580000,
        status: 'confirmed' as const,
      }

      const mockUpdatedPayslip: Payslip = {
        id: 'payslip-1',
        employeeId: 'employee-1',
        employeeName: '홍길동',
        period: '2025-01',
        ...updates,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T12:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockUpdatedPayslip,
          }),
      } as Response)

      const result = await updatePayslip('payslip-1', updates)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedPayslip)
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips/payslip-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    })

    it('존재하지 않는 급여명세서 수정 시 에러를 반환해야 함', async () => {
      const updates = { basicSalary: 3200000 }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Payslip not found',
          }),
      } as Response)

      const result = await updatePayslip('non-existent', updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payslip not found')
    })

    it('확정된 급여명세서 수정 시 에러를 반환해야 함', async () => {
      const updates = { basicSalary: 3200000 }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Cannot modify confirmed payslip',
          }),
      } as Response)

      const result = await updatePayslip('payslip-1', updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot modify confirmed payslip')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      const updates = { basicSalary: 3200000 }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await updatePayslip('payslip-1', updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('deletePayslip', () => {
    it('급여명세서를 성공적으로 삭제해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: 'payslip-1' },
          }),
      } as Response)

      const result = await deletePayslip('payslip-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 'payslip-1' })
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips/payslip-1', {
        method: 'DELETE',
      })
    })

    it('존재하지 않는 급여명세서 삭제 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Payslip not found',
          }),
      } as Response)

      const result = await deletePayslip('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payslip not found')
    })

    it('확정된 급여명세서 삭제 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Cannot delete confirmed payslip',
          }),
      } as Response)

      const result = await deletePayslip('payslip-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete confirmed payslip')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await deletePayslip('payslip-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('downloadPayslip', () => {
    it('급여명세서를 성공적으로 다운로드해야 함', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response)

      // Mock DOM methods
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
      }))
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockRevokeObjectURL = vi.fn()
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true,
      })
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      })
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      })
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true,
      })
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true,
      })

      const result = await downloadPayslip('payslip-1')

      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips/payslip-1/download')
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('다운로드 실패 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      const result = await downloadPayslip('payslip-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('급여명세서 다운로드에 실패했습니다.')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await downloadPayslip('payslip-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('fetchSalaryHistory', () => {
    it('전체 급여 이력을 성공적으로 조회해야 함', async () => {
      const mockSalaryHistory: SalaryHistory[] = [
        {
          id: 'history-1',
          employeeId: 'employee-1',
          employeeName: '홍길동',
          period: '2025-01',
          basicSalary: 3000000,
          allowances: 500000,
          deductions: 200000,
          netSalary: 3300000,
          changeReason: '승진',
          effectiveDate: '2025-01-01',
          createdAt: '2025-01-15T10:00:00Z',
        },
        {
          id: 'history-2',
          employeeId: 'employee-1',
          employeeName: '홍길동',
          period: '2024-12',
          basicSalary: 2800000,
          allowances: 450000,
          deductions: 180000,
          netSalary: 3070000,
          changeReason: '연봉 인상',
          effectiveDate: '2024-12-01',
          createdAt: '2024-12-15T10:00:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSalaryHistory,
          }),
      } as Response)

      const result = await fetchSalaryHistory()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSalaryHistory)
      expect(fetch).toHaveBeenCalledWith('/api/salary/history')
    })

    it('특정 직원의 급여 이력을 조회해야 함', async () => {
      const mockSalaryHistory: SalaryHistory[] = [
        {
          id: 'history-1',
          employeeId: 'employee-1',
          employeeName: '홍길동',
          period: '2025-01',
          basicSalary: 3000000,
          allowances: 500000,
          deductions: 200000,
          netSalary: 3300000,
          changeReason: '승진',
          effectiveDate: '2025-01-01',
          createdAt: '2025-01-15T10:00:00Z',
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSalaryHistory,
          }),
      } as Response)

      const result = await fetchSalaryHistory('employee-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSalaryHistory)
      expect(fetch).toHaveBeenCalledWith('/api/salary/history/employee-1')
    })

    it('존재하지 않는 직원의 급여 이력 조회 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Employee not found',
          }),
      } as Response)

      const result = await fetchSalaryHistory('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Employee not found')
    })

    it('빈 급여 이력을 올바르게 처리해야 함', async () => {
      const mockSalaryHistory: SalaryHistory[] = []

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockSalaryHistory,
          }),
      } as Response)

      const result = await fetchSalaryHistory('employee-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(result.data).toHaveLength(0)
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchSalaryHistory('employee-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('uploadPayslipTemplate', () => {
    it('급여명세서 템플릿을 성공적으로 업로드해야 함', async () => {
      const mockFormData = new FormData()
      mockFormData.append('file', new File(['content'], 'template.xlsx'))

      const mockUploadResult = {
        id: 'template-1',
        filename: 'template.xlsx',
        size: 1024,
        uploadedAt: '2025-01-15T10:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockUploadResult,
          }),
      } as Response)

      const result = await uploadPayslipTemplate(mockFormData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUploadResult)
      expect(fetch).toHaveBeenCalledWith('/api/salary/payslips/upload', {
        method: 'POST',
        body: mockFormData,
      })
    })

    it('잘못된 파일 형식 업로드 시 에러를 반환해야 함', async () => {
      const mockFormData = new FormData()
      mockFormData.append('file', new File(['content'], 'template.txt'))

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Invalid file format. Please upload an Excel file.',
          }),
      } as Response)

      const result = await uploadPayslipTemplate(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid file format. Please upload an Excel file.')
    })

    it('파일 크기 초과 시 에러를 반환해야 함', async () => {
      const mockFormData = new FormData()
      mockFormData.append('file', new File(['content'], 'template.xlsx'))

      vi.mocked(fetch).mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'File size exceeds the maximum limit of 10MB',
          }),
      } as Response)

      const result = await uploadPayslipTemplate(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File size exceeds the maximum limit of 10MB')
    })

    it('네트워크 오류 시 에러를 반환해야 함', async () => {
      const mockFormData = new FormData()
      mockFormData.append('file', new File(['content'], 'template.xlsx'))

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await uploadPayslipTemplate(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('Integration tests', () => {
    it('전체 급여명세서 관리 워크플로우가 올바르게 작동해야 함', async () => {
      // 1. 급여명세서 생성
      const mockCreatedPayslip: Payslip = {
        id: 'payslip-new',
        employeeId: 'employee-1',
        employeeName: '홍길동',
        period: '2025-02',
        basicSalary: 3000000,
        allowances: 500000,
        deductions: 200000,
        netSalary: 3300000,
        status: 'draft',
        createdAt: '2025-02-01T10:00:00Z',
        updatedAt: '2025-02-01T10:00:00Z',
      }

      // 2. 급여명세서 수정
      const mockUpdatedPayslip: Payslip = {
        ...mockCreatedPayslip,
        basicSalary: 3200000,
        allowances: 600000,
        deductions: 220000,
        netSalary: 3580000,
        status: 'confirmed',
        updatedAt: '2025-02-01T12:00:00Z',
      }

      // 3. 급여명세서 조회
      const mockPayslips: Payslip[] = [mockUpdatedPayslip]

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockCreatedPayslip,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockUpdatedPayslip,
            }),
        } as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: mockPayslips,
            }),
        } as Response)

      // 급여명세서 생성
      const createResult = await createPayslip('employee-1', '2025-02')
      expect(createResult.success).toBe(true)
      expect(createResult.data?.status).toBe('draft')

      // 급여명세서 수정
      const updateResult = await updatePayslip('payslip-new', {
        basicSalary: 3200000,
        allowances: 600000,
        deductions: 220000,
        netSalary: 3580000,
        status: 'confirmed',
      })
      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.status).toBe('confirmed')

      // 급여명세서 조회
      const fetchResult = await fetchPayslips()
      expect(fetchResult.success).toBe(true)
      expect(fetchResult.data).toHaveLength(1)
      expect(fetchResult.data?.[0].status).toBe('confirmed')
    })

    it('다양한 급여명세서 상태를 올바르게 처리해야 함', async () => {
      const testCases = [
        {
          payslip: {
            id: 'payslip-draft',
            employeeId: 'employee-1',
            employeeName: '홍길동',
            period: '2025-01',
            basicSalary: 3000000,
            allowances: 500000,
            deductions: 200000,
            netSalary: 3300000,
            status: 'draft' as const,
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
          expectedStatus: 'draft',
        },
        {
          payslip: {
            id: 'payslip-confirmed',
            employeeId: 'employee-2',
            employeeName: '김철수',
            period: '2025-01',
            basicSalary: 2500000,
            allowances: 300000,
            deductions: 150000,
            netSalary: 2650000,
            status: 'confirmed' as const,
            createdAt: '2025-01-15T11:00:00Z',
            updatedAt: '2025-01-15T11:00:00Z',
          },
          expectedStatus: 'confirmed',
        },
        {
          payslip: {
            id: 'payslip-cancelled',
            employeeId: 'employee-3',
            employeeName: '이영희',
            period: '2025-01',
            basicSalary: 2000000,
            allowances: 200000,
            deductions: 100000,
            netSalary: 2100000,
            status: 'cancelled' as const,
            createdAt: '2025-01-15T12:00:00Z',
            updatedAt: '2025-01-15T12:00:00Z',
          },
          expectedStatus: 'cancelled',
        },
      ]

      for (const testCase of testCases) {
        vi.mocked(fetch).mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: [testCase.payslip],
            }),
        } as Response)

        const result = await fetchEmployeePayslips(testCase.payslip.employeeId)

        expect(result.success).toBe(true)
        expect(result.data?.[0].status).toBe(testCase.expectedStatus)
      }
    })
  })
})
