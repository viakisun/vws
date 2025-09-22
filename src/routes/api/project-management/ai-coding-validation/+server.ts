import { AICodingValidator } from '$lib/utils/ai-coding-guidelines'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  try {
    const category = url.searchParams.get('category')

    console.log(`🔍 [AI 코딩 가이드라인] ${category || '전체'} 가이드라인 조회`)

    // 가이드라인 조회
    const guidelines = AICodingValidator.getGuidelines(category || undefined)

    // 검증 규칙 조회
    const validationRules = AICodingValidator.getValidationRules()

    return json({
      success: true,
      guidelines,
      validationRules,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI coding guidelines error:', error)
    return json(
      {
        success: false,
        error: 'AI 코딩 가이드라인 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { validationType, name, code, language } = await request.json()

    if (!validationType || !name) {
      return json({ error: '검증 타입과 이름이 필요합니다.' }, { status: 400 })
    }

    console.log(`🔍 [AI 코딩 검증] ${validationType} 검증 시작: ${name}`)

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
        if (!code) {
          return json({ error: 'SQL 쿼리가 필요합니다.' }, { status: 400 })
        }
        validationResult = AICodingValidator.validateSQLQuery(code)
        break
      case 'code':
        if (!code || !language) {
          return json({ error: '코드와 언어가 필요합니다.' }, { status: 400 })
        }
        validationResult = AICodingValidator.validateCode(code, language)
        break
      default:
        return json({ error: '지원하지 않는 검증 타입입니다.' }, { status: 400 })
    }

    console.log(`✅ [AI 코딩 검증] 완료 - ${validationResult.isValid ? '통과' : '실패'}`)

    return json({
      success: true,
      validationType,
      name,
      code: code || null,
      language: language || null,
      validationResult,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI coding validation error:', error)
    return json(
      {
        success: false,
        error: 'AI 코딩 검증 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
