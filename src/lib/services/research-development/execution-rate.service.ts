/**
 * Budget Execution Rate Service (Server-side only)
 * 예산 집행율 계산 및 관리 서비스 (서버 사이드 전용)
 *
 * Note: This module uses database queries and should only be imported in server-side code.
 * For client-side utilities, use execution-rate-utils.ts instead.
 */

import { EvidenceCategoryCode } from '$lib/constants/evidence-category-codes'
import { query } from '$lib/database/connection'
import type { ExecutionRateData } from '$lib/types/project-budget'
import { logger } from '$lib/utils/logger'
import { getExecutionRateColor } from './execution-rate-utils'

/**
 * 비목별 증빙 집행액 조회
 */
export async function getEvidenceSpentByCategory(
  projectBudgetId: string,
  categoryCode: string,
): Promise<number> {
  try {
    const result = await query<{ total_spent: string }>(
      `
      SELECT COALESCE(SUM(ei.spent_amount), 0) as total_spent
      FROM evidence_items ei
      JOIN evidence_categories ec ON ei.category_id = ec.id
      WHERE ei.project_budget_id = $1 AND ec.code = $2
      `,
      [projectBudgetId, categoryCode],
    )

    return parseFloat(result.rows[0]?.total_spent || '0')
  } catch (error) {
    logger.error(`Failed to get evidence spent for category ${categoryCode}:`, error)
    return 0
  }
}

/**
 * 여러 카테고리의 증빙 집행액 합계 조회
 */
export async function getEvidenceSpentByMultipleCategories(
  projectBudgetId: string,
  categoryCodes: string[],
): Promise<number> {
  try {
    if (categoryCodes.length === 0) return 0

    const placeholders = categoryCodes.map((_, index) => `$${index + 2}`).join(',')
    const result = await query<{ total_spent: string }>(
      `
      SELECT COALESCE(SUM(ei.spent_amount), 0) as total_spent
      FROM evidence_items ei
      JOIN evidence_categories ec ON ei.category_id = ec.id
      WHERE ei.project_budget_id = $1 AND ec.code IN (${placeholders})
      `,
      [projectBudgetId, ...categoryCodes],
    )

    return parseFloat(result.rows[0]?.total_spent || '0')
  } catch (error) {
    logger.error(`Failed to get evidence spent for categories ${categoryCodes.join(', ')}:`, error)
    return 0
  }
}

/**
 * 연차별 집행율 계산
 */
export async function calculateExecutionRates(
  projectBudgetId: string,
  budget: any,
): Promise<ExecutionRateData> {
  try {
    // 각 비목별 집행액 조회
    const [personnelSpent, materialSpent, activitySpent, stipendSpent, indirectSpent] =
      await Promise.all([
        getEvidenceSpentByCategory(projectBudgetId, EvidenceCategoryCode.PERSONNEL),
        // 연구재료비: 모든 재료비 관련 카테고리 포함
        getEvidenceSpentByMultipleCategories(projectBudgetId, [
          EvidenceCategoryCode.RESEARCH_MATERIALS,
          EvidenceCategoryCode.MATERIALS,
          EvidenceCategoryCode.PROTOTYPING,
        ]),
        // 연구활동비: 모든 연구활동비 관련 카테고리 포함
        getEvidenceSpentByMultipleCategories(projectBudgetId, [
          EvidenceCategoryCode.RESEARCH_ACTIVITY,
          EvidenceCategoryCode.OUTSOURCING,
          EvidenceCategoryCode.DOMESTIC_TRAVEL,
          EvidenceCategoryCode.MEETING,
          EvidenceCategoryCode.BUSINESS_PROMOTION,
        ]),
        // 연구수당은 별도 카테고리가 없으므로 연구활동비에 포함 (동일한 값 사용)
        getEvidenceSpentByMultipleCategories(projectBudgetId, [
          EvidenceCategoryCode.RESEARCH_ACTIVITY,
          EvidenceCategoryCode.OUTSOURCING,
          EvidenceCategoryCode.DOMESTIC_TRAVEL,
          EvidenceCategoryCode.MEETING,
          EvidenceCategoryCode.BUSINESS_PROMOTION,
        ]),
        getEvidenceSpentByCategory(projectBudgetId, EvidenceCategoryCode.INDIRECT),
      ])

    // 예산 금액 계산 (현금 + 현물)
    const personnelBudget = (budget.personnel_cost_cash || 0) + (budget.personnel_cost_in_kind || 0)
    const materialBudget =
      (budget.research_material_cost_cash || 0) + (budget.research_material_cost_in_kind || 0)
    const activityBudget =
      (budget.research_activity_cost_cash || 0) + (budget.research_activity_cost_in_kind || 0)
    const stipendBudget =
      (budget.research_stipend_cash || 0) + (budget.research_stipend_in_kind || 0)
    const indirectBudget = (budget.indirect_cost_cash || 0) + (budget.indirect_cost_in_kind || 0)

    // 집행율 계산
    const personnelRate = personnelBudget > 0 ? (personnelSpent / personnelBudget) * 100 : 0
    const materialRate = materialBudget > 0 ? (materialSpent / materialBudget) * 100 : 0
    const activityRate = activityBudget > 0 ? (activitySpent / activityBudget) * 100 : 0
    const stipendRate = stipendBudget > 0 ? (stipendSpent / stipendBudget) * 100 : 0
    const indirectRate = indirectBudget > 0 ? (indirectSpent / indirectBudget) * 100 : 0

    // 총 예산 및 집행율
    const totalBudget =
      personnelBudget + materialBudget + activityBudget + stipendBudget + indirectBudget
    const totalSpent = personnelSpent + materialSpent + activitySpent + stipendSpent + indirectSpent
    const totalRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return {
      personnelCostRate: personnelRate,
      researchMaterialCostRate: materialRate,
      researchActivityCostRate: activityRate,
      researchStipendRate: stipendRate,
      indirectCostRate: indirectRate,
      totalRate: totalRate,
      colorCode: {
        personnel: getExecutionRateColor(personnelRate),
        material: getExecutionRateColor(materialRate),
        activity: getExecutionRateColor(activityRate),
        stipend: getExecutionRateColor(stipendRate),
        indirect: getExecutionRateColor(indirectRate),
        total: getExecutionRateColor(totalRate),
      },
    }
  } catch (error) {
    logger.error('Failed to calculate execution rates:', error)
    return {
      personnelCostRate: 0,
      researchMaterialCostRate: 0,
      researchActivityCostRate: 0,
      researchStipendRate: 0,
      indirectCostRate: 0,
      totalRate: 0,
      colorCode: {
        personnel: 'gray',
        material: 'gray',
        activity: 'gray',
        stipend: 'gray',
        indirect: 'gray',
        total: 'gray',
      },
    }
  }
}
