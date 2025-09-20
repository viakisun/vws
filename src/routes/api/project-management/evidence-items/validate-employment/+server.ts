import { formatDateForDisplay } from '$lib/utils/date-handler'
import { json } from '@sveltejs/kit'
import { Pool } from 'pg'
import type { RequestHandler } from './$types'

const pool = new Pool({
	host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
	port: 5432,
	database: 'postgres',
	user: 'postgres',
	password: 'viahubdev',
	ssl: { rejectUnauthorized: false }
})

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { assigneeId, dueDate, projectBudgetId } = await request.json()

		if (!assigneeId || !dueDate || !projectBudgetId) {
			return json({ error: '담당자 ID, 기한, 프로젝트 예산 ID가 필요합니다.' }, { status: 400 })
		}

		// 담당자의 재직 정보 조회
		const employeeResult = await pool.query(
			`
			SELECT 
				id,
				first_name,
				last_name,
				hire_date,
				termination_date,
				status
			FROM employees 
			WHERE id = $1
		`,
			[assigneeId]
		)

		if (employeeResult.rows.length === 0) {
			return json({
				success: false,
				error: 'EMPLOYEE_NOT_FOUND',
				message: '담당 직원을 찾을 수 없습니다.'
			})
		}

		const employee = employeeResult.rows[0]
		const dueDateObj = new Date(dueDate)
		const hireDate = employee.hire_date ? new Date(employee.hire_date) : null
		const terminationDate = employee.termination_date ? new Date(employee.termination_date) : null

		// 프로젝트 예산 기간 조회
		const budgetResult = await pool.query(
			`
			SELECT 
				start_date,
				end_date,
				period_number,
				fiscal_year
			FROM project_budgets 
			WHERE id = $1
		`,
			[projectBudgetId]
		)

		if (budgetResult.rows.length === 0) {
			return json({
				success: false,
				error: 'BUDGET_NOT_FOUND',
				message: '프로젝트 예산 정보를 찾을 수 없습니다.'
			})
		}

		const budget = budgetResult.rows[0]
		const periodStartDate = new Date(budget.start_date)
		const periodEndDate = new Date(budget.end_date)

		// 재직 기간 검증
		let isValid = true
		let reason = 'VALID'
		let message = '재직 기간이 유효합니다.'
		let warnings = []

		// 1. 퇴사한 직원인지 확인
		if (employee.status === 'terminated' || terminationDate) {
			if (terminationDate && dueDateObj > terminationDate) {
				isValid = false
				reason = 'TERMINATED_BEFORE_DUE_DATE'
				message = `퇴사일(${formatDateForDisplay(terminationDate.toISOString(), 'KOREAN')}) 이후에 인건비를 집행할 수 없습니다.`
			}
		}

		// 2. 입사 전에 인건비가 집행되었는지 확인
		if (hireDate && dueDateObj < hireDate) {
			isValid = false
			reason = 'HIRED_AFTER_DUE_DATE'
			message = `입사일(${formatDateForDisplay(hireDate.toISOString(), 'KOREAN')}) 이전에 인건비를 집행할 수 없습니다.`
		}

		// 3. 현재 비활성 상태인 직원인지 확인
		if (employee.status === 'inactive') {
			isValid = false
			reason = 'INACTIVE_EMPLOYEE'
			message = '비활성 상태인 직원에게 인건비를 집행할 수 없습니다.'
		}

		// 4. 프로젝트 기간과 재직 기간이 겹치는지 확인
		if (hireDate && periodEndDate < hireDate) {
			isValid = false
			reason = 'HIRED_AFTER_PROJECT_PERIOD'
			message = `프로젝트 기간(${formatDateForDisplay(periodStartDate.toISOString(), 'KOREAN')} ~ ${formatDateForDisplay(periodEndDate.toISOString(), 'KOREAN')}) 이후에 입사한 직원입니다.`
		}

		if (terminationDate && periodStartDate > terminationDate) {
			isValid = false
			reason = 'TERMINATED_BEFORE_PROJECT_PERIOD'
			message = `프로젝트 기간(${formatDateForDisplay(periodStartDate.toISOString(), 'KOREAN')} ~ ${formatDateForDisplay(periodEndDate.toISOString(), 'KOREAN')}) 이전에 퇴사한 직원입니다.`
		}

		// 5. 경고사항 체크 (유효하지만 주의가 필요한 경우)
		if (isValid) {
			// 퇴사 예정인 직원
			if (terminationDate && dueDateObj > terminationDate) {
				warnings.push(
					`퇴사 예정일(${formatDateForDisplay(terminationDate.toISOString(), 'KOREAN')}) 이후의 인건비입니다.`
				)
			}

			// 입사한 지 얼마 안 된 직원
			if (hireDate) {
				const daysSinceHire = Math.floor(
					(dueDateObj.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
				)
				if (daysSinceHire < 30) {
					warnings.push(`입사한 지 ${daysSinceHire}일밖에 안 된 직원입니다.`)
				}
			}
		}

		return json({
			success: true,
			validation: {
				isValid,
				reason,
				message,
				warnings
			},
			employee: {
				id: employee.id,
				name: `${employee.last_name}${employee.first_name}`,
				hireDate: employee.hire_date,
				terminationDate: employee.termination_date,
				status: employee.status
			},
			projectPeriod: {
				startDate: budget.start_date,
				endDate: budget.end_date,
				periodNumber: budget.period_number,
				fiscalYear: budget.fiscal_year
			},
			dueDate: dueDate
		})
	} catch (error) {
		console.error('Employment validation error:', error)
		return json(
			{
				success: false,
				error: 'VALIDATION_ERROR',
				message: '재직 기간 검증 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
