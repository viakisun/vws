import { requireRole } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { PayrollExcelParser } from '$lib/utils/payroll-excel-parser'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 급여대장 업로드
export const POST: RequestHandler = async (event) => {
  try {
    // 관리자 권한 확인
    const { user } = await requireRole(event, ['ADMIN', 'MANAGER'])

    const formData = await event.request.formData()
    const file = formData.get('file') as File
    const selectedPeriod = formData.get('period') as string

    if (!file) {
      return json(
        {
          success: false,
          error: '파일이 선택되지 않았습니다.',
        },
        { status: 400 },
      )
    }

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return json(
        {
          success: false,
          error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.',
        },
        { status: 400 },
      )
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return json(
        {
          success: false,
          error: '파일 크기는 10MB를 초과할 수 없습니다.',
        },
        { status: 400 },
      )
    }

    logger.log('Starting payroll excel upload:', {
      fileName: file.name,
      fileSize: file.size,
      uploadedBy: user.email,
    })

    // 엑셀 파일 파싱
    const parsedData = await PayrollExcelParser.parsePayrollExcel(file)

    // 선택된 기간으로 덮어쓰기
    if (selectedPeriod) {
      const [year, month] = selectedPeriod.split('-')
      parsedData.period = selectedPeriod
      parsedData.year = parseInt(year)
      parsedData.month = parseInt(month)
    }

    // 데이터 검증
    const validation = PayrollExcelParser.validateParsedData(parsedData)
    if (!validation.isValid) {
      return json(
        {
          success: false,
          error: '데이터 검증 실패',
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    logger.log('Excel parsed successfully:', {
      period: parsedData.period,
      employeeCount: parsedData.total_employees,
      totalPayments: parsedData.total_payments,
      totalDeductions: parsedData.total_deductions,
      totalNetSalary: parsedData.total_net_salary,
    })

    // 기존 급여명세서 확인
    const existingPayslips = await query(
      `
      SELECT employee_id, period 
      FROM payslips 
      WHERE period = $1 AND is_generated = true
    `,
      [parsedData.period],
    )

    const existingEmployeeIds = new Set(existingPayslips.rows.map((row) => row.employee_id))

    // 데이터베이스에 저장
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const employee of parsedData.employees) {
      try {
        // 직원 ID 조회 (이름으로)
        // 엑셀: "이건희" -> DB: "건희 이" 형식으로 매칭
        // 엑셀 이름을 성+이름으로 분리하여 매칭
        const excelName = employee.employee_name.trim()
        let employeeResult

        if (excelName.length >= 2) {
          // 2글자 이상인 경우: 첫 글자를 성, 나머지를 이름으로 가정
          const lastName = excelName.charAt(0)
          const firstName = excelName.substring(1)

          employeeResult = await query(
            `
            SELECT id, employee_id FROM employees 
            WHERE (first_name = $1 AND last_name = $2)
            OR (first_name = $2 AND last_name = $1)
            OR CONCAT(first_name, ' ', last_name) = $3
            OR CONCAT(last_name, first_name) = $3
          `,
            [firstName, lastName, excelName],
          )
        } else {
          // 1글자인 경우: 이름으로만 매칭
          employeeResult = await query(
            `
            SELECT id, employee_id FROM employees 
            WHERE first_name = $1 OR last_name = $1
          `,
            [excelName],
          )
        }

        if (employeeResult.rows.length === 0) {
          results.errors.push(`${employee.employee_name}에 해당하는 직원을 찾을 수 없습니다.`)
          continue
        }

        const employeeId = employeeResult.rows[0].id
        const actualEmployeeId = employeeResult.rows[0].employee_id
        const isUpdate = existingEmployeeIds.has(employeeId)

        // 급여명세서 저장/업데이트
        if (isUpdate) {
          await query(
            `
            UPDATE payslips SET
              pay_period_start = $3,
              pay_period_end = $4,
              base_salary = $5,
              overtime_pay = $6,
              bonus = $7,
              total_amount = $8,
              total_payments = $8,
              total_deductions = $9,
              net_salary = $10,
              employee_name = $11,
              employee_id_number = $12,
              department = $13,
              position = $14,
              hire_date = $15,
              updated_at = CURRENT_TIMESTAMP,
              updated_by = $16
            WHERE employee_id = $1 AND period = $2
          `,
            [
              employeeId,
              parsedData.period,
              `${parsedData.year}-${parsedData.month.toString().padStart(2, '0')}-01`,
              `${parsedData.year}-${parsedData.month.toString().padStart(2, '0')}-${new Date(parsedData.year, parsedData.month, 0).getDate()}`,
              employee.basic_salary,
              employee.meal_allowance +
                employee.vehicle_allowance +
                employee.other_allowance +
                employee.research_allowance,
              employee.research_allowance,
              employee.total_payments,
              employee.total_deductions,
              employee.net_salary,
              employee.employee_name,
              actualEmployeeId,
              employee.department || '',
              employee.position,
              employee.hire_date,
              user.email,
            ],
          )
          results.updated++
        } else {
          await query(
            `
            INSERT INTO payslips (
              employee_id, period, pay_period_start, pay_period_end,
              base_salary, overtime_pay, bonus, total_amount, total_payments, total_deductions, net_salary,
              status, is_generated, employee_name, employee_id_number, department, position, hire_date,
              created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, 'generated', true, $11, $12, $13, $14, $15, $16, $16
            )
          `,
            [
              employeeId,
              parsedData.period,
              `${parsedData.year}-${parsedData.month.toString().padStart(2, '0')}-01`,
              `${parsedData.year}-${parsedData.month.toString().padStart(2, '0')}-${new Date(parsedData.year, parsedData.month, 0).getDate()}`,
              employee.basic_salary,
              employee.meal_allowance +
                employee.vehicle_allowance +
                employee.other_allowance +
                employee.research_allowance,
              employee.research_allowance,
              employee.total_payments,
              employee.total_deductions,
              employee.net_salary,
              employee.employee_name,
              actualEmployeeId,
              employee.department || '',
              employee.position,
              employee.hire_date,
              user.email,
            ],
          )
          results.created++
        }
      } catch (error) {
        logger.error(`Error processing employee ${employee.employee_name}:`, error)
        results.errors.push(`${employee.employee_name} 처리 중 오류가 발생했습니다.`)
      }
    }

    logger.log('Payroll upload completed:', results)

    return json({
      success: true,
      message: '급여대장이 성공적으로 업로드되었습니다.',
      data: {
        period: parsedData.period,
        totalEmployees: parsedData.total_employees,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
        summary: {
          totalPayments: parsedData.total_payments,
          totalDeductions: parsedData.total_deductions,
          totalNetSalary: parsedData.total_net_salary,
        },
      },
    })
  } catch (error) {
    logger.error('Error uploading payroll:', error)
    return json(
      {
        success: false,
        error: '급여대장 업로드 중 오류가 발생했습니다.',
      },
      { status: 500 },
    )
  }
}
