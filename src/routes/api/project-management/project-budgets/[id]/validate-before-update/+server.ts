import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST /api/project-management/project-budgets/[id]/validate-before-update - 예산 수정 전 검증
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params as Record<string, string>
    const data = (await request.json()) as Record<string, unknown>
    const {
      periodNumber: _periodNumber = 1,
      startDate: _startDate,
      endDate: _endDate,
      // 현금 비목들
      personnelCostCash = 0,
      researchMaterialCostCash = 0,
      researchActivityCostCash = 0,
      researchStipendCash = 0,
      indirectCostCash = 0,
      // 현물 비목들
      personnelCostInKind = 0,
      researchMaterialCostInKind = 0,
      researchActivityCostInKind = 0,
      researchStipendInKind = 0,
      indirectCostInKind = 0,
    } = data

    // 기존 사업비 정보 조회
    const existingBudget = await query('SELECT * FROM project_budgets WHERE id = $1', [id])

    if (existingBudget.rows.length === 0) {
      return json(
        {
          success: false,
          message: '프로젝트 사업비를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const existing = existingBudget.rows[0] as Record<string, unknown>

    // 새로운 예산 금액 계산
    const newPersonnelCost = Number(personnelCostCash || 0) + Number(personnelCostInKind || 0)
    const newResearchMaterialCost =
      Number(researchMaterialCostCash || 0) + Number(researchMaterialCostInKind || 0)
    const newResearchActivityCost =
      Number(researchActivityCostCash || 0) + Number(researchActivityCostInKind || 0)
    const newResearchStipend = Number(researchStipendCash || 0) + Number(researchStipendInKind || 0)
    const newIndirectCost = Number(indirectCostCash || 0) + Number(indirectCostInKind || 0)

    // 기존 예산 금액
    const oldPersonnelCost = Number(existing.personnel_cost || 0)
    const oldResearchMaterialCost = Number(existing.research_material_cost || 0)
    const oldResearchActivityCost = Number(existing.research_activity_cost || 0)
    const oldResearchStipend = Number(existing.research_stipend || 0)
    const oldIndirectCost = Number(existing.indirect_cost || 0)

    // 변경사항 분석
    const changes = {
      personnelCost: {
        old: oldPersonnelCost,
        new: newPersonnelCost,
        changed: Math.abs(oldPersonnelCost - newPersonnelCost) > 0,
      },
      researchMaterialCost: {
        old: oldResearchMaterialCost,
        new: newResearchMaterialCost,
        changed: Math.abs(oldResearchMaterialCost - newResearchMaterialCost) > 0,
      },
      researchActivityCost: {
        old: oldResearchActivityCost,
        new: newResearchActivityCost,
        changed: Math.abs(oldResearchActivityCost - newResearchActivityCost) > 0,
      },
      researchStipend: {
        old: oldResearchStipend,
        new: newResearchStipend,
        changed: Math.abs(oldResearchStipend - newResearchStipend) > 0,
      },
      indirectCost: {
        old: oldIndirectCost,
        new: newIndirectCost,
        changed: Math.abs(oldIndirectCost - newIndirectCost) > 0,
      },
    }

    // 연구개발비 관련 비목들 (인건비, 연구재료비, 연구활동비, 연구수당)의 변경사항 확인
    const researchCostChanges = [
      { name: '인건비', ...changes.personnelCost },
      { name: '연구재료비', ...changes.researchMaterialCost },
      { name: '연구활동비', ...changes.researchActivityCost },
      { name: '연구수당', ...changes.researchStipend },
    ].filter((change) => change.changed)

    // 간접비 변경사항
    const indirectCostChanged = changes.indirectCost.changed

    // 경고 메시지 생성
    const warnings: string[] = []
    const recommendations: string[] = []

    if (researchCostChanges.length > 0) {
      warnings.push(
        `연구개발비가 변경됩니다: ${researchCostChanges
          .map(
            (change) =>
              `${change.name} (${change.old.toLocaleString()}원 → ${change.new.toLocaleString()}원)`,
          )
          .join(', ')}`,
      )
      recommendations.push(
        '연구개발비 변경 시 기존 입력된 연구개발비 데이터가 영향을 받을 수 있습니다.',
      )
    }

    if (indirectCostChanged) {
      warnings.push(
        `간접비가 변경됩니다: ${changes.indirectCost.old.toLocaleString()}원 → ${changes.indirectCost.new.toLocaleString()}원`,
      )
    }

    // 전체 예산 변경량 계산
    const oldTotalBudget =
      oldPersonnelCost +
      oldResearchMaterialCost +
      oldResearchActivityCost +
      oldResearchStipend +
      oldIndirectCost
    const newTotalBudget =
      newPersonnelCost +
      newResearchMaterialCost +
      newResearchActivityCost +
      newResearchStipend +
      newIndirectCost
    const totalBudgetChange = newTotalBudget - oldTotalBudget

    if (Math.abs(totalBudgetChange) > 0) {
      warnings.push(
        `전체 예산이 변경됩니다: ${oldTotalBudget.toLocaleString()}원 → ${newTotalBudget.toLocaleString()}원 (${totalBudgetChange > 0 ? '+' : ''}${totalBudgetChange.toLocaleString()}원)`,
      )
    }

    // 검증 결과 반환
    const hasWarnings = warnings.length > 0
    const hasResearchCostChanges = researchCostChanges.length > 0

    return json({
      success: true,
      data: {
        hasWarnings,
        hasResearchCostChanges,
        warnings,
        recommendations,
        changes,
        totalBudgetChange,
        oldTotalBudget,
        newTotalBudget,
      },
      message: hasWarnings
        ? '예산 수정 시 주의사항이 있습니다. 확인 후 진행해주세요.'
        : '예산 수정이 가능합니다.',
    })
  } catch (error) {
    logger.error('예산 수정 전 검증 실패:', error)
    return json(
      {
        success: false,
        message: '예산 수정 전 검증에 실패했습니다.',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
