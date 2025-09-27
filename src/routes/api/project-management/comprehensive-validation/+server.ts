import type { ApiResponse } from '$lib/types/database'
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

interface ValidationRequest {
  validationType: string
  name?: string
  code?: string
  language?: string
  tableName?: string
  query?: string
}

interface ValidationSummary {
  total: number
  valid: number
  invalid: number
  issues: string[]
}

interface ValidationIssue {
  type: string
  message: string
  severity: 'info' | 'error' | 'warning'
}

interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
}

interface SchemaResults {
  database: ValidationResult[]
  naming: ValidationResult[]
  summary: ValidationSummary
}

interface CodingResults {
  guidelines: unknown
  validationRules: unknown
  sampleValidations: Array<{
    type: string
    name: string
    result: ValidationResult
  }>
  summary: ValidationSummary
}

interface ProjectValidation {
  type: string
  period?: number
  member?: string
  validation: { isValid: boolean; message: string }
}

interface ProjectResults {
  projectId: string
  projectTitle: string
  validations: ProjectValidation[]
  summary: ValidationSummary
}

interface ErrorResult {
  error: string
}

type ValidationResults = SchemaResults | CodingResults | ProjectResults | ErrorResult

interface ComprehensiveValidationResults {
  schema: SchemaResults | ErrorResult | null
  coding: CodingResults | ErrorResult | null
  project: ProjectResults | ErrorResult | null
  summary: ValidationSummary
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('projectId')
    const validationScope = url.searchParams.get('scope') || 'all'

    logger.log(
      `🔍 [종합 검증] ${validationScope} 검증 시작${projectId ? ` - 프로젝트: ${projectId}` : ''}`,
    )

    const results: ComprehensiveValidationResults = {
      schema: null,
      coding: null,
      project: null,
      summary: {
        total: 0,
        valid: 0,
        invalid: 0,
        issues: [],
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
          database: schemaResults.map(result => ({
            isValid: result.isValid,
            issues: result.issues.map(issue => ({ type: 'database', message: issue, severity: 'error' as const }))
          })),
          naming: namingResults.map(result => ({
            isValid: result.isValid,
            issues: result.issues.map(issue => ({ type: 'naming', message: issue, severity: 'error' as const }))
          })),
          summary: {
            total: schemaResults.length + namingResults.length,
            valid:
              schemaResults.filter((r) => r.isValid).length +
              namingResults.filter((r) => r.isValid).length,
            invalid:
              schemaResults.filter((r) => !r.isValid).length +
              namingResults.filter((r) => !r.isValid).length,
            issues: [],
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
            result: {
              isValid: AICodingValidator.validateColumnName('user_id').isValid,
              issues: AICodingValidator.validateColumnName('user_id').issues.map(issue => ({ type: 'column', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'column',
            name: 'userId',
            result: {
              isValid: AICodingValidator.validateColumnName('userId').isValid,
              issues: AICodingValidator.validateColumnName('userId').issues.map(issue => ({ type: 'column', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'variable',
            name: 'projectId',
            result: {
              isValid: AICodingValidator.validateVariableName('projectId').isValid,
              issues: AICodingValidator.validateVariableName('projectId').issues.map(issue => ({ type: 'variable', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'variable',
            name: 'project_id',
            result: {
              isValid: AICodingValidator.validateVariableName('project_id').isValid,
              issues: AICodingValidator.validateVariableName('project_id').issues.map(issue => ({ type: 'variable', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'function',
            name: 'validateProject',
            result: {
              isValid: AICodingValidator.validateFunctionName('validateProject').isValid,
              issues: AICodingValidator.validateFunctionName('validateProject').issues.map(issue => ({ type: 'function', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'function',
            name: 'project_validate',
            result: {
              isValid: AICodingValidator.validateFunctionName('project_validate').isValid,
              issues: AICodingValidator.validateFunctionName('project_validate').issues.map(issue => ({ type: 'function', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'class',
            name: 'ValidationUtils',
            result: {
              isValid: AICodingValidator.validateClassName('ValidationUtils').isValid,
              issues: AICodingValidator.validateClassName('ValidationUtils').issues.map(issue => ({ type: 'class', message: issue, severity: 'error' as const }))
            },
          },
          {
            type: 'class',
            name: 'validation_utils',
            result: {
              isValid: AICodingValidator.validateClassName('validation_utils').isValid,
              issues: AICodingValidator.validateClassName('validation_utils').issues.map(issue => ({ type: 'class', message: issue, severity: 'error' as const }))
            },
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
            issues: [],
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
        const validations: ProjectValidation[] = []

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
            issues: [],
          },
        }
      } catch (error) {
        logger.error('프로젝트 검증 실패:', error)
        results.project = { error: '프로젝트 검증 실패' }
      }
    }

    // 타입 가드 함수들
    function isErrorResult(result: ValidationResults | null): result is ErrorResult {
      return result !== null && 'error' in result
    }

    function hasSummary(result: ValidationResults | null): result is SchemaResults | CodingResults | ProjectResults {
      return result !== null && !isErrorResult(result) && 'summary' in result
    }

    // 전체 요약 계산
    const allResults = [results.schema, results.coding, results.project].filter(hasSummary)
    results.summary.total = allResults.reduce((sum, r) => sum + (r.summary?.total || 0), 0)
    results.summary.valid = allResults.reduce((sum, r) => sum + (r.summary?.valid || 0), 0)
    results.summary.invalid = allResults.reduce((sum, r) => sum + (r.summary?.invalid || 0), 0)

    // 이슈 수집
    if (hasSummary(results.schema)) {
      results.summary.issues.push(
        ...[
          ...results.schema.database.filter((r) => !r.isValid).flatMap((r) => r.issues.map(issue => issue.message)),
          ...results.schema.naming.filter((r) => !r.isValid).flatMap((r) => r.issues.map(issue => issue.message)),
        ],
      )
    }

    if (hasSummary(results.coding)) {
      results.summary.issues.push(
        ...results.coding.sampleValidations
          .filter((v) => !v.result.isValid)
          .flatMap((v) => v.result.issues.map(issue => issue.message)),
      )
    }

    if (hasSummary(results.project)) {
      results.summary.issues.push(
        ...results.project.validations
          .filter((v) => !v.validation.isValid)
          .map((v) => v.validation.message),
      )
    }

    logger.log(
      `✅ [종합 검증] 완료 - ${results.summary.valid}/${results.summary.total}개 통과, ${results.summary.invalid}개 문제`,
    )

    const response: ApiResponse<ComprehensiveValidationResults> = {
      success: true,
      data: results,
    }

    return json({
      ...response,
      validationScope,
      projectId: projectId || null,
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
    const { validationType, name, code, language, tableName, query } = (await request.json()) as ValidationRequest

    logger.log(`🔍 [종합 검증] ${validationType} 검증 시작`)

    let validationResult: ValidationResult | null = null

    // 검증 타입별 처리
    switch (validationType) {
      case 'column':
        if (!name) {
          const response: ApiResponse<null> = { success: false, error: '컬럼명이 필요합니다.' }
          return json(response, { status: 400 })
        }
        const columnResult = AICodingValidator.validateColumnName(name)
        validationResult = {
          isValid: columnResult.isValid,
          issues: columnResult.issues.map(issue => ({ type: 'column', message: issue, severity: 'error' as const }))
        }
        break
      case 'variable':
        if (!name) {
          const response: ApiResponse<null> = { success: false, error: '변수명이 필요합니다.' }
          return json(response, { status: 400 })
        }
        const variableResult = AICodingValidator.validateVariableName(name)
        validationResult = {
          isValid: variableResult.isValid,
          issues: variableResult.issues.map(issue => ({ type: 'variable', message: issue, severity: 'error' as const }))
        }
        break
      case 'function':
        if (!name) {
          const response: ApiResponse<null> = { success: false, error: '함수명이 필요합니다.' }
          return json(response, { status: 400 })
        }
        const functionResult = AICodingValidator.validateFunctionName(name)
        validationResult = {
          isValid: functionResult.isValid,
          issues: functionResult.issues.map(issue => ({ type: 'function', message: issue, severity: 'error' as const }))
        }
        break
      case 'class':
        if (!name) {
          const response: ApiResponse<null> = { success: false, error: '클래스명이 필요합니다.' }
          return json(response, { status: 400 })
        }
        const classResult = AICodingValidator.validateClassName(name)
        validationResult = {
          isValid: classResult.isValid,
          issues: classResult.issues.map(issue => ({ type: 'class', message: issue, severity: 'error' as const }))
        }
        break
      case 'sql':
        if (!query) {
          const response: ApiResponse<null> = { success: false, error: 'SQL 쿼리가 필요합니다.' }
          return json(response, { status: 400 })
        }
        const sqlResult = AICodingValidator.validateSQLQuery(query)
        validationResult = {
          isValid: sqlResult.isValid,
          issues: sqlResult.issues.map(issue => ({ type: 'sql', message: issue, severity: 'error' as const }))
        }
        break
      case 'code':
        if (!code || !language) {
          const response: ApiResponse<null> = { success: false, error: '코드와 언어가 필요합니다.' }
          return json(response, { status: 400 })
        }
        const codeResult = AICodingValidator.validateCode(code, language as 'typescript' | 'sql' | 'javascript')
        validationResult = {
          isValid: codeResult.isValid,
          issues: codeResult.issues.map(issue => ({ type: 'code', message: issue.message, severity: issue.severity }))
        }
        break
      case 'query-columns':
        if (!query || !tableName) {
          const response: ApiResponse<null> = { success: false, error: '쿼리와 테이블명이 필요합니다.' }
          return json(response, { status: 400 })
        }
        const queryResults = SchemaValidator.validateQueryColumns(query, tableName)
        const allIssues = queryResults.flatMap(result => result.issues)
        validationResult = {
          isValid: queryResults.every(result => result.isValid),
          issues: allIssues.map(issue => ({ type: 'query', message: issue, severity: 'error' as const }))
        }
        break
      default:
        const response: ApiResponse<null> = { success: false, error: '지원하지 않는 검증 타입입니다.' }
        return json(response, { status: 400 })
    }

    logger.log(`✅ [종합 검증] 완료 - ${validationResult?.isValid ? '통과' : '실패'}`)

    const response: ApiResponse<{ validationResult: ValidationResult | null }> = {
      success: true,
      data: { validationResult },
    }

    return json({
      ...response,
      validationType,
      name: name || null,
      code: code || null,
      language: language || null,
      tableName: tableName || null,
      query: query || null,
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
