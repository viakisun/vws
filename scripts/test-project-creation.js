import { Pool } from 'pg'

const pool = new Pool({
	host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
	port: 5432,
	database: 'postgres',
	user: 'postgres',
	password: 'viahubdev',
	ssl: { rejectUnauthorized: false }
})

// 테스트용 프로젝트 데이터
const testProjectData = {
	name: 'RND-VR2024 테스트 프로젝트',
	description: 'VR 기술 개발을 위한 테스트 프로젝트입니다.',
	startDate: '2024-04-01',
	endDate: '2026-03-31',
	totalBudget: 400000000, // 4억원
	annualPeriods: [
		{
			periodNumber: 1,
			startDate: '2024-04-01',
			endDate: '2025-03-31',
			budget: 200000000 // 2억원
		},
		{
			periodNumber: 2,
			startDate: '2025-04-01',
			endDate: '2026-03-31',
			budget: 200000000 // 2억원
		}
	],
	budgetCategories: [
		{ name: '인건비', percentage: 40 },
		{ name: '재료비', percentage: 30 },
		{ name: '연구활동비', percentage: 20 },
		{ name: '간접비', percentage: 10 }
	],
	members: [
		{
			employeeId: '8edea9ec-1187-4742-a1ae-df2f143cf8eb', // 예원 정
			role: '프로젝트매니저',
			participationRate: 30,
			monthlyAmount: 5000000, // 500만원
			startDate: '2024-04-01',
			endDate: '2026-03-31'
		},
		{
			employeeId: 'eed202f6-fcb3-4db4-8e18-6b102df87809', // 형일 박
			role: '선임연구원',
			participationRate: 40,
			monthlyAmount: 4000000, // 400만원
			startDate: '2024-04-01',
			endDate: '2025-12-31'
		},
		{
			employeeId: '65a78743-cc04-442d-8943-173c14260c17', // 기선 박
			role: '연구원',
			participationRate: 30,
			monthlyAmount: 3000000, // 300만원
			startDate: '2024-04-01',
			endDate: '2026-03-31'
		}
	],
	evidenceSettings: {
		autoGenerate: true,
		namingConvention: '{name}({year}-{month})'
	}
}

async function testProjectCreation() {
	console.log('🧪 [테스트] 프로젝트 생성 로직 테스트 시작')
	console.log('📋 [테스트] 테스트 데이터:', JSON.stringify(testProjectData, null, 2))

	try {
		// 1단계: 입력 데이터 검증 테스트
		console.log('\n🔍 [1단계] 입력 데이터 검증 테스트')
		const validationResult = await validateProjectData(testProjectData)
		console.log('✅ [1단계] 검증 결과:', validationResult)

		if (!validationResult.isValid) {
			console.log('❌ [1단계] 검증 실패로 테스트 중단')
			return
		}

		// 2단계: 프로젝트 생성 테스트
		console.log('\n📝 [2단계] 프로젝트 생성 테스트')
		const projectId = await createProject(testProjectData)
		console.log('✅ [2단계] 프로젝트 생성 완료 - ID:', projectId)

		// 3단계: 연차별 예산 생성 테스트
		console.log('\n💰 [3단계] 연차별 예산 생성 테스트')
		const budgetIds = await createProjectBudgets(projectId, testProjectData)
		console.log('✅ [3단계] 연차별 예산 생성 완료 - IDs:', budgetIds)

		// 4단계: 참여연구원 생성 테스트
		console.log('\n👥 [4단계] 참여연구원 생성 테스트')
		const memberIds = await createProjectMembers(projectId, testProjectData)
		console.log('✅ [4단계] 참여연구원 생성 완료 - IDs:', memberIds)

		// 5단계: 증빙 항목 자동 생성 테스트
		console.log('\n📄 [5단계] 증빙 항목 자동 생성 테스트')
		const evidenceIds = await createEvidenceItems(projectId, testProjectData)
		console.log('✅ [5단계] 증빙 항목 자동 생성 완료 - IDs:', evidenceIds)

		// 6단계: 생성된 데이터 검증 테스트
		console.log('\n🔍 [6단계] 생성된 데이터 검증 테스트')
		const finalValidation = await validateCreatedProject(projectId)
		console.log('✅ [6단계] 최종 검증 결과:', finalValidation)

		// 7단계: 생성된 데이터 확인
		console.log('\n📊 [7단계] 생성된 데이터 확인')
		await displayCreatedData(projectId)

		console.log('\n🎉 [완료] 프로젝트 생성 로직 테스트 성공!')
	} catch (error) {
		console.error('💥 [오류] 테스트 중 오류 발생:', error)
	} finally {
		await pool.end()
	}
}

// 입력 데이터 검증 함수
async function validateProjectData(data) {
	console.log('🔍 [검증] 프로젝트 기본 정보 검증')
	const errors = []

	if (!data.name || data.name.trim().length === 0) {
		errors.push('프로젝트명은 필수입니다.')
	}

	if (!data.startDate || !data.endDate) {
		errors.push('프로젝트 시작일과 종료일은 필수입니다.')
	}

	if (new Date(data.startDate) >= new Date(data.endDate)) {
		errors.push('프로젝트 종료일은 시작일보다 늦어야 합니다.')
	}

	console.log('🔍 [검증] 연차별 예산 검증')
	if (!data.annualPeriods || data.annualPeriods.length === 0) {
		errors.push('연차별 예산 정보는 필수입니다.')
	}

	// 연차별 예산 합계 검증
	const totalBudgetFromPeriods = data.annualPeriods.reduce((sum, period) => sum + period.budget, 0)
	if (Math.abs(totalBudgetFromPeriods - data.totalBudget) > 1000) {
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
		const periodMembers = data.members.filter(
			member =>
				new Date(member.startDate) <= new Date(period.endDate) &&
				new Date(member.endDate) >= new Date(period.startDate)
		)

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
async function createProject(data) {
	console.log('📝 [생성] 프로젝트 기본 정보 삽입')

	const projectQuery = `
    INSERT INTO projects (
      code, title, description, start_date, end_date, budget_total, 
      status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
    RETURNING id
  `

	const result = await pool.query(projectQuery, [
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
async function createProjectBudgets(projectId, data) {
	console.log('💰 [생성] 연차별 예산 삽입 시작')

	const budgetIds = []

	for (const period of data.annualPeriods) {
		console.log(`💰 [생성] ${period.periodNumber}차년도 예산 생성`)

		// 예산 항목별 배분 계산
		const personnelCost = Math.round(
			(period.budget * (data.budgetCategories.find(c => c.name === '인건비')?.percentage || 0)) /
				100
		)
		const materialCost = Math.round(
			(period.budget * (data.budgetCategories.find(c => c.name === '재료비')?.percentage || 0)) /
				100
		)
		const activityCost = Math.round(
			(period.budget *
				(data.budgetCategories.find(c => c.name === '연구활동비')?.percentage || 0)) /
				100
		)
		const indirectCost = Math.round(
			(period.budget * (data.budgetCategories.find(c => c.name === '간접비')?.percentage || 0)) /
				100
		)

		const budgetQuery = `
      INSERT INTO project_budgets (
        project_id, fiscal_year, period_number, start_date, end_date, total_budget,
        personnel_cost, research_material_cost, research_activity_cost, indirect_cost,
        spent_amount, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, NOW(), NOW())
      RETURNING id
    `

		// fiscal_year는 시작일의 연도로 설정
		const fiscalYear = new Date(period.startDate).getFullYear()

		const result = await pool.query(budgetQuery, [
			projectId,
			fiscalYear,
			period.periodNumber,
			period.startDate,
			period.endDate,
			period.budget,
			personnelCost,
			materialCost,
			activityCost,
			indirectCost
		])

		budgetIds.push(result.rows[0].id)
		console.log(`💰 [생성] ${period.periodNumber}차년도 예산 생성 완료 - ID: ${result.rows[0].id}`)
	}

	return budgetIds
}

// 참여연구원 생성 함수
async function createProjectMembers(projectId, data) {
	console.log('👥 [생성] 참여연구원 삽입 시작')

	const memberIds = []

	for (const member of data.members) {
		console.log(`👥 [생성] 참여연구원 ${member.employeeId} 등록`)

		const memberQuery = `
      INSERT INTO project_members (
        project_id, employee_id, role, participation_rate, monthly_amount,
        start_date, end_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `

		const result = await pool.query(memberQuery, [
			projectId,
			member.employeeId,
			member.role,
			member.participationRate,
			member.monthlyAmount,
			member.startDate,
			member.endDate
		])

		memberIds.push(result.rows[0].id)
		console.log(`👥 [생성] 참여연구원 ${member.employeeId} 등록 완료 - ID: ${result.rows[0].id}`)
	}

	return memberIds
}

// 증빙 항목 자동 생성 함수
async function createEvidenceItems(projectId, data) {
	console.log('📄 [생성] 증빙 항목 자동 생성 시작')

	const evidenceIds = []

	// 각 연차별로 증빙 항목 생성
	for (const period of data.annualPeriods) {
		console.log(`📄 [생성] ${period.periodNumber}차년도 증빙 항목 생성`)

		// 해당 연차의 예산 ID 조회
		const budgetResult = await pool.query(
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
				const categoryResult = await pool.query(
					'SELECT id FROM evidence_categories WHERE name = $1 LIMIT 1',
					[category.name]
				)

				let categoryId = null
				if (categoryResult.rows.length > 0) {
					categoryId = categoryResult.rows[0].id
				} else {
					// 카테고리가 없으면 기본 카테고리 생성
					const createCategoryResult = await pool.query(
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

				const dueDate = new Date(period.endDate)
				dueDate.setMonth(dueDate.getMonth() + 1) // 연차 종료 후 1개월

				const result = await pool.query(evidenceQuery, [
					projectBudgetId,
					categoryId,
					`${category.name} 증빙`,
					Math.round((period.budget * category.percentage) / 100),
					dueDate.toISOString().split('T')[0]
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
async function validateCreatedProject(projectId) {
	console.log('🔍 [검증] 생성된 프로젝트 데이터 검증 시작')

	const errors = []

	// 프로젝트 기본 정보 확인
	const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId])
	if (projectResult.rows.length === 0) {
		errors.push('프로젝트가 생성되지 않았습니다.')
	}

	// 연차별 예산 확인
	const budgetResult = await pool.query(
		'SELECT * FROM project_budgets WHERE project_id = $1 ORDER BY period_number',
		[projectId]
	)
	if (budgetResult.rows.length === 0) {
		errors.push('연차별 예산이 생성되지 않았습니다.')
	}

	// 참여연구원 확인
	const memberResult = await pool.query('SELECT * FROM project_members WHERE project_id = $1', [
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

// 생성된 데이터 표시 함수
async function displayCreatedData(projectId) {
	console.log('📊 [확인] 생성된 프로젝트 데이터 표시')

	// 프로젝트 기본 정보
	const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId])
	if (projectResult.rows.length > 0) {
		const project = projectResult.rows[0]
		console.log(
			`📊 [확인] 프로젝트: ${project.title} (${project.start_date} ~ ${project.end_date})`
		)
		console.log(`📊 [확인] 총 예산: ${parseInt(project.budget_total).toLocaleString()}원`)
	}

	// 연차별 예산
	const budgetResult = await pool.query(
		'SELECT * FROM project_budgets WHERE project_id = $1 ORDER BY period_number',
		[projectId]
	)
	console.log(`📊 [확인] 연차별 예산 (${budgetResult.rows.length}개):`)
	budgetResult.rows.forEach(budget => {
		console.log(
			`  - ${budget.period_number}차년도: ${parseInt(budget.total_budget).toLocaleString()}원`
		)
		console.log(`    인건비: ${parseInt(budget.personnel_cost).toLocaleString()}원`)
		console.log(`    재료비: ${parseInt(budget.research_material_cost).toLocaleString()}원`)
		console.log(`    연구활동비: ${parseInt(budget.research_activity_cost).toLocaleString()}원`)
		console.log(`    간접비: ${parseInt(budget.indirect_cost).toLocaleString()}원`)
	})

	// 참여연구원
	const memberResult = await pool.query('SELECT * FROM project_members WHERE project_id = $1', [
		projectId
	])
	console.log(`📊 [확인] 참여연구원 (${memberResult.rows.length}명):`)
	memberResult.rows.forEach(member => {
		console.log(
			`  - ${member.employee_id} (${member.role}): ${member.participation_rate}% - ${parseInt(member.monthly_amount).toLocaleString()}원/월`
		)
	})

	// 증빙 항목
	const evidenceResult = await pool.query(
		`
    SELECT ei.*, ec.name as category_name, pb.period_number
    FROM evidence_items ei
    JOIN evidence_categories ec ON ei.category_id = ec.id
    JOIN project_budgets pb ON ei.project_budget_id = pb.id
    WHERE pb.project_id = $1
    ORDER BY pb.period_number, ec.name
  `,
		[projectId]
	)
	console.log(`📊 [확인] 증빙 항목 (${evidenceResult.rows.length}개):`)
	evidenceResult.rows.forEach(evidence => {
		console.log(
			`  - ${evidence.period_number}차년도 ${evidence.category_name}: ${parseInt(evidence.budget_amount).toLocaleString()}원 (${evidence.due_date})`
		)
	})
}

// 테스트 실행
testProjectCreation()
