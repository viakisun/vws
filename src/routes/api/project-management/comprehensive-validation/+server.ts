import { AICodingValidator } from '$lib/utils/ai-coding-guidelines'
import { toUTC } from '$lib/utils/date-handler'
import { formatEmployeeName } from '$lib/utils/format'
import { logger } from '$lib/utils/logger'
import { SchemaValidator } from '$lib/utils/schema-validation'
import {
    BudgetConsistencyValidator,
    EmploymentPeriodValidator,
    ParticipationRateValidator,
    PersonnelCostValidator,
    UsageRateValidator,
    ValidationUtils,
} from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')
    const validationScope = url.searchParams.get('scope') || 'all'

    logger.log(
      `🔍 [종합 검증] ${validationScope} 검증 시작${projectId ? ` - 프로젝트: ${projectId}` : ''}`,
    )

    const results = {
      schema: null as any,
      coding: null as any,
      project: null as any,
      summary: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: [] as string[],
      },
    }

    // 1. 스키마 검증
    if (validationScope === 'all' || validationScope === 'schema') {
      logger.log('📋 [스키마 검증] 시작')
      try {
        const [schemaResults, namingResults] = await Promise.all([
          SchemaValidator.validateDatabaseSchema(),
          SchemaValidator.validateColumnNamingConsistency(),
        ])

        results.schema = {
          database: schemaResults,
          naming: namingResults,
          summary: {
            total: schemaResults.length + namingResults.length,
            valid:
              schemaResults.filter((r) => r.isValid).length +
              namingResults.filter((r) => r.isValid).length,
            invalid:
              schemaResults.filter((r) => !r.isValid).length +
              namingResults.filter((r) => !r.isValid).length,
          },
        }
      } catch (error) {
        logger.error('스키마 검증 실패:', error)
        results.schema = { error: '스키마 검증 실패' }
      }
    }

    // 2. 코딩 가이드라인 검증
    if (validationScope === 'all' || validationScope === 'coding') {
      logger.log('📝 [코딩 가이드라인 검증] 시작')
      try {
        const guidelines = AICodingValidator.getGuidelines()
        const validationRules = AICodingValidator.getValidationRules()

        // 샘플 검증 실행
        const sampleValidations = [
          {
            type: 'column',
            name: 'user_id',
            result: AICodingValidator.validateColumnName('user_id'),
          },
          {
            type: 'column',
            name: 'userId',
            result: AICodingValidator.validateColumnName('userId'),
          },
          {
            type: 'variable',
            name: 'projectId',
            result: AICodingValidator.validateVariableName('projectId'),
          },
          {
            type: 'variable',
            name: 'project_id',
            result: AICodingValidator.validateVariableName('project_id'),
          },
          {
            type: 'function',
            name: 'validateProject',
            result: AICodingValidator.validateFunctionName('validateProject'),
          },
          {
            type: 'function',
            name: 'project_validate',
            result: AICodingValidator.validateFunctionName('project_validate'),
          },
          {
            type: 'class',
            name: 'ValidationUtils',
            result: AICodingValidator.validateClassName('ValidationUtils'),
          },
          {
            type: 'class',
            name: 'validation_utils',
            result: AICodingValidator.validateClassName('validation_utils'),
          },
        ]

        results.coding = {
          guidelines,
          validationRules,
          sampleValidations,
          summary: {
            total: sampleValidations.length,
            valid: sampleValidations.filter((v) => v.result.isValid).length,
            invalid: sampleValidations.filter((v) => !v.result.isValid).length,
          },
        }
      } catch (error) {
        logger.error('코딩 가이드라인 검증 실패:', error)
        results.coding = { error: '코딩 가이드라인 검증 실패' }
      }
    }

    // 3. 프로젝트 검증 (프로젝트 ID가 있는 경우)
    if (projectId && (validationScope === 'all' || validationScope === 'project')) {
      logger.log(`📊 [프로젝트 검증] 시작 - 프로젝트: ${projectId}`)
      try {
        const project = await ValidationUtils.getProjectInfo(projectId)
        const [budgets, members, evidenceItems] = await Promise.all([
          ValidationUtils.getProjectBudgets(projectId),
          ValidationUtils.getProjectMembers(projectId),
          ValidationUtils.getEvidenceItems(projectId),
        ])

        // 각 검증 실행
        const validations: Array<{ type: string; period?: any; member?: string; validation: any }> = []

        // 인건비 검증
        for (const budget of budgets) {
          const actualPersonnelCost = PersonnelCostValidator.calculateActualPersonnelCost(
            members,
            budget,
          )
          const validation = PersonnelCostValidator.validatePersonnelCost(
            budget,
            actualPersonnelCost,
          )
          validations.push({
            type: 'personnel_cost',
            period: budget.period_number,
            validation,
          })
        }

        // 예산 일관성 검증
        const budgetValidation = BudgetConsistencyValidator.validateBudgetConsistency(
          project,
          budgets,
        )
        validations.push({
          type: 'budget_consistency',
          validation: budgetValidation,
        })

        // 재직 기간 검증
        for (const member of members) {
          const validation = EmploymentPeriodValidator.validateMemberEmploymentPeriod(
            member,
            project,
          )
          validations.push({
            type: 'employment_period',
            member: formatEmployeeName(member),
            validation,
          })
        }

        // 참여율 검증
        const participationValidation =
          ParticipationRateValidator.validateParticipationRate(members)
        validations.push({
          type: 'participation_rate',
          validation: participationValidation,
        })

        // 사용률 검증
        for (const budget of budgets) {
          const validation = UsageRateValidator.validateUsageRate(budget, evidenceItems)
          validations.push({
            type: 'usage_rate',
            period: budget.period_number,
            validation,
          })
        }

        results.project = {
          projectId,
          projectTitle: project.title,
          validations,
          summary: {
            total: validations.length,
            valid: validations.filter((v) => v.validation.isValid).length,
            invalid: validations.filter((v) => !v.validation.isValid).length,
          },
        }
      } catch (error) {
        logger.error('프로젝트 검증 실패:', error)
        results.project = { error: '프로젝트 검증 실패' }
      }
    }

    // 전체 요약 계산
    const allResults = [results.schema, results.coding, results.project].filter(
      (r) => r && !r.error,
    )
    results.summary.total = allResults.reduce((sum, r) => sum + (r.summary?.total || 0), 0)
    results.summary.valid = allResults.reduce((sum, r) => sum + (r.summary?.valid || 0), 0)
    results.summary.invalid = allResults.reduce((sum, r) => sum + (r.summary?.invalid || 0), 0)

    // 이슈 수집
    if (results.schema && !results.schema.error) {
      results.summary.issues.push(
        ...[
          ...results.schema.database.filter((r: any) => !r.isValid).flatMap((r: any) => r.issues),
          ...results.schema.naming.filter((r: any) => !r.isValid).flatMap((r: any) => r.issues),
        ],
      )
    }

    if (results.coding && !results.coding.error) {
      results.summary.issues.push(
        ...results.coding.sampleValidations
          .filter((v: any) => !v.result.isValid)
          .flatMap((v: any) => v.result.issues),
      )
    }

    if (results.project && !results.project.error) {
      results.summary.issues.push(
        ...results.project.validations
          .filter((v: any) => !v.validation.isValid)
          .map((v: any) => v.validation.message),
      )
    }

    logger.log(
      `✅ [종합 검증] 완료 - ${results.summary.valid}/${results.summary.total}개 통과, ${results.summary.invalid}개 문제`,
    )

    return json({
      success: true,
      validationScope,
      projectId: projectId || null,
      results,
      generatedAt: toUTC(new Date()),
    })
  } catch (error) {
    logger.error('Comprehensive validation error:', error)
    return json(
      {
        success: false,
        error: '종합 검증 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { validationType, name, code, language, tableName, query } = await request.json()

    logger.log(`🔍 [종합 검증] ${validationType} 검증 시작`)

    let validationResult: any = null

    // 검증 타입별 처리
    switch (validationType) {
      case 'column':
        validationResult = AICodingValidator.validateColumnName(name)
        break
      case 'variable':
        validationResult = AICodingValidator.validateVariableName(name)
        break
      case 'function':
        validationResult = AICodingValidator.validateFunctionName(name)
        break
      case 'class':
        validationResult = AICodingValidator.validateClassName(name)
        break
      case 'sql':
        validationResult = AICodingValidator.validateSQLQuery(query)
        break
      case 'code':
        validationResult = AICodingValidator.validateCode(code, language)
        break
      case 'query-columns':
        if (!query || !tableName) {
          return json({ error: '쿼리와 테이블명이 필요합니다.' }, { status: 400 })
        }
        validationResult = SchemaValidator.validateQueryColumns(query, tableName)
        break
      default:
        return json({ error: '지원하지 않는 검증 타입입니다.' }, { status: 400 })
    }

    logger.log(`✅ [종합 검증] 완료 - ${validationResult.isValid ? '통과' : '실패'}`)

    return json({
      success: true,
      validationType,
      name: name || null,
      code: code || null,
      language: language || null,
      tableName: tableName || null,
      query: query || null,
      validationResult,
      generatedAt: toUTC(new Date()),
    })
  } catch (error) {
    logger.error('Comprehensive validation error:', error)
    return json(
      {
        success: false,
        error: '종합 검증 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
