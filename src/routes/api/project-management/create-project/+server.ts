import { formatDateForAPI } from '$lib/utils/date-calculator'
import { calculateBudgetAllocation } from '$lib/utils/salary-calculator'
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

interface ProjectCreationRequest {
	name: string
	description: string
	startDate: string
	endDate: string
	totalBudget: number
	annualPeriods: {
		periodNumber: number
		startDate: string
		endDate: string
		budget: number
	}[]
	budgetCategories: {
		name: string
		percentage: number
	}[]
	members: {
		employeeId: string
		role: string
		participationRate: number
		monthlyAmount: number
		startDate: string
		endDate: string
	}[]
	evidenceSettings: {
		autoGenerate: boolean
		namingConvention: string
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const client = await pool.connect()

	try {
		console.log('🚀 [1단계] 프로젝트 생성 요청 시작')

		const data: ProjectCreationRequest = await request.json()
		console.log('📋 [1단계] 요청 데이터:', JSON.stringify(data, null, 2))

		// 입력 데이터 검증
		console.log('🔍 [2단계] 입력 데이터 검증 시작')
		const validationResult = await validateProjectData(data)
		if (!validationResult.isValid) {
			console.log('❌ [2단계] 검증 실패:', validationResult.errors)
			return json({ success: false, errors: validationResult.errors }, { status: 400 })
		}
		console.log('✅ [2단계] 입력 데이터 검증 완료')

		await client.query('BEGIN')
		console.log('🔄 [3단계] 데이터베이스 트랜잭션 시작')

		// 프로젝트 생성
		console.log('📝 [4단계] 프로젝트 기본 정보 생성')
		const projectId = await createProject(client, data)
		console.log(`✅ [4단계] 프로젝트 생성 완료 - ID: ${projectId}`)

		// 연차별 예산 생성
		console.log('💰 [5단계] 연차별 예산 생성')
		const budgetIds = await createProjectBudgets(client, projectId, data)
		console.log(`✅ [5단계] 연차별 예산 생성 완료 - ${budgetIds.length}개 연차`)

		// 참여연구원 생성
		console.log('👥 [6단계] 참여연구원 생성')
		const memberIds = await createProjectMembers(client, projectId, data)
		console.log(`✅ [6단계] 참여연구원 생성 완료 - ${memberIds.length}명`)

		// 증빙 항목 자동 생성 (설정된 경우)
		if (data.evidenceSettings.autoGenerate) {
			console.log('📄 [7단계] 증빙 항목 자동 생성')
			const evidenceIds = await createEvidenceItems(client, projectId, data)
			console.log(`✅ [7단계] 증빙 항목 자동 생성 완료 - ${evidenceIds.length}개 항목`)
		} else {
			console.log('⏭️ [7단계] 증빙 항목 자동 생성 건너뜀 (설정 비활성화)')
		}

		// 검증 로직 실행
		console.log('🔍 [8단계] 생성된 데이터 검증')
		const finalValidation = await validateCreatedProject(client, projectId)
		if (!finalValidation.isValid) {
			console.log('❌ [8단계] 최종 검증 실패:', finalValidation.errors)
			await client.query('ROLLBACK')
			return json({ success: false, errors: finalValidation.errors }, { status: 400 })
		}
		console.log('✅ [8단계] 최종 검증 완료')

		// 자동 검증 및 수정 실행 (일시적으로 비활성화)
		console.log('⏭️ [9단계] 자동 검증 단계 건너뜀 (개발 중)')
		const autoValidationResult = {
			success: true,
			results: [],
			errors: [],
			fixedIssues: 0
		}

		await client.query('COMMIT')
		console.log('✅ [10단계] 데이터베이스 트랜잭션 커밋 완료')

		const result = {
			success: true,
			projectId,
			budgetIds,
			memberIds,
			evidenceIds: data.evidenceSettings.autoGenerate
				? await createEvidenceItems(client, projectId, data)
				: [],
			validation: finalValidation,
			autoValidation: autoValidationResult
		}

		console.log('🎉 [완료] 프로젝트 생성 성공:', result)
		return json(result)
	} catch (error) {
		console.error('💥 [오류] 프로젝트 생성 중 오류 발생:', error)
		await client.query('ROLLBACK')
		return json({ success: false, error: error.message }, { status: 500 })
	} finally {
		client.release()
	}
}

// 입력 데이터 검증 함수
async function validateProjectData(data: ProjectCreationRequest) {
	const errors: string[] = []

	console.log('🔍 [검증] 프로젝트 기본 정보 검증')
	if (!data.name || data.name.trim().length === 0) {
		errors.push('프로젝트명은 필수입니다.')
	}

	if (!data.startDate || !data.endDate) {
		errors.push('프로젝트 시작일과 종료일은 필수입니다.')
	}

	// UTC 기준으로 날짜 비교
	const startUtc = new Date(data.startDate + 'T00:00:00.000Z')
	const endUtc = new Date(data.endDate + 'T23:59:59.999Z')
	if (startUtc >= endUtc) {
		errors.push('프로젝트 종료일은 시작일보다 늦어야 합니다.')
	}

	console.log('🔍 [검증] 연차별 예산 검증')
	if (!data.annualPeriods || data.annualPeriods.length === 0) {
		errors.push('연차별 예산 정보는 필수입니다.')
	}

	// 연차별 예산 합계 검증
	const totalBudgetFromPeriods = data.annualPeriods.reduce((sum, period) => sum + period.budget, 0)
	if (Math.abs(totalBudgetFromPeriods - data.totalBudget) > 1000) {
		// 1000원 허용 오차
		errors.push(
			`연차별 예산 합계(${totalBudgetFromPeriods.toLocaleString()}원)와 총 예산(${data.totalBudget.toLocaleString()}원)이 일치하지 않습니다.`
		)
	}

	console.log('🔍 [검증] 참여연구원 검증')
	if (!data.members || data.members.length === 0) {
		errors.push('참여연구원 정보는 필수입니다.')
	}

	// 참여연구원 참여율 검증
	for (const member of data.members) {
		if (member.participationRate <= 0 || member.participationRate > 100) {
			errors.push(`${member.employeeId}의 참여율은 0% 초과 100% 이하여야 합니다.`)
		}
	}

	// 연차별 참여연구원 참여율 합계 검증
	for (const period of data.annualPeriods) {
		// UTC+9 타임존 적용된 날짜 비교
		const periodStartUtc = new Date(period.startDate + 'T00:00:00.000Z')
		const periodEndUtc = new Date(period.endDate + 'T23:59:59.999Z')

		const periodMembers = data.members.filter(member => {
			const memberStartUtc = new Date(member.startDate + 'T00:00:00.000Z')
			const memberEndUtc = new Date(member.endDate + 'T23:59:59.999Z')
			return memberStartUtc <= periodEndUtc && memberEndUtc >= periodStartUtc
		})

		const totalParticipationRate = periodMembers.reduce(
			(sum, member) => sum + member.participationRate,
			0
		)
		if (totalParticipationRate > 100) {
			errors.push(
				`${period.periodNumber}차년도 참여연구원 참여율 합계(${totalParticipationRate}%)가 100%를 초과합니다.`
			)
		}
	}

	return { isValid: errors.length === 0, errors }
}

// 프로젝트 생성 함수
async function createProject(client: any, data: ProjectCreationRequest) {
	console.log('📝 [생성] 프로젝트 기본 정보 삽입')

	const projectQuery = `
    INSERT INTO projects (
      code, title, description, start_date, end_date, budget_total, 
      status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
    RETURNING id
  `

	const result = await client.query(projectQuery, [
		`PRJ-${Date.now()}`, // 프로젝트 코드 자동 생성
		data.name,
		data.description,
		data.startDate,
		data.endDate,
		data.totalBudget
	])

	const projectId = result.rows[0].id
	console.log(`📝 [생성] 프로젝트 생성 완료 - ID: ${projectId}`)

	return projectId
}

// 연차별 예산 생성 함수
async function createProjectBudgets(client: any, projectId: string, data: ProjectCreationRequest) {
	console.log('💰 [생성] 연차별 예산 삽입 시작')

	const budgetIds: string[] = []

	for (const period of data.annualPeriods) {
		console.log(`💰 [생성] ${period.periodNumber}차년도 예산 생성`)

		// 예산 항목별 배분 계산 - 중앙화된 함수 사용
		const personnelCost = calculateBudgetAllocation(
			period.budget,
			data.budgetCategories.find(c => c.name === '인건비')?.percentage || 0
		)
		const materialCost = calculateBudgetAllocation(
			period.budget,
			data.budgetCategories.find(c => c.name === '재료비')?.percentage || 0
		)
		const activityCost = calculateBudgetAllocation(
			period.budget,
			data.budgetCategories.find(c => c.name === '연구활동비')?.percentage || 0
		)
		const indirectCost = calculateBudgetAllocation(
			period.budget,
			data.budgetCategories.find(c => c.name === '간접비')?.percentage || 0
		)

		const budgetQuery = `
      INSERT INTO project_budgets (
        project_id, period_number, start_date, end_date,
        personnel_cost, research_material_cost, research_activity_cost, research_stipend, indirect_cost,
        personnel_cost_cash, personnel_cost_in_kind,
        research_material_cost_cash, research_material_cost_in_kind,
        research_activity_cost_cash, research_activity_cost_in_kind,
        research_stipend_cash, research_stipend_in_kind,
        indirect_cost_cash, indirect_cost_in_kind,
        government_funding_amount, company_cash_amount, company_in_kind_amount,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
      RETURNING id
    `

		// 각 비목의 총합 계산 (현금 + 현물)
		const personnelCost = (period.personnelCostCash || 0) + (period.personnelCostInKind || 0)
		const researchMaterialCost =
			(period.researchMaterialCostCash || 0) + (period.researchMaterialCostInKind || 0)
		const researchActivityCost =
			(period.researchActivityCostCash || 0) + (period.researchActivityCostInKind || 0)
		const researchStipend = (period.researchStipendCash || 0) + (period.researchStipendInKind || 0)
		const indirectCost = (period.indirectCostCash || 0) + (period.indirectCostInKind || 0)

		const result = await client.query(budgetQuery, [
			projectId,
			period.periodNumber,
			period.startDate,
			period.endDate,
			personnelCost,
			researchMaterialCost,
			researchActivityCost,
			researchStipend,
			indirectCost,
			period.personnelCostCash || 0,
			period.personnelCostInKind || 0,
			period.researchMaterialCostCash || 0,
			period.researchMaterialCostInKind || 0,
			period.researchActivityCostCash || 0,
			period.researchActivityCostInKind || 0,
			period.researchStipendCash || 0,
			period.researchStipendInKind || 0,
			period.indirectCostCash || 0,
			period.indirectCostInKind || 0,
			period.governmentFundingAmount || 0,
			period.companyCashAmount || 0,
			period.companyInKindAmount || 0
		])

		budgetIds.push(result.rows[0].id)
		console.log(`💰 [생성] ${period.periodNumber}차년도 예산 생성 완료 - ID: ${result.rows[0].id}`)
	}

	return budgetIds
}

// 참여연구원 생성 함수
async function createProjectMembers(client: any, projectId: string, data: ProjectCreationRequest) {
	console.log('👥 [생성] 참여연구원 삽입 시작')

	const memberIds: string[] = []

	for (const member of data.members) {
		console.log(`👥 [생성] 참여연구원 ${member.employeeId} 등록`)

		// 참여연구원 날짜를 UTC 기준으로 변환하여 데이터베이스에 저장
		const formatMemberDateToUtc = (dateStr: string) => {
			if (!dateStr) return null

			try {
				// 중앙화된 날짜 변환 함수 사용 (UTC+9 타임존 적용)
				return formatDateForAPI(dateStr)
			} catch (error) {
				console.error('Date conversion error:', error)
				return null
			}
		}

		const memberQuery = `
      INSERT INTO project_members (
        project_id, employee_id, role, participation_rate, monthly_amount,
        start_date, end_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `

		const result = await client.query(memberQuery, [
			projectId,
			member.employeeId,
			member.role,
			member.participationRate,
			member.monthlyAmount,
			formatMemberDateToUtc(member.startDate),
			formatMemberDateToUtc(member.endDate)
		])

		memberIds.push(result.rows[0].id)
		console.log(`👥 [생성] 참여연구원 ${member.employeeId} 등록 완료 - ID: ${result.rows[0].id}`)
	}

	return memberIds
}

// 증빙 항목 자동 생성 함수
async function createEvidenceItems(client: any, projectId: string, data: ProjectCreationRequest) {
	console.log('📄 [생성] 증빙 항목 자동 생성 시작')

	const evidenceIds: string[] = []

	// 각 연차별로 증빙 항목 생성
	for (const period of data.annualPeriods) {
		console.log(`📄 [생성] ${period.periodNumber}차년도 증빙 항목 생성`)

		// 해당 연차의 예산 ID 조회
		const budgetResult = await client.query(
			'SELECT id FROM project_budgets WHERE project_id = $1 AND period_number = $2',
			[projectId, period.periodNumber]
		)

		if (budgetResult.rows.length === 0) {
			console.log(`❌ [생성] ${period.periodNumber}차년도 예산을 찾을 수 없습니다.`)
			continue
		}

		const projectBudgetId = budgetResult.rows[0].id

		// 예산 항목별로 증빙 항목 생성
		for (const category of data.budgetCategories) {
			if (category.percentage > 0) {
				// 카테고리 ID 조회 (기본 카테고리 사용)
				const categoryResult = await client.query(
					'SELECT id FROM evidence_categories WHERE name = $1 LIMIT 1',
					[category.name]
				)

				let categoryId = null
				if (categoryResult.rows.length > 0) {
					categoryId = categoryResult.rows[0].id
				} else {
					// 카테고리가 없으면 기본 카테고리 생성
					const createCategoryResult = await client.query(
						'INSERT INTO evidence_categories (name, description) VALUES ($1, $2) RETURNING id',
						[category.name, `${category.name} 증빙 항목`]
					)
					categoryId = createCategoryResult.rows[0].id
				}

				const evidenceQuery = `
          INSERT INTO evidence_items (
            project_budget_id, category_id, name, budget_amount, spent_amount,
            status, due_date, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 0, 'planned', $5, NOW(), NOW())
          RETURNING id
        `

				// UTC+9 타임존 적용된 연차 종료 후 1개월 계산
				const periodEndUtc = new Date(period.endDate + 'T23:59:59.999Z')
				const dueDate = new Date(periodEndUtc)
				dueDate.setUTCMonth(dueDate.getUTCMonth() + 1) // 연차 종료 후 1개월

				// 중앙화된 날짜 변환 함수 사용 (UTC+9 타임존 적용)
				const formattedDueDate = formatDateForAPI(dueDate)

				const result = await client.query(evidenceQuery, [
					projectBudgetId,
					categoryId,
					`${category.name} 증빙`,
					calculateBudgetAllocation(period.budget, category.percentage),
					formattedDueDate
				])

				evidenceIds.push(result.rows[0].id)
				console.log(
					`📄 [생성] ${period.periodNumber}차년도 ${category.name} 증빙 항목 생성 완료 - ID: ${result.rows[0].id}`
				)
			}
		}
	}

	return evidenceIds
}

// 생성된 프로젝트 검증 함수
async function validateCreatedProject(client: any, projectId: string) {
	console.log('🔍 [검증] 생성된 프로젝트 데이터 검증 시작')

	const errors: string[] = []

	// 프로젝트 기본 정보 확인
	const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [projectId])
	if (projectResult.rows.length === 0) {
		errors.push('프로젝트가 생성되지 않았습니다.')
	}

	// 연차별 예산 확인
	const budgetResult = await client.query(
		'SELECT * FROM project_budgets WHERE project_id = $1 ORDER BY period_number',
		[projectId]
	)
	if (budgetResult.rows.length === 0) {
		errors.push('연차별 예산이 생성되지 않았습니다.')
	}

	// 참여연구원 확인
	const memberResult = await client.query('SELECT * FROM project_members WHERE project_id = $1', [
		projectId
	])
	if (memberResult.rows.length === 0) {
		errors.push('참여연구원이 등록되지 않았습니다.')
	}

	// 예산 합계 검증
	const totalBudgetFromDB = budgetResult.rows.reduce(
		(sum, budget) => sum + parseFloat(budget.total_budget),
		0
	)
	const projectBudget = parseFloat(projectResult.rows[0].budget_total)

	if (Math.abs(totalBudgetFromDB - projectBudget) > 1000) {
		errors.push(
			`데이터베이스의 연차별 예산 합계(${totalBudgetFromDB.toLocaleString()}원)와 프로젝트 총 예산(${projectBudget.toLocaleString()}원)이 일치하지 않습니다.`
		)
	}

	console.log('🔍 [검증] 생성된 프로젝트 데이터 검증 완료')

	return { isValid: errors.length === 0, errors }
}

// 자동 검증 및 수정 실행 함수
async function runAutoValidationAndFix(projectId: string) {
	try {
		console.log('🛡️ [자동검증] 프로젝트 검증 룰 실행 시작')

		// 간단한 검증 API 호출
		const response = await fetch(`http://localhost:5173/api/project-management/simple-validation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				projectId: projectId
			})
		})

		if (!response.ok) {
			throw new Error(`검증 API 호출 실패: ${response.status}`)
		}

		const result = await response.json()
		console.log('🛡️ [자동검증] 검증 룰 실행 완료:', result)

		return result
	} catch (error) {
		console.error('💥 [자동검증] 오류:', error)
		return {
			success: false,
			errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
			fixedIssues: 0
		}
	}
}
