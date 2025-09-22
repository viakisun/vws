import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'

export async function GET({ params, url }) {
  try {
    const { employeeId } = params
    const period = url.searchParams.get('period') // YYYY-MM 형식
    const year = url.searchParams.get('year') // YYYY 형식

    if (!employeeId) {
      return json(
        {
          success: false,
          error: '직원 ID가 필요합니다.'
        },
        { status: 400 }
      )
    }

    // 연도별 데이터 요청인 경우
    if (year) {
      const { rows } = await query(
        `
				SELECT
					p.id,
					p.employee_id AS "employeeId",
					p.period,
					p.pay_date AS "payDate",
					p.base_salary AS "baseSalary",
					p.total_payments AS "totalPayments",
					p.total_deductions AS "totalDeductions",
					p.net_salary AS "netSalary",
					p.payments,
					p.deductions,
					p.status,
					p.is_generated AS "isGenerated",
					p.created_at AS "createdAt",
					p.updated_at AS "updatedAt",
					-- 직원 정보
					e.first_name || e.last_name AS "employeeName",
					e.employee_id AS "employeeIdNumber",
					e.department,
					e.position,
					e.hire_date AS "hireDate"
				FROM payslips p
				JOIN employees e ON p.employee_id = e.id
				WHERE p.employee_id = $1 AND p.period LIKE $2
				ORDER BY p.period DESC
				`,
        [employeeId, `${year}-%`]
      )

      return json({
        success: true,
        data: rows,
        source: 'yearly'
      })
    }

    // 1. 이번달 급여명세서가 있는지 확인
    if (period) {
      const currentPayslip = await query(
        `
				SELECT
					p.id,
					p.employee_id AS "employeeId",
					p.period,
					p.pay_date AS "payDate",
					p.base_salary AS "baseSalary",
					p.total_payments AS "totalPayments",
					p.total_deductions AS "totalDeductions",
					p.net_salary AS "netSalary",
					p.payments,
					p.deductions,
					p.status,
					p.is_generated AS "isGenerated",
					p.created_at AS "createdAt",
					p.updated_at AS "updatedAt",
					-- 직원 정보
					e.first_name || e.last_name AS "employeeName",
					e.employee_id AS "employeeIdNumber",
					e.department,
					e.position,
					e.hire_date AS "hireDate"
				FROM payslips p
				JOIN employees e ON p.employee_id = e.id
				WHERE p.employee_id = $1 AND p.period = $2
				`,
        [employeeId, period]
      )

      if (currentPayslip.rows.length > 0) {
        return json({
          success: true,
          data: currentPayslip.rows[0],
          source: 'current'
        })
      }
    }

    // 2. 지난달 급여명세서가 있는지 확인
    const previousPayslip = await query(
      `
			SELECT
				p.id,
				p.employee_id AS "employeeId",
				p.period,
				p.pay_date AS "payDate",
				p.base_salary AS "baseSalary",
				p.total_payments AS "totalPayments",
				p.total_deductions AS "totalDeductions",
				p.net_salary AS "netSalary",
				p.payments,
				p.deductions,
				p.status,
				p.is_generated AS "isGenerated",
				p.created_at AS "createdAt",
				p.updated_at AS "updatedAt",
				-- 직원 정보
				e.first_name || e.last_name AS "employeeName",
				e.employee_id AS "employeeIdNumber",
				e.department,
				e.position,
				e.hire_date AS "hireDate"
			FROM payslips p
			JOIN employees e ON p.employee_id = e.id
			WHERE p.employee_id = $1
			ORDER BY p.period DESC
			LIMIT 1
			`,
      [employeeId]
    )

    if (previousPayslip.rows.length > 0) {
      return json({
        success: true,
        data: previousPayslip.rows[0],
        source: 'previous'
      })
    }

    // 3. 기본 템플릿 생성 (처음인 경우)
    const employee = await query(
      `
			SELECT
				e.id,
				e.employee_id,
				e.first_name,
				e.last_name,
				e.department,
				e.position,
				e.hire_date,
				sc.annual_salary
			FROM employees e
			LEFT JOIN salary_contracts sc ON e.id = sc.employee_id AND sc.status = 'active'
			WHERE e.id = $1
			`,
      [employeeId]
    )

    if (employee.rows.length === 0) {
      return json(
        {
          success: false,
          error: '직원을 찾을 수 없습니다.'
        },
        { status: 404 }
      )
    }

    const emp = employee.rows[0]
    const baseSalary = emp.annual_salary ? Math.round(emp.annual_salary / 12) : 3000000
    const currentPeriod = period || new Date().toISOString().slice(0, 7)

    // 기본 급여명세서 템플릿 생성
    const defaultPayslip = {
      employeeId: emp.id,
      period: currentPeriod,
      payDate: new Date().toISOString().split('T')[0],
      employeeName: `${emp.last_name}${emp.first_name}`,
      employeeIdNumber: emp.employee_id,
      department: emp.department || '부서없음',
      position: emp.position || '연구원',
      hireDate: emp.hire_date,
      baseSalary: baseSalary,
      totalPayments: baseSalary + 500000, // 기본급 + 기본 수당
      totalDeductions: 0,
      netSalary: baseSalary + 500000,
      payments: [
        { id: 'basic_salary', name: '기본급', amount: baseSalary, type: 'basic', isTaxable: true },
        {
          id: 'position_allowance',
          name: '직책수당',
          amount: Math.round(baseSalary * 0.1),
          type: 'allowance',
          isTaxable: true
        },
        { id: 'bonus', name: '상여금', amount: 0, type: 'bonus', isTaxable: true },
        { id: 'meal_allowance', name: '식대', amount: 300000, type: 'allowance', isTaxable: false },
        {
          id: 'vehicle_maintenance',
          name: '차량유지',
          amount: 200000,
          type: 'allowance',
          isTaxable: false
        },
        {
          id: 'annual_leave_allowance',
          name: '연차수당',
          amount: 0,
          type: 'allowance',
          isTaxable: true
        },
        {
          id: 'year_end_settlement',
          name: '연말정산',
          amount: 0,
          type: 'settlement',
          isTaxable: true
        }
      ],
      deductions: [
        {
          id: 'health_insurance',
          name: '건강보험',
          rate: 0.034,
          type: 'insurance',
          amount: 0,
          isMandatory: true
        },
        {
          id: 'long_term_care',
          name: '장기요양보험',
          rate: 0.0034,
          type: 'insurance',
          amount: 0,
          isMandatory: true
        },
        {
          id: 'national_pension',
          name: '국민연금',
          rate: 0.045,
          type: 'pension',
          amount: 0,
          isMandatory: true
        },
        {
          id: 'employment_insurance',
          name: '고용보험',
          rate: 0.008,
          type: 'insurance',
          amount: 0,
          isMandatory: true
        },
        { id: 'income_tax', name: '갑근세', rate: 0.13, type: 'tax', amount: 0, isMandatory: true },
        { id: 'local_tax', name: '주민세', rate: 0.013, type: 'tax', amount: 0, isMandatory: true },
        { id: 'other', name: '기타', rate: 0, type: 'other', amount: 0, isMandatory: false }
      ],
      status: 'draft',
      isGenerated: false
    }

    return json({
      success: true,
      data: defaultPayslip,
      source: 'default'
    })
  } catch (error) {
    return json(
      {
        success: false,
        error: '직원 급여명세서를 가져오는데 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
