// 프로젝트 연차별 예산 관리 API

import { query } from '$lib/database/connection.js'
import type { AnnualBudget, AnnualBudgetFormData, BudgetSummary } from '$lib/types/project-budget'
import { toUTC } from '$lib/utils/date-handler.js'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: 프로젝트의 연차별 예산 조회
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { projectId } = params

		// 테이블 존재 확인 및 생성
		try {
			await query(`
				CREATE TABLE IF NOT EXISTS project_annual_budgets (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
					year INTEGER NOT NULL CHECK (year > 0),
					start_date DATE,
					end_date DATE,
					government_funding DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (government_funding >= 0),
					company_cash DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (company_cash >= 0),
					company_in_kind DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (company_in_kind >= 0),
					status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'completed')),
					notes TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					UNIQUE(project_id, year),
					CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
				)
			`)
		} catch (tableError) {
			console.log('테이블이 이미 존재하거나 생성 중 오류:', tableError)
		}

		// 연차별 예산 조회
		const budgetResult = await query(
			`
			SELECT 
				id, project_id, year, start_date, end_date,
				government_funding, company_cash, company_in_kind,
				status, notes, created_at, updated_at
			FROM project_annual_budgets 
			WHERE project_id = $1 
			ORDER BY year ASC
			`,
			[projectId]
		)

		// 예산 요약 계산
		let summary: BudgetSummary | null = null
		if (budgetResult.rows.length > 0) {
			const totalGovernmentFunding = budgetResult.rows.reduce(
				(sum, row) => sum + parseFloat(row.government_funding || 0),
				0
			)
			const totalCompanyCash = budgetResult.rows.reduce(
				(sum, row) => sum + parseFloat(row.company_cash || 0),
				0
			)
			const totalCompanyInKind = budgetResult.rows.reduce(
				(sum, row) => sum + parseFloat(row.company_in_kind || 0),
				0
			)
			const totalCash = totalGovernmentFunding + totalCompanyCash
			const totalInKind = totalCompanyInKind
			const totalBudget = totalCash + totalInKind

			summary = {
				projectId,
				totalYears: budgetResult.rows.length,
				totalBudget,
				totalGovernmentFunding,
				totalCompanyCash,
				totalCompanyInKind,
				totalCash,
				totalInKind,
				governmentFundingRatio: totalBudget > 0 ? (totalGovernmentFunding / totalBudget) * 100 : 0,
				companyBurdenRatio:
					totalBudget > 0 ? ((totalCompanyCash + totalCompanyInKind) / totalBudget) * 100 : 0,
				cashRatio: totalBudget > 0 ? (totalCash / totalBudget) * 100 : 0,
				inKindRatio: totalBudget > 0 ? (totalInKind / totalBudget) * 100 : 0
			}
		}

		const budgets: AnnualBudget[] = budgetResult.rows.map(row => {
			const governmentFunding = parseFloat(row.government_funding || 0)
			const companyCash = parseFloat(row.company_cash || 0)
			const companyInKind = parseFloat(row.company_in_kind || 0)

			return {
				id: row.id,
				projectId: row.project_id,
				year: row.year,
				startDate: row.start_date,
				endDate: row.end_date,
				governmentFunding,
				companyCash,
				companyInKind,
				totalCash: governmentFunding + companyCash,
				totalInKind: companyInKind,
				yearlyTotal: governmentFunding + companyCash + companyInKind,
				status: row.status,
				notes: row.notes,
				createdAt: row.created_at,
				updatedAt: row.updated_at
			}
		})

		return json({
			success: true,
			data: {
				budgets,
				summary
			}
		})
	} catch (error) {
		console.error('연차별 예산 조회 실패:', error)
		return json(
			{
				success: false,
				error: '연차별 예산을 조회하는데 실패했습니다.',
				details: error instanceof Error ? error.message : '알 수 없는 오류'
			},
			{ status: 500 }
		)
	}
}

// POST: 연차별 예산 저장/업데이트
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { projectId } = params
		const {
			budgets,
			projectPeriod
		}: {
			budgets: AnnualBudgetFormData[]
			projectPeriod?: { startDate: string | null; endDate: string | null }
		} = await request.json()

		// 입력 검증
		if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {
			return json(
				{
					success: false,
					error: '예산 데이터가 필요합니다.'
				},
				{ status: 400 }
			)
		}

		// 테이블 존재 확인 및 생성
		try {
			await query(`
				CREATE TABLE IF NOT EXISTS project_annual_budgets (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
					year INTEGER NOT NULL CHECK (year > 0),
					start_date DATE,
					end_date DATE,
					government_funding DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (government_funding >= 0),
					company_cash DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (company_cash >= 0),
					company_in_kind DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (company_in_kind >= 0),
					status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'completed')),
					notes TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					UNIQUE(project_id, year),
					CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
				)
			`)
		} catch (tableError) {
			console.log('테이블이 이미 존재하거나 생성 중 오류:', tableError)
		}

		// 프로젝트 존재 확인
		const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [projectId])
		if (projectCheck.rows.length === 0) {
			return json(
				{
					success: false,
					error: '프로젝트를 찾을 수 없습니다.'
				},
				{ status: 404 }
			)
		}

		// 트랜잭션으로 처리
		await query('BEGIN')

		try {
			// 기존 예산 데이터 삭제
			await query('DELETE FROM project_annual_budgets WHERE project_id = $1', [projectId])

			// 새 예산 데이터 삽입
			for (const budget of budgets) {
				await query(
					`
					INSERT INTO project_annual_budgets (
						project_id, year, start_date, end_date,
						government_funding, company_cash, company_in_kind,
						status, notes
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
					`,
					[
						projectId,
						budget.year,
						budget.startDate ? toUTC(budget.startDate) : null,
						budget.endDate ? toUTC(budget.endDate) : null,
						budget.governmentFunding || 0,
						budget.companyCash || 0,
						budget.companyInKind || 0,
						'draft', // 기본 상태
						budget.notes || null
					]
				)
			}

			// 전체 사업 기간 업데이트 (UTC 기준)
			if (projectPeriod && projectPeriod.startDate && projectPeriod.endDate) {
				await query(
					`
					UPDATE projects 
					SET start_date = $2, end_date = $3, updated_at = CURRENT_TIMESTAMP
					WHERE id = $1
					`,
					[projectId, toUTC(projectPeriod.startDate), toUTC(projectPeriod.endDate)]
				)
			}

			await query('COMMIT')

			// 저장된 데이터 조회하여 반환
			const savedResult = await query(
				`
				SELECT 
					id, project_id, year, start_date, end_date,
					government_funding, company_cash, company_in_kind,
					status, notes, created_at, updated_at
				FROM project_annual_budgets 
				WHERE project_id = $1 
				ORDER BY year ASC
				`,
				[projectId]
			)

			const savedBudgets: AnnualBudget[] = savedResult.rows.map(row => {
				const governmentFunding = parseFloat(row.government_funding || 0)
				const companyCash = parseFloat(row.company_cash || 0)
				const companyInKind = parseFloat(row.company_in_kind || 0)

				return {
					id: row.id,
					projectId: row.project_id,
					year: row.year,
					startDate: row.start_date,
					endDate: row.end_date,
					governmentFunding,
					companyCash,
					companyInKind,
					totalCash: governmentFunding + companyCash,
					totalInKind: companyInKind,
					yearlyTotal: governmentFunding + companyCash + companyInKind,
					status: row.status,
					notes: row.notes,
					createdAt: row.created_at,
					updatedAt: row.updated_at
				}
			})

			return json({
				success: true,
				data: savedBudgets,
				message: '연차별 예산이 성공적으로 저장되었습니다.'
			})
		} catch (error) {
			await query('ROLLBACK')
			throw error
		}
	} catch (error) {
		console.error('연차별 예산 저장 실패:', error)
		return json(
			{
				success: false,
				error: '연차별 예산 저장에 실패했습니다.',
				details: error instanceof Error ? error.message : '알 수 없는 오류'
			},
			{ status: 500 }
		)
	}
}

// PUT: 특정 연차 예산 업데이트
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { projectId } = params
		const { year, budgetData }: { year: number; budgetData: AnnualBudgetFormData } =
			await request.json()

		// 입력 검증
		if (!year || !budgetData) {
			return json(
				{
					success: false,
					error: '연차와 예산 데이터가 필요합니다.'
				},
				{ status: 400 }
			)
		}

		// 예산 업데이트
		const result = await query(
			`
			UPDATE project_annual_budgets SET
				start_date = $3,
				end_date = $4,
				government_funding = $5,
				company_cash = $6,
				company_in_kind = $7,
				notes = $8,
				updated_at = CURRENT_TIMESTAMP
			WHERE project_id = $1 AND year = $2
			RETURNING *
			`,
			[
				projectId,
				year,
				budgetData.startDate ? toUTC(budgetData.startDate) : null,
				budgetData.endDate ? toUTC(budgetData.endDate) : null,
				budgetData.governmentFunding || 0,
				budgetData.companyCash || 0,
				budgetData.companyInKind || 0,
				budgetData.notes || null
			]
		)

		if (result.rows.length === 0) {
			return json(
				{
					success: false,
					error: '해당 연차의 예산을 찾을 수 없습니다.'
				},
				{ status: 404 }
			)
		}

		const row = result.rows[0]
		const governmentFunding = parseFloat(row.government_funding || 0)
		const companyCash = parseFloat(row.company_cash || 0)
		const companyInKind = parseFloat(row.company_in_kind || 0)

		const updatedBudget: AnnualBudget = {
			id: row.id,
			projectId: row.project_id,
			year: row.year,
			startDate: row.start_date,
			endDate: row.end_date,
			governmentFunding,
			companyCash,
			companyInKind,
			totalCash: governmentFunding + companyCash,
			totalInKind: companyInKind,
			yearlyTotal: governmentFunding + companyCash + companyInKind,
			status: row.status,
			notes: row.notes,
			createdAt: row.created_at,
			updatedAt: row.updated_at
		}

		return json({
			success: true,
			data: updatedBudget,
			message: `${year}차년도 예산이 성공적으로 업데이트되었습니다.`
		})
	} catch (error) {
		console.error('연차별 예산 업데이트 실패:', error)
		return json(
			{
				success: false,
				error: '연차별 예산 업데이트에 실패했습니다.',
				details: error instanceof Error ? error.message : '알 수 없는 오류'
			},
			{ status: 500 }
		)
	}
}
