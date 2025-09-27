import { query } from '$lib/database/connection'
import type { ApiResponse, DatabaseProjectBudget } from '$lib/types/database'
import type { AnnualBudget, AnnualBudgetFormData, BudgetSummary } from '$lib/types/project-budget'
import { formatDateForDisplay, toUTC } from '$lib/utils/date-handler'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: 연차별 예산 조회 (project_budgets 테이블 사용)
export const GET: RequestHandler = async ({ params }) => {
  try {
    const { projectId } = params

    // project_budgets 테이블에서 연차별 예산 조회 (연차별 예산용 칼럼 사용)
    const budgetResult = await query(
      `
			SELECT 
				id, project_id, period_number, start_date, end_date,
				government_funding_amount, company_cash_amount, company_in_kind_amount,
				created_at, updated_at
			FROM project_budgets 
			WHERE project_id = $1 
			ORDER BY period_number
			`,
      [projectId],
    )

    // 데이터 변환 및 처리 (연차별 예산용 칼럼 사용)
    const budgetData: DatabaseProjectBudget[] = budgetResult.rows
    const budgets: AnnualBudget[] = budgetData.map((row) => {
      // 연차별 예산용 칼럼에서 직접 가져오기
      const governmentFunding = parseFloat(row.government_funding_amount) || 0
      const companyCash = parseFloat(row.company_cash_amount) || 0
      const companyInKind = parseFloat(row.company_in_kind_amount) || 0

      // 총 현금/현물 계산
      const totalCash = governmentFunding + companyCash // 정부지원금 + 기업부담금 현금
      const totalInKind = companyInKind // 기업부담금 현물
      const yearlyTotal = totalCash + totalInKind

      return {
        id: row.id,
        projectId: row.project_id,
        year: row.period_number, // period_number만 사용
        startDate: row.start_date ? formatDateForDisplay(row.start_date, 'ISO') : undefined,
        endDate: row.end_date ? formatDateForDisplay(row.end_date, 'ISO') : undefined,
        governmentFunding,
        governmentFundingCash: governmentFunding, // 연차별 예산에서는 정부지원금을 현금으로 간주
        governmentFundingInKind: 0, // 연차별 예산에서는 정부지원금을 현물로 구분하지 않음
        companyCash,
        companyInKind,
        totalCash,
        totalInKind,
        yearlyTotal,
        status: 'draft', // 기본값
        notes: '', // 기본값
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    })

    // 예산 요약 계산
    const summary: BudgetSummary = {
      projectId: projectId,
      totalYears: budgets.length,
      totalGovernmentFunding: budgets.reduce((sum, b) => sum + b.governmentFunding, 0),
      totalCompanyCash: budgets.reduce((sum, b) => sum + b.companyCash, 0),
      totalCompanyInKind: budgets.reduce((sum, b) => sum + b.companyInKind, 0),
      totalCash: budgets.reduce((sum, b) => sum + b.totalCash, 0),
      totalInKind: budgets.reduce((sum, b) => sum + b.totalInKind, 0),
      totalBudget: budgets.reduce((sum, b) => sum + b.yearlyTotal, 0),
      governmentFundingRatio: 0,
      companyBurdenRatio: 0,
      cashRatio: 0,
      inKindRatio: 0,
    }

    // 비율 계산
    if (summary.totalBudget > 0) {
      summary.governmentFundingRatio = (summary.totalGovernmentFunding / summary.totalBudget) * 100
      summary.companyBurdenRatio =
        ((summary.totalCompanyCash + summary.totalCompanyInKind) / summary.totalBudget) * 100
      summary.cashRatio = (summary.totalCash / summary.totalBudget) * 100
      summary.inKindRatio = (summary.totalInKind / summary.totalBudget) * 100
    }

    const response: ApiResponse<{ budgets: AnnualBudget[]; summary: BudgetSummary }> = {
      success: true,
      data: {
        budgets,
        summary,
      },
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('연차별 예산 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '연차별 예산을 조회하는데 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// POST: 연차별 예산 생성 (project_budgets 테이블 사용)
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { projectId } = params
    const { budgets }: { budgets: AnnualBudgetFormData[] } = await request.json()

    if (!budgets || budgets.length === 0) {
      return json(
        {
          success: false,
          error: '예산 데이터가 필요합니다.',
        },
        { status: 400 },
      )
    }

    // 기존 데이터 삭제
    await query('DELETE FROM project_budgets WHERE project_id = $1', [projectId])

    // 새 데이터 삽입 (연차별 예산용 칼럼 사용)
    for (const budget of budgets) {
      await query(
        `
				INSERT INTO project_budgets (
					project_id, period_number, start_date, end_date,
					government_funding_amount, company_cash_amount, company_in_kind_amount
				) VALUES ($1, $2, $3, $4, $5, $6, $7)
				`,
        [
          projectId,
          budget.year, // period_number
          budget.startDate ? toUTC(budget.startDate) : null,
          budget.endDate ? toUTC(budget.endDate) : null,
          budget.governmentFunding || 0,
          budget.companyCash || 0,
          budget.companyInKind || 0,
        ],
      )
    }

    // 생성된 데이터 조회
    const result = await query(
      `
			SELECT 
				id, project_id, period_number, start_date, end_date,
				government_funding_amount, company_cash_amount, company_in_kind_amount,
				created_at, updated_at
			FROM project_budgets 
			WHERE project_id = $1 
			ORDER BY period_number
			`,
      [projectId],
    )

    const createdBudgetData: DatabaseProjectBudget[] = result.rows
    const createdBudgets: AnnualBudget[] = createdBudgetData.map((row) => {
      // 연차별 예산용 칼럼에서 직접 가져오기
      const governmentFunding = parseFloat(row.government_funding_amount) || 0
      const companyCash = parseFloat(row.company_cash_amount) || 0
      const companyInKind = parseFloat(row.company_in_kind_amount) || 0

      // 총 현금/현물 계산
      const totalCash = governmentFunding + companyCash
      const totalInKind = companyInKind
      const yearlyTotal = totalCash + totalInKind

      return {
        id: row.id,
        projectId: row.project_id,
        year: row.period_number,
        startDate: row.start_date ? formatDateForDisplay(row.start_date, 'ISO') : undefined,
        endDate: row.end_date ? formatDateForDisplay(row.end_date, 'ISO') : undefined,
        governmentFunding,
        governmentFundingCash: governmentFunding,
        governmentFundingInKind: 0,
        companyCash,
        companyInKind,
        totalCash,
        totalInKind,
        yearlyTotal,
        status: 'draft',
        notes: '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    })

    const response: ApiResponse<{ budgets: AnnualBudget[] }> = {
      success: true,
      data: {
        budgets: createdBudgets,
      },
      message: '연차별 예산이 성공적으로 생성되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('연차별 예산 생성 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '연차별 예산 생성에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// PUT: 연차별 예산 수정 (project_budgets 테이블 사용)
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
          error: '연차와 예산 데이터가 필요합니다.',
        },
        { status: 400 },
      )
    }

    // 예산 업데이트 (연차별 예산용 칼럼 사용)
    const result = await query(
      `
			UPDATE project_budgets SET
				start_date = $3,
				end_date = $4,
				government_funding_amount = $5,
				company_cash_amount = $6,
				company_in_kind_amount = $7,
				updated_at = CURRENT_TIMESTAMP
			WHERE project_id = $1 AND period_number = $2
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
      ],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '해당 연차의 예산을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const updatedBudget = result.rows[0]

    // 연차별 예산용 칼럼에서 직접 가져오기
    const governmentFunding = parseFloat(updatedBudget.government_funding_amount) || 0
    const companyCash = parseFloat(updatedBudget.company_cash_amount) || 0
    const companyInKind = parseFloat(updatedBudget.company_in_kind_amount) || 0

    // 총 현금/현물 계산
    const totalCash = governmentFunding + companyCash
    const totalInKind = companyInKind
    const yearlyTotal = totalCash + totalInKind

    const budget: AnnualBudget = {
      id: updatedBudget.id,
      projectId: updatedBudget.project_id,
      year: updatedBudget.period_number,
      startDate: updatedBudget.start_date
        ? formatDateForDisplay(updatedBudget.start_date, 'ISO')
        : undefined,
      endDate: updatedBudget.end_date
        ? formatDateForDisplay(updatedBudget.end_date, 'ISO')
        : undefined,
      governmentFunding,
      companyCash,
      companyInKind,
      totalCash,
      totalInKind,
      yearlyTotal,
      status: 'draft',
      notes: '',
      createdAt: updatedBudget.created_at,
      updatedAt: updatedBudget.updated_at,
    }

    const response: ApiResponse<{ budget: AnnualBudget }> = {
      success: true,
      data: {
        budget,
      },
      message: '연차별 예산이 성공적으로 수정되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('연차별 예산 수정 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '연차별 예산 수정에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}

// DELETE: 연차별 예산 삭제 (project_budgets 테이블 사용)
export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const { projectId } = params
    const { year }: { year: number } = await request.json()

    if (!year) {
      return json(
        {
          success: false,
          error: '삭제할 연차가 필요합니다.',
        },
        { status: 400 },
      )
    }

    const result = await query(
      'DELETE FROM project_budgets WHERE project_id = $1 AND period_number = $2 RETURNING *',
      [projectId, year],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '해당 연차의 예산을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: '연차별 예산이 성공적으로 삭제되었습니다.',
    }

    return json(response)
  } catch (error: unknown) {
    logger.error('연차별 예산 삭제 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : '연차별 예산 삭제에 실패했습니다.',
    }
    return json(response, { status: 500 })
  }
}
