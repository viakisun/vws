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
    const { projectId } = params as Record<string, string>

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
    const budgetData = budgetResult.rows as DatabaseProjectBudget[]
    const budgets: AnnualBudget[] = budgetData.map((row) => {
      // 연차별 예산용 칼럼에서 직접 가져오기
      const governmentFunding = parseFloat(String(row.government_funding_amount || 0)) || 0
      const companyCash = parseFloat(String(row.company_cash_amount || 0)) || 0
      const companyInKind = parseFloat(String(row.company_in_kind_amount || 0)) || 0

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
    const { projectId } = params as Record<string, string>
    const { budgets }: { budgets: AnnualBudgetFormData[] } = (await request.json()) as {
      budgets: AnnualBudgetFormData[]
    }

    if (!budgets || budgets.length === 0) {
      return json(
        {
          success: false,
          error: '예산 데이터가 필요합니다.',
        },
        { status: 400 },
      )
    }

    // 기존 데이터 백업 (연구개발비 데이터 보존을 위해)
    const existingBudgets = await query(
      `
			SELECT 
				period_number,
				personnel_cost, research_material_cost, research_activity_cost, research_stipend, indirect_cost,
				personnel_cost_cash, personnel_cost_in_kind,
				research_material_cost_cash, research_material_cost_in_kind,
				research_activity_cost_cash, research_activity_cost_in_kind,
				research_stipend_cash, research_stipend_in_kind,
				indirect_cost_cash, indirect_cost_in_kind
			FROM project_budgets 
			WHERE project_id = $1
		`,
      [projectId],
    )

    // 기존 데이터 삭제
    await query('DELETE FROM project_budgets WHERE project_id = $1', [projectId])

    // 예산 검증 및 경고 메시지 수집 (POST용)
    const postWarnings: string[] = []
    const postBudgetMismatches: Array<{
      year: number
      expectedTotal: number
      researchCostTotal: number
      expectedCash?: number
      researchCostCash?: number
      expectedInKind?: number
      researchCostInKind?: number
    }> = []

    // 새 데이터 삽입 (연차별 예산용 칼럼 사용 + 기존 연구개발비 데이터 보존)
    for (const budget of budgets) {
      // 해당 연차의 기존 연구개발비 데이터 찾기
      const existingBudget = existingBudgets.rows.find(
        (row) => row.period_number === budget.year,
      ) as Record<string, unknown> | undefined

      // 연차별 예산 총액 계산
      const annualBudgetTotal =
        (budget.governmentFunding || 0) + (budget.companyCash || 0) + (budget.companyInKind || 0)

      // 연차별 예산의 현금/현물 구성
      const annualBudgetCash = (budget.governmentFunding || 0) + (budget.companyCash || 0)
      const annualBudgetInKind = budget.companyInKind || 0

      // 연구개발비의 현금/현물 각각 계산
      const researchCostCash =
        Number(existingBudget?.personnel_cost_cash || 0) +
        Number(existingBudget?.research_material_cost_cash || 0) +
        Number(existingBudget?.research_activity_cost_cash || 0) +
        Number(existingBudget?.research_stipend_cash || 0) +
        Number(existingBudget?.indirect_cost_cash || 0)

      const researchCostInKind =
        Number(existingBudget?.personnel_cost_in_kind || 0) +
        Number(existingBudget?.research_material_cost_in_kind || 0) +
        Number(existingBudget?.research_activity_cost_in_kind || 0) +
        Number(existingBudget?.research_stipend_in_kind || 0) +
        Number(existingBudget?.indirect_cost_in_kind || 0)

      const researchCostTotal = researchCostCash + researchCostInKind

      // 예산과 연구개발비 합계 불일치 검사 (현금+현물 = 연차 예산 총액)
      if (researchCostTotal > 0 && Math.abs(annualBudgetTotal - researchCostTotal) > 1000) {
        // 1천원 이상 차이
        postBudgetMismatches.push({
          year: budget.year,
          expectedTotal: annualBudgetTotal,
          researchCostTotal: researchCostTotal,
          expectedCash: annualBudgetCash,
          researchCostCash: researchCostCash,
          expectedInKind: annualBudgetInKind,
          researchCostInKind: researchCostInKind,
        })
        postWarnings.push(
          `${budget.year}차년도: 연차별 예산(${annualBudgetTotal.toLocaleString()}원)과 연구개발비 합계(${researchCostTotal.toLocaleString()}원)가 일치하지 않습니다. [현금: ${annualBudgetCash.toLocaleString()}원 vs ${researchCostCash.toLocaleString()}원, 현물: ${annualBudgetInKind.toLocaleString()}원 vs ${researchCostInKind.toLocaleString()}원]`,
        )
      }

      await query(
        `
				INSERT INTO project_budgets (
					project_id, period_number, start_date, end_date,
					government_funding_amount, company_cash_amount, company_in_kind_amount,
					personnel_cost, research_material_cost, research_activity_cost, research_stipend, indirect_cost,
					personnel_cost_cash, personnel_cost_in_kind,
					research_material_cost_cash, research_material_cost_in_kind,
					research_activity_cost_cash, research_activity_cost_in_kind,
					research_stipend_cash, research_stipend_in_kind,
					indirect_cost_cash, indirect_cost_in_kind
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
				`,
        [
          projectId,
          budget.year, // period_number
          budget.startDate ? toUTC(budget.startDate) : null,
          budget.endDate ? toUTC(budget.endDate) : null,
          budget.governmentFunding || 0,
          budget.companyCash || 0,
          budget.companyInKind || 0,
          // 기존 연구개발비 데이터 보존 (없으면 0)
          existingBudget?.personnel_cost || 0,
          existingBudget?.research_material_cost || 0,
          existingBudget?.research_activity_cost || 0,
          existingBudget?.research_stipend || 0,
          existingBudget?.indirect_cost || 0,
          existingBudget?.personnel_cost_cash || 0,
          existingBudget?.personnel_cost_in_kind || 0,
          existingBudget?.research_material_cost_cash || 0,
          existingBudget?.research_material_cost_in_kind || 0,
          existingBudget?.research_activity_cost_cash || 0,
          existingBudget?.research_activity_cost_in_kind || 0,
          existingBudget?.research_stipend_cash || 0,
          existingBudget?.research_stipend_in_kind || 0,
          existingBudget?.indirect_cost_cash || 0,
          existingBudget?.indirect_cost_in_kind || 0,
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

    const createdBudgetData = result.rows as DatabaseProjectBudget[]

    // 연구개발비 데이터 조회 (불일치 검증용 - 현금/현물 각각)
    const researchCostsResult = await query(
      `
			SELECT 
				period_number,
				personnel_cost, research_material_cost, research_activity_cost, research_stipend, indirect_cost,
				personnel_cost_cash, personnel_cost_in_kind,
				research_material_cost_cash, research_material_cost_in_kind,
				research_activity_cost_cash, research_activity_cost_in_kind,
				research_stipend_cash, research_stipend_in_kind,
				indirect_cost_cash, indirect_cost_in_kind
			FROM project_budgets 
			WHERE project_id = $1
		`,
      [projectId],
    )

    // 불일치 검증
    const warnings: string[] = []
    const budgetMismatches: Array<{
      year: number
      expectedTotal: number
      researchCostTotal: number
      expectedCash?: number
      researchCostCash?: number
      expectedInKind?: number
      researchCostInKind?: number
    }> = []

    const createdBudgets: AnnualBudget[] = createdBudgetData.map((row) => {
      // 연차별 예산용 칼럼에서 직접 가져오기
      const governmentFunding = parseFloat(String(row.government_funding_amount || 0)) || 0
      const companyCash = parseFloat(String(row.company_cash_amount || 0)) || 0
      const companyInKind = parseFloat(String(row.company_in_kind_amount || 0)) || 0

      // 총 현금/현물 계산
      const totalCash = governmentFunding + companyCash
      const totalInKind = companyInKind
      const yearlyTotal = totalCash + totalInKind

      // 해당 연차의 연구개발비 현금/현물 각각 계산
      const researchCostRow = researchCostsResult.rows.find(
        (r) => r.period_number === row.period_number,
      )

      const researchCostCash = researchCostRow
        ? Number(researchCostRow.personnel_cost_cash || 0) +
          Number(researchCostRow.research_material_cost_cash || 0) +
          Number(researchCostRow.research_activity_cost_cash || 0) +
          Number(researchCostRow.research_stipend_cash || 0) +
          Number(researchCostRow.indirect_cost_cash || 0)
        : 0

      const researchCostInKind = researchCostRow
        ? Number(researchCostRow.personnel_cost_in_kind || 0) +
          Number(researchCostRow.research_material_cost_in_kind || 0) +
          Number(researchCostRow.research_activity_cost_in_kind || 0) +
          Number(researchCostRow.research_stipend_in_kind || 0) +
          Number(researchCostRow.indirect_cost_in_kind || 0)
        : 0

      const researchCostTotal = researchCostCash + researchCostInKind

      // 예산과 연구개발비 합계 불일치 검사 (현금+현물 = 연차 예산 총액)
      if (researchCostTotal > 0 && Math.abs(yearlyTotal - researchCostTotal) > 1000) {
        // 1천원 이상 차이
        budgetMismatches.push({
          year: row.period_number,
          expectedTotal: yearlyTotal,
          researchCostTotal: researchCostTotal,
          expectedCash: totalCash,
          researchCostCash: researchCostCash,
          expectedInKind: totalInKind,
          researchCostInKind: researchCostInKind,
        })
        warnings.push(
          `${row.period_number}차년도: 연차별 예산(${yearlyTotal.toLocaleString()}원)과 연구개발비 합계(${researchCostTotal.toLocaleString()}원)가 일치하지 않습니다. [현금: ${totalCash.toLocaleString()}원 vs ${researchCostCash.toLocaleString()}원, 현물: ${totalInKind.toLocaleString()}원 vs ${researchCostInKind.toLocaleString()}원]`,
        )
      }

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
        // 불일치 정보 추가
        hasMismatch: researchCostTotal > 0 && Math.abs(yearlyTotal - researchCostTotal) > 1000,
        researchCostTotal: researchCostTotal,
      }
    })

    const response: ApiResponse<{
      budgets: AnnualBudget[]
      warnings?: string[]
      budgetMismatches?: Array<{ year: number; expectedTotal: number; researchCostTotal: number }>
    }> = {
      success: true,
      data: {
        budgets: createdBudgets,
        ...(postWarnings.length > 0 && { warnings: postWarnings }),
        ...(postBudgetMismatches.length > 0 && { budgetMismatches: postBudgetMismatches }),
      },
      message:
        postWarnings.length > 0
          ? `연차별 예산이 생성되었지만 ${postWarnings.length}개의 불일치가 발견되었습니다.`
          : '연차별 예산이 성공적으로 생성되었습니다.',
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
    const { projectId } = params as Record<string, string>
    const { year, budgetData }: { year: number; budgetData: AnnualBudgetFormData } =
      (await request.json()) as { year: number; budgetData: AnnualBudgetFormData }

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

    // 기존 연구개발비 데이터 조회 (검증을 위해 - 현금/현물 각각)
    const existingBudget = await query(
      `
			SELECT 
				personnel_cost, research_material_cost, research_activity_cost, research_stipend, indirect_cost,
				personnel_cost_cash, personnel_cost_in_kind,
				research_material_cost_cash, research_material_cost_in_kind,
				research_activity_cost_cash, research_activity_cost_in_kind,
				research_stipend_cash, research_stipend_in_kind,
				indirect_cost_cash, indirect_cost_in_kind
			FROM project_budgets 
			WHERE project_id = $1 AND period_number = $2
		`,
      [projectId, year],
    )

    // 예산 검증
    const annualBudgetTotal =
      (budgetData.governmentFunding || 0) +
      (budgetData.companyCash || 0) +
      (budgetData.companyInKind || 0)

    // 연차별 예산의 현금/현물 구성
    const annualBudgetCash = (budgetData.governmentFunding || 0) + (budgetData.companyCash || 0)
    const annualBudgetInKind = budgetData.companyInKind || 0

    // 연구개발비의 현금/현물 각각 계산
    const existingRow = existingBudget.rows.length > 0 ? existingBudget.rows[0] : null
    const researchCostCash = existingRow
      ? Number(existingRow.personnel_cost_cash || 0) +
        Number(existingRow.research_material_cost_cash || 0) +
        Number(existingRow.research_activity_cost_cash || 0) +
        Number(existingRow.research_stipend_cash || 0) +
        Number(existingRow.indirect_cost_cash || 0)
      : 0

    const researchCostInKind = existingRow
      ? Number(existingRow.personnel_cost_in_kind || 0) +
        Number(existingRow.research_material_cost_in_kind || 0) +
        Number(existingRow.research_activity_cost_in_kind || 0) +
        Number(existingRow.research_stipend_in_kind || 0) +
        Number(existingRow.indirect_cost_in_kind || 0)
      : 0

    const researchCostTotal = researchCostCash + researchCostInKind

    const warnings: string[] = []
    if (researchCostTotal > 0 && Math.abs(annualBudgetTotal - researchCostTotal) > 1000) {
      warnings.push(
        `${year}차년도: 연차별 예산(${annualBudgetTotal.toLocaleString()}원)과 연구개발비 합계(${researchCostTotal.toLocaleString()}원)가 일치하지 않습니다. [현금: ${annualBudgetCash.toLocaleString()}원 vs ${researchCostCash.toLocaleString()}원, 현물: ${annualBudgetInKind.toLocaleString()}원 vs ${researchCostInKind.toLocaleString()}원]`,
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

    const updatedBudget = result.rows[0] as Record<string, unknown>

    // 연차별 예산용 칼럼에서 직접 가져오기
    const governmentFunding = parseFloat(String(updatedBudget.government_funding_amount || 0)) || 0
    const companyCash = parseFloat(String(updatedBudget.company_cash_amount || 0)) || 0
    const companyInKind = parseFloat(String(updatedBudget.company_in_kind_amount || 0)) || 0

    // 총 현금/현물 계산
    const totalCash = governmentFunding + companyCash
    const totalInKind = companyInKind
    const yearlyTotal = totalCash + totalInKind

    const budget: AnnualBudget = {
      id: String(updatedBudget.id || ''),
      projectId: String(updatedBudget.project_id || ''),
      year: Number(updatedBudget.period_number || 0),
      startDate: updatedBudget.start_date
        ? formatDateForDisplay(String(updatedBudget.start_date), 'ISO')
        : undefined,
      endDate: updatedBudget.end_date
        ? formatDateForDisplay(String(updatedBudget.end_date), 'ISO')
        : undefined,
      governmentFunding,
      companyCash,
      companyInKind,
      totalCash,
      totalInKind,
      yearlyTotal,
      status: 'draft',
      notes: '',
      createdAt: String(updatedBudget.created_at || ''),
      updatedAt: String(updatedBudget.updated_at || ''),
    }

    const response: ApiResponse<{ budget: AnnualBudget; warnings?: string[] }> = {
      success: true,
      data: {
        budget,
        ...(warnings.length > 0 && { warnings }),
      },
      message:
        warnings.length > 0
          ? `연차별 예산이 수정되었지만 불일치가 발견되었습니다: ${warnings[0]}`
          : '연차별 예산이 성공적으로 수정되었습니다.',
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
    const { projectId } = params as Record<string, string>
    const { year }: { year: number } = (await request.json()) as { year: number }

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
