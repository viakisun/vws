import path from 'path'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const dbConfig = {
	host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
	port: 5432,
	database: 'postgres',
	user: 'postgres',
	password: 'viahubdev',
	ssl: {
		rejectUnauthorized: false
	}
}

async function createTestEvidenceData() {
	const pool = new Pool(dbConfig)

	try {
		console.log('테스트 증빙 데이터 생성 중...')

		// 1. 프로젝트 예산 조회
		const budgetResult = await pool.query(`
            SELECT pb.id, pb.period_number, pb.fiscal_year, p.title as project_title
            FROM project_budgets pb
            JOIN projects p ON pb.project_id = p.id
            ORDER BY pb.created_at DESC
            LIMIT 1
        `)

		if (budgetResult.rows.length === 0) {
			console.log('❌ 프로젝트 예산이 없습니다. 먼저 프로젝트와 예산을 생성해주세요.')
			return
		}

		const budget = budgetResult.rows[0]
		console.log(`프로젝트 예산 발견: ${budget.project_title} - ${budget.period_number}연차`)

		// 2. 증빙 카테고리 조회
		const categoriesResult = await pool.query('SELECT * FROM evidence_categories ORDER BY name')
		const categories = categoriesResult.rows
		console.log(`증빙 카테고리: ${categories.map(c => c.name).join(', ')}`)

		// 3. 직원 조회
		const employeesResult = await pool.query(
			'SELECT id, first_name, last_name FROM employees LIMIT 5'
		)
		const employees = employeesResult.rows
		console.log(`직원: ${employees.map(e => `${e.first_name} ${e.last_name}`).join(', ')}`)

		// 4. 테스트 증빙 항목 생성
		const testEvidenceItems = [
			// 인건비
			{
				category_id: categories.find(c => c.name === '인건비')?.id,
				name: '박기선 (2025-01)',
				description: '2025년 1월 급여',
				budget_amount: 5000000,
				assignee_id: employees[0]?.id,
				assignee_name: employees[0]
					? `${employees[0].first_name} ${employees[0].last_name}`
					: '박기선',
				progress: 100,
				status: 'completed',
				due_date: '2025-01-31'
			},
			{
				category_id: categories.find(c => c.name === '인건비')?.id,
				name: '박기선 (2025-02)',
				description: '2025년 2월 급여',
				budget_amount: 5000000,
				assignee_id: employees[0]?.id,
				assignee_name: employees[0]
					? `${employees[0].first_name} ${employees[0].last_name}`
					: '박기선',
				progress: 100,
				status: 'completed',
				due_date: '2025-02-28'
			},
			{
				category_id: categories.find(c => c.name === '인건비')?.id,
				name: '박기선 (2025-03)',
				description: '2025년 3월 급여',
				budget_amount: 5000000,
				assignee_id: employees[0]?.id,
				assignee_name: employees[0]
					? `${employees[0].first_name} ${employees[0].last_name}`
					: '박기선',
				progress: 75,
				status: 'in_progress',
				due_date: '2025-03-31'
			},
			// 연구재료비
			{
				category_id: categories.find(c => c.name === '연구재료비')?.id,
				name: '모터 10개',
				description: '드론용 모터 구매',
				budget_amount: 1000000,
				assignee_id: employees[1]?.id,
				assignee_name: employees[1]
					? `${employees[1].first_name} ${employees[1].last_name}`
					: '최시용',
				progress: 100,
				status: 'completed',
				due_date: '2025-02-15'
			},
			{
				category_id: categories.find(c => c.name === '연구재료비')?.id,
				name: '프로펠러 20개',
				description: '드론용 프로펠러 구매',
				budget_amount: 2000000,
				assignee_id: employees[1]?.id,
				assignee_name: employees[1]
					? `${employees[1].first_name} ${employees[1].last_name}`
					: '최시용',
				progress: 50,
				status: 'in_progress',
				due_date: '2025-03-15'
			},
			// 연구활동비
			{
				category_id: categories.find(c => c.name === '연구활동비')?.id,
				name: '출장비 (국내)',
				description: '국내 연구회의 참석',
				budget_amount: 800000,
				assignee_id: employees[0]?.id,
				assignee_name: employees[0]
					? `${employees[0].first_name} ${employees[0].last_name}`
					: '박기선',
				progress: 25,
				status: 'in_progress',
				due_date: '2025-03-30'
			},
			{
				category_id: categories.find(c => c.name === '연구활동비')?.id,
				name: '외주용역비 (분석)',
				description: '데이터 분석 외주',
				budget_amount: 2000000,
				assignee_id: employees[0]?.id,
				assignee_name: employees[0]
					? `${employees[0].first_name} ${employees[0].last_name}`
					: '박기선',
				progress: 60,
				status: 'in_progress',
				due_date: '2025-04-15'
			},
			// 간접비
			{
				category_id: categories.find(c => c.name === '간접비')?.id,
				name: '특허출원 (발명1)',
				description: '드론 제어 알고리즘 특허',
				budget_amount: 500000,
				assignee_id: employees[0]?.id,
				assignee_name: employees[0]
					? `${employees[0].first_name} ${employees[0].last_name}`
					: '박기선',
				progress: 80,
				status: 'in_progress',
				due_date: '2025-03-20'
			}
		]

		// 증빙 항목 생성
		for (const item of testEvidenceItems) {
			if (!item.category_id) continue

			const result = await pool.query(
				`
                INSERT INTO evidence_items (
                    project_budget_id, category_id, name, description, budget_amount,
                    assignee_id, assignee_name, progress, status, due_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, name
            `,
				[
					budget.id,
					item.category_id,
					item.name,
					item.description,
					item.budget_amount,
					item.assignee_id,
					item.assignee_name,
					item.progress,
					item.status,
					item.due_date
				]
			)

			console.log(`✅ 증빙 항목 생성: ${result.rows[0].name}`)
		}

		// 5. 테스트 증빙 서류 생성
		const evidenceItemsResult = await pool.query(
			`
            SELECT ei.id, ei.name, ei.category_id, ec.name as category_name
            FROM evidence_items ei
            JOIN evidence_categories ec ON ei.category_id = ec.id
            WHERE ei.project_budget_id = $1
        `,
			[budget.id]
		)

		const testDocuments = [
			{ type: '급여명세서', name: '2025년 1월 급여명세서.pdf' },
			{ type: '이체확인증', name: '급여이체확인증_202501.pdf' },
			{ type: '구매계약서', name: '모터구매계약서.pdf' },
			{ type: '세금계산서', name: '세금계산서_모터.pdf' },
			{ type: '출장신청서', name: '출장신청서_연구회의.pdf' },
			{ type: '용역계약서', name: '데이터분석용역계약서.pdf' },
			{ type: '특허출원서', name: '특허출원서_드론제어.pdf' }
		]

		for (const item of evidenceItemsResult.rows) {
			const relevantDocs = testDocuments.filter(doc => {
				if (item.category_name === '인건비') {
					return doc.type === '급여명세서' || doc.type === '이체확인증'
				} else if (item.category_name === '연구재료비') {
					return doc.type === '구매계약서' || doc.type === '세금계산서'
				} else if (item.category_name === '연구활동비') {
					return doc.type === '출장신청서' || doc.type === '용역계약서'
				} else if (item.category_name === '간접비') {
					return doc.type === '특허출원서'
				}
				return false
			})

			for (const doc of relevantDocs) {
				await pool.query(
					`
                    INSERT INTO evidence_documents (
                        evidence_item_id, document_type, document_name, file_path, 
                        file_size, mime_type, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
					[
						item.id,
						doc.type,
						doc.name,
						`/uploads/evidence/${doc.name}`,
						1024000, // 1MB
						'application/pdf',
						Math.random() > 0.5 ? 'approved' : 'uploaded'
					]
				)
			}
		}

		console.log('✅ 테스트 증빙 서류 생성 완료')

		// 6. 테스트 일정 생성
		for (const item of evidenceItemsResult.rows) {
			const schedules = [
				{
					task_name: '서류 준비',
					description: '필수 서류 수집 및 정리',
					due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
					priority: 'high'
				},
				{
					task_name: '검토 및 승인',
					description: '서류 검토 및 최종 승인',
					due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일 후
					priority: 'medium'
				}
			]

			for (const schedule of schedules) {
				await pool.query(
					`
                    INSERT INTO evidence_schedules (
                        evidence_item_id, task_name, description, due_date, priority, status
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `,
					[
						item.id,
						schedule.task_name,
						schedule.description,
						schedule.due_date,
						schedule.priority,
						Math.random() > 0.7 ? 'completed' : 'pending'
					]
				)
			}
		}

		console.log('✅ 테스트 일정 생성 완료')

		// 7. 결과 확인
		const finalResult = await pool.query(
			`
            SELECT 
                ec.name as category_name,
                COUNT(ei.id) as item_count,
                COUNT(ed.id) as document_count,
                COUNT(es.id) as schedule_count
            FROM evidence_categories ec
            LEFT JOIN evidence_items ei ON ec.id = ei.category_id AND ei.project_budget_id = $1
            LEFT JOIN evidence_documents ed ON ei.id = ed.evidence_item_id
            LEFT JOIN evidence_schedules es ON ei.id = es.evidence_item_id
            GROUP BY ec.id, ec.name
            ORDER BY ec.name
        `,
			[budget.id]
		)

		console.log('\n📊 생성된 테스트 데이터 요약:')
		finalResult.rows.forEach(row => {
			console.log(
				`${row.category_name}: ${row.item_count}개 항목, ${row.document_count}개 서류, ${row.schedule_count}개 일정`
			)
		})
	} catch (error) {
		console.error('❌ 테스트 데이터 생성 중 오류 발생:', error)
		throw error
	} finally {
		await pool.end()
	}
}

// 실행
createTestEvidenceData()
	.then(() => {
		console.log('\n🎉 테스트 증빙 데이터 생성이 완료되었습니다!')
		process.exit(0)
	})
	.catch(error => {
		console.error('생성 실패:', error)
		process.exit(1)
	})

