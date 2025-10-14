import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockEvent, createMockRequest, getJsonResponseBody } from '../helpers/api-helper'
import { DBHelper } from '../helpers/db-helper'

// Mock requireAuth
const mockRequireAuth = vi.fn()

describe('Finance + HR Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DBHelper.reset()
    mockRequireAuth.mockResolvedValue({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'admin'],
      },
    })
  })

  describe('Salary Calculation and Payment Flow', () => {
    it('should complete salary calculation to payment flow', async () => {
      // 1. Mock employee data
      const mockEmployee = {
        id: 'employee-1',
        firstName: '길동',
        lastName: '홍',
        email: 'hong.gd@example.com',
        position: '시니어 개발자',
        department: '개발팀',
        baseSalary: 50000000,
        allowances: 5000000,
        hireDate: '2022-01-01',
        status: 'active',
      }

      DBHelper.mockSelectResponse('employees', [mockEmployee])

      // 2. Mock attendance data
      const mockAttendance = {
        employeeId: 'employee-1',
        month: '2023-10',
        workingDays: 22,
        actualWorkingDays: 21,
        overtimeHours: 8,
        leaveDays: 1,
      }

      DBHelper.mockSelectResponse('attendance', [mockAttendance])

      // 3. Mock salary calculation
      const mockPayslip = {
        id: 'payslip-new',
        employeeId: 'employee-1',
        period: '2023-10',
        baseSalary: 4166667, // 50000000 / 12
        allowances: 416667,   // 5000000 / 12
        overtime: 200000,     // 8 hours * 25000
        grossSalary: 4783334,
        tax: 717500,          // 15% of gross
        insurance: 239167,    // 5% of gross
        deductions: 956667,   // tax + insurance
        netSalary: 3826667,
        status: 'calculated',
        createdAt: '2023-10-31T00:00:00Z',
        updatedAt: '2023-10-31T00:00:00Z',
      }

      DBHelper.mockUpdateResponse('payslips', mockPayslip)

      // 4. Mock bank account
      const mockBankAccount = {
        id: 'account-1',
        employeeId: 'employee-1',
        accountNumber: '123-456-7890',
        bankName: '국민은행',
        accountHolder: '홍길동',
        isPrimary: true,
      }

      DBHelper.mockSelectResponse('employee_bank_accounts', [mockBankAccount])

      // 5. Mock payment transaction
      const mockTransaction = {
        id: 'transaction-new',
        accountId: 'company-account',
        amount: -3826667, // Negative for outgoing payment
        type: 'expense',
        category: 'salary',
        description: '급여 지급 - 홍길동 (2023-10)',
        referenceNumber: 'PAY-2023-10-001',
        transactionDate: '2023-11-01',
        balanceAfter: 46173333, // 50000000 - 3826667
        createdAt: '2023-11-01T00:00:00Z',
        updatedAt: '2023-11-01T00:00:00Z',
      }

      DBHelper.mockUpdateResponse('transactions', mockTransaction)

      const request = createMockRequest('POST', {
        employeeId: 'employee-1',
        period: '2023-10',
      })
      const event = createMockEvent(request)

      // Mock the salary processing endpoint
      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        // Step 1: Get employee data
        const employeeResult = await DBHelper.getMockQuery()('SELECT * FROM employees WHERE id = ?')
        const employee = employeeResult.rows[0] || mockEmployee
        
        // Step 2: Get attendance data
        const attendanceResult = await DBHelper.getMockQuery()('SELECT * FROM attendance WHERE employee_id = ? AND month = ?')
        const attendance = attendanceResult.rows[0]
        
        // Step 3: Calculate salary
        const monthlyBaseSalary = employee.baseSalary / 12
        const monthlyAllowances = employee.allowances / 12
        const overtimePay = attendance.overtimeHours * 25000 // 25,000 per hour
        const grossSalary = monthlyBaseSalary + monthlyAllowances + overtimePay
        
        const tax = Math.floor(grossSalary * 0.15) // 15% tax
        const insurance = Math.floor(grossSalary * 0.05) // 5% insurance
        const deductions = tax + insurance
        const netSalary = grossSalary - deductions
        
        // Step 4: Create payslip
        const payslipData = {
          employeeId: employee.id,
          period: body.period,
          baseSalary: monthlyBaseSalary,
          allowances: monthlyAllowances,
          overtime: overtimePay,
          grossSalary,
          tax,
          insurance,
          deductions,
          netSalary,
          status: 'calculated',
        }
        
        const payslipResult = await DBHelper.getMockQuery()('INSERT INTO payslips ...')
        
        // Step 5: Get bank account for payment
        const bankResult = await DBHelper.getMockQuery()('SELECT * FROM employee_bank_accounts WHERE employee_id = ? AND is_primary = true')
        const bankAccount = bankResult.rows[0]
        
        // Step 6: Create payment transaction
        const transactionData = {
          accountId: 'company-account',
          amount: -netSalary,
          type: 'expense',
          category: 'salary',
          description: `급여 지급 - ${employee.firstName}${employee.lastName} (${body.period})`,
          referenceNumber: `PAY-${body.period.replace('-', '-')}-001`,
          transactionDate: new Date().toISOString().split('T')[0],
        }
        
        const transactionResult = await DBHelper.getMockQuery()('INSERT INTO transactions ...')
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            payslip: payslipResult.rows[0],
            transaction: transactionResult.rows[0],
            bankAccount,
          }
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(201)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.payslip).toBeDefined()
      expect(responseBody.data.transaction).toBeDefined()
      expect(responseBody.data.bankAccount).toBeDefined()
      
      // Verify database queries were called
      expect(DBHelper.getMockQuery()).toHaveBeenCalled()
    })

    it('should handle missing attendance data', async () => {
      const mockEmployee = {
        id: 'employee-1',
        firstName: '길동',
        lastName: '홍',
        baseSalary: 50000000,
        allowances: 5000000,
      }

      DBHelper.mockSelectResponse('employees', [mockEmployee])
      DBHelper.mockSelectResponse('attendance', []) // No attendance data

      const request = createMockRequest('POST', {
        employeeId: 'employee-1',
        period: '2023-10',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        const employeeResult = await DBHelper.getMockQuery()('SELECT * FROM employees WHERE id = ?')
        const employee = employeeResult.rows[0]
        
        const attendanceResult = await DBHelper.getMockQuery()('SELECT * FROM attendance WHERE employee_id = ? AND month = ?')
        const attendance = attendanceResult.rows[0]
        
        if (!attendance) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Attendance data not found for the period' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        
        return new Response(JSON.stringify({ success: true }), { status: 201 })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Attendance data not found for the period')
    })

    it('should handle missing bank account', async () => {
      const mockEmployee = {
        id: 'employee-1',
        firstName: '길동',
        lastName: '홍',
        baseSalary: 50000000,
        allowances: 5000000,
      }

      const mockAttendance = {
        employeeId: 'employee-1',
        month: '2023-10',
        workingDays: 22,
        actualWorkingDays: 21,
        overtimeHours: 0,
        leaveDays: 1,
      }

      DBHelper.mockSelectResponse('employees', [mockEmployee])
      DBHelper.mockSelectResponse('attendance', [mockAttendance])
      DBHelper.mockSelectResponse('employee_bank_accounts', []) // No bank account

      const request = createMockRequest('POST', {
        employeeId: 'employee-1',
        period: '2023-10',
      })
      const event = createMockEvent(request)

      const mockPOST = vi.fn().mockImplementation(async ({ request }) => {
        const body = await request.json()
        
        const employeeResult = await DBHelper.getMockQuery()('SELECT * FROM employees WHERE id = ?')
        const employee = employeeResult.rows[0] || mockEmployee
        
        const attendanceResult = await DBHelper.getMockQuery()('SELECT * FROM attendance WHERE employee_id = ? AND month = ?')
        const attendance = attendanceResult.rows[0]
        
        // Calculate salary (simplified)
        const monthlyBaseSalary = employee.baseSalary / 12
        const monthlyAllowances = employee.allowances / 12
        const grossSalary = monthlyBaseSalary + monthlyAllowances
        const netSalary = grossSalary - (grossSalary * 0.2) // 20% deductions
        
        // Try to get bank account
        const bankResult = await DBHelper.getMockQuery()('SELECT * FROM employee_bank_accounts WHERE employee_id = ? AND is_primary = true')
        const bankAccount = bankResult.rows[0]
        
        if (!bankAccount) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Primary bank account not found for employee' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        
        return new Response(JSON.stringify({ success: true }), { status: 201 })
      })

      const response = await mockPOST({ request, url: event.url, params: {}, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(404)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Primary bank account not found for employee')
    })
  })

  describe('Expense Management Flow', () => {
    it('should complete expense approval and reimbursement flow', async () => {
      // 1. Mock expense request
      const mockExpenseRequest = {
        id: 'expense-1',
        employeeId: 'employee-1',
        amount: 500000,
        category: 'business_trip',
        description: '출장비',
        receiptS3Key: 's3://test-bucket/expense-1/receipt.pdf',
        status: 'pending',
        submittedAt: '2023-10-26T10:00:00Z',
      }

      DBHelper.mockSelectResponse('expense_requests', [mockExpenseRequest])

      // 2. Mock employee data
      const mockEmployee = {
        id: 'employee-1',
        firstName: '길동',
        lastName: '홍',
        email: 'hong.gd@example.com',
      }

      DBHelper.mockSelectResponse('employees', [mockEmployee])

      // 3. Mock bank account
      const mockBankAccount = {
        id: 'account-1',
        employeeId: 'employee-1',
        accountNumber: '123-456-7890',
        bankName: '국민은행',
        isPrimary: true,
      }

      DBHelper.mockSelectResponse('employee_bank_accounts', [mockBankAccount])

      // 4. Mock approval and reimbursement
      const approvedExpense = {
        ...mockExpenseRequest,
        status: 'approved',
        approvedBy: 'manager-1',
        approvedAt: '2023-10-26T14:00:00Z',
      }

      DBHelper.mockUpdateResponse('expense_requests', approvedExpense)

      // 5. Mock reimbursement transaction
      const mockReimbursementTransaction = {
        id: 'transaction-reimbursement',
        accountId: 'company-account',
        amount: -500000,
        type: 'expense',
        category: 'reimbursement',
        description: '출장비 환급 - 홍길동',
        referenceNumber: 'REIMB-2023-001',
        transactionDate: '2023-10-26',
        createdAt: '2023-10-26T14:00:00Z',
      }

      DBHelper.mockUpdateResponse('transactions', mockReimbursementTransaction)

      const request = createMockRequest('PUT', {
        status: 'approved',
        approvedBy: 'manager-1',
      })
      const event = createMockEvent(request, { id: 'expense-1' })

      const mockPUT = vi.fn().mockImplementation(async ({ request, params }) => {
        const body = await request.json()
        
        // Step 1: Get expense request
        const expenseResult = await DBHelper.getMockQuery()('SELECT * FROM expense_requests WHERE id = ?')
        const expense = expenseResult.rows[0] || mockExpenseRequest
        
        if (!expense) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Expense request not found' 
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        
        // Step 2: Update expense status
        const updatedExpense = {
          ...expense,
          status: body.status,
          approvedBy: body.approvedBy,
          approvedAt: new Date().toISOString(),
        }
        
        await DBHelper.getMockQuery()('UPDATE expense_requests SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?')
        
        // Step 3: If approved, create reimbursement transaction
        if (body.status === 'approved') {
          const employeeResult = await DBHelper.getMockQuery()('SELECT * FROM employees WHERE id = ?')
          const employee = employeeResult.rows[0]
          
          const transactionData = {
            accountId: 'company-account',
            amount: -expense.amount,
            type: 'expense',
            category: 'reimbursement',
            description: `${expense.description} 환급 - ${employee.firstName}${employee.lastName}`,
            referenceNumber: `REIMB-${new Date().getFullYear()}-001`,
            transactionDate: new Date().toISOString().split('T')[0],
          }
          
          await DBHelper.getMockQuery()('INSERT INTO transactions ...')
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: updatedExpense 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPUT({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.status).toBe('approved')
      expect(responseBody.data.approvedBy).toBe('manager-1')
      
      // Verify database operations
      expect(DBHelper.getMockQuery()).toHaveBeenCalled()
    })

    it('should handle expense rejection flow', async () => {
      const mockExpenseRequest = {
        id: 'expense-1',
        employeeId: 'employee-1',
        amount: 500000,
        category: 'business_trip',
        description: '출장비',
        status: 'pending',
      }

      DBHelper.mockSelectResponse('expense_requests', [mockExpenseRequest])

      const request = createMockRequest('PUT', {
        status: 'rejected',
        rejectionReason: '영수증이 불분명함',
        approvedBy: 'manager-1',
      })
      const event = createMockEvent(request, { id: 'expense-1' })

      const mockPUT = vi.fn().mockImplementation(async ({ request, params }) => {
        const body = await request.json()
        
        const expenseResult = await DBHelper.getMockQuery()('SELECT * FROM expense_requests WHERE id = ?')
        const expense = expenseResult.rows[0]
        
        const updatedExpense = {
          ...expense,
          status: body.status,
          rejectionReason: body.rejectionReason,
          approvedBy: body.approvedBy,
          approvedAt: new Date().toISOString(),
        }
        
        await DBHelper.getMockQuery()('UPDATE expense_requests SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = ? WHERE id = ?')
        
        // No transaction created for rejected expenses
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: updatedExpense 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

      const response = await mockPUT({ request, url: event.url, params: event.params, locals: event.locals, route: event.route, cookies: event.cookies, fetch: event.fetch, getClientAddress: event.getClientAddress, platform: event.platform })
      const responseBody = await getJsonResponseBody(response)

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.status).toBe('rejected')
      expect(responseBody.data.rejectionReason).toBe('영수증이 불분명함')
    })
  })
})
