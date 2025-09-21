import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /api/project-management/project-members/[id] - 특정 프로젝트 멤버 조회
export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await query(
			`
			SELECT 
				pm.*,
				CASE 
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' 
					THEN CONCAT(e.last_name, ' ', e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as employee_name,
				e.first_name,
				e.last_name,
				e.email as employee_email,
				e.department as employee_department,
				e.position as employee_position,
				p.title as project_title,
				p.code as project_code
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			JOIN projects p ON pm.project_id = p.id
			WHERE pm.id = $1
		`,
			[params.id]
		)

		if (result.rows.length === 0) {
			return json(
				{
					success: false,
					message: '프로젝트 멤버를 찾을 수 없습니다.'
				},
				{ status: 404 }
			)
		}

		return json({
			success: true,
			data: result.rows[0]
		})
	} catch (error) {
		console.error('프로젝트 멤버 조회 실패:', error)
		return json(
			{
				success: false,
				message: '프로젝트 멤버를 불러오는데 실패했습니다.',
				error: (error as Error).message
			},
			{ status: 500 }
		)
	}
}

// PUT /api/project-management/project-members/[id] - 프로젝트 멤버 수정
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json()
		const {
			role,
			startDate,
			endDate,
			participationRate,
			contributionType,
			contractAmount,
			status
		} = data

		// 필수 필드 검증
		if (
			role === undefined &&
			startDate === undefined &&
			endDate === undefined &&
			participationRate === undefined &&
			contributionType === undefined &&
			contractAmount === undefined &&
			status === undefined
		) {
			return json(
				{
					success: false,
					message: '수정할 필드가 없습니다.'
				},
				{ status: 400 }
			)
		}

		// 참여율 검증 (0-100 사이)
		if (participationRate !== undefined && (participationRate < 0 || participationRate > 100)) {
			return json(
				{
					success: false,
					message: '참여율은 0-100 사이의 값이어야 합니다.'
				},
				{ status: 400 }
			)
		}

		// 멤버 존재 확인
		const existingMember = await query('SELECT * FROM project_members WHERE id = $1', [params.id])

		if (existingMember.rows.length === 0) {
			return json(
				{
					success: false,
					message: '프로젝트 멤버를 찾을 수 없습니다.'
				},
				{ status: 404 }
			)
		}

		// 멤버 수정
		const updateFields = []
		const updateValues = []
		let paramIndex = 1

		if (role !== undefined) {
			updateFields.push(`role = $${paramIndex}`)
			updateValues.push(role)
			paramIndex++
		}

		if (startDate !== undefined) {
			updateFields.push(`start_date = $${paramIndex}`)
			updateValues.push(startDate)
			paramIndex++
		}

		if (endDate !== undefined) {
			updateFields.push(`end_date = $${paramIndex}`)
			updateValues.push(endDate)
			paramIndex++
		}

		if (participationRate !== undefined) {
			updateFields.push(`participation_rate = $${paramIndex}`)
			updateValues.push(participationRate)
			paramIndex++
		}

		if (contributionType !== undefined) {
			updateFields.push(`contribution_type = $${paramIndex}`)
			updateValues.push(contributionType)
			paramIndex++
		}

		// contract_amount 필드 제거 - 실제 근로계약서에서 조회

		if (status !== undefined) {
			updateFields.push(`status = $${paramIndex}`)
			updateValues.push(status)
			paramIndex++
		}

		// 참여율이 변경된 경우 월간금액 재계산
		if (participationRate !== undefined) {
			const currentMember = existingMember.rows[0]
			const finalParticipationRate = participationRate

			// 실제 근로계약서에서 최신 금액 조회
			const contractResult = await query(
				`
				SELECT sc.annual_salary, sc.monthly_salary
				FROM salary_contracts sc
				WHERE sc.employee_id = $1
					AND sc.status = 'active'
					AND (
						-- 계약서 시작일이 프로젝트 참여 기간 내에 있거나
						(sc.start_date <= COALESCE($3, CURRENT_DATE) AND (sc.end_date IS NULL OR sc.end_date >= COALESCE($2, CURRENT_DATE)))
						OR
						-- 프로젝트 참여 기간이 계약서 기간 내에 있거나
						(COALESCE($2, CURRENT_DATE) <= sc.start_date AND COALESCE($3, CURRENT_DATE) >= sc.start_date)
					)
				ORDER BY sc.start_date DESC
				LIMIT 1
			`,
				[currentMember.employee_id, currentMember.start_date, currentMember.end_date]
			)

			let contractMonthlySalary = 0
			if (contractResult.rows.length > 0) {
				const contract = contractResult.rows[0]
				contractMonthlySalary = contract.monthly_salary || contract.annual_salary / 12
			}

			// 글로벌 팩터 가져오기 (급여 배수)
			const factorResult = await query(`
				SELECT factor_value FROM global_factors WHERE factor_name = 'salary_multiplier'
			`)
			const salaryMultiplier =
				factorResult.rows.length > 0 ? parseFloat(factorResult.rows[0].factor_value) : 1.15

			// 월간 금액 계산: 실제 계약월급 * 급여배수 * (참여율/100)
			const monthlyAmount = Math.round(
				contractMonthlySalary * salaryMultiplier * (finalParticipationRate / 100)
			)

			updateFields.push(`monthly_amount = $${paramIndex}`)
			updateValues.push(monthlyAmount)
			paramIndex++
		}

		updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
		updateValues.push(params.id)

		const result = await query(
			`
			UPDATE project_members 
			SET ${updateFields.join(', ')}
			WHERE id = $${paramIndex}
			RETURNING *
		`,
			updateValues
		)

		// 수정된 멤버 정보와 관련 정보 조회
		const memberWithDetails = await query(
			`
			SELECT 
				pm.*,
				CASE 
					WHEN e.first_name ~ '^[가-힣]+$' AND e.last_name ~ '^[가-힣]+$' 
					THEN CONCAT(e.last_name, ' ', e.first_name)
					ELSE CONCAT(e.first_name, ' ', e.last_name)
				END as employee_name,
				e.first_name,
				e.last_name,
				e.email as employee_email,
				e.department as employee_department,
				e.position as employee_position,
				p.title as project_title,
				p.code as project_code
			FROM project_members pm
			JOIN employees e ON pm.employee_id = e.id
			JOIN projects p ON pm.project_id = p.id
			WHERE pm.id = $1
		`,
			[params.id]
		)

		return json({
			success: true,
			data: memberWithDetails.rows[0],
			message: '프로젝트 멤버가 성공적으로 수정되었습니다.'
		})
	} catch (error) {
		console.error('프로젝트 멤버 수정 실패:', error)
		return json(
			{
				success: false,
				message: '프로젝트 멤버 수정에 실패했습니다.',
				error: (error as Error).message
			},
			{ status: 500 }
		)
	}
}

// DELETE /api/project-management/project-members/[id] - 프로젝트 멤버 삭제
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		// 멤버 존재 확인
		const existingMember = await query('SELECT * FROM project_members WHERE id = $1', [params.id])

		if (existingMember.rows.length === 0) {
			return json(
				{
					success: false,
					message: '프로젝트 멤버를 찾을 수 없습니다.'
				},
				{ status: 404 }
			)
		}

		// 멤버 삭제
		await query('DELETE FROM project_members WHERE id = $1', [params.id])

		return json({
			success: true,
			message: '프로젝트 멤버가 성공적으로 삭제되었습니다.'
		})
	} catch (error) {
		console.error('프로젝트 멤버 삭제 실패:', error)
		return json(
			{
				success: false,
				message: '프로젝트 멤버 삭제에 실패했습니다.',
				error: (error as Error).message
			},
			{ status: 500 }
		)
	}
}
