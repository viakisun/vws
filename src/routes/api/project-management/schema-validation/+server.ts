import { SchemaValidator } from '$lib/utils/schema-validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const validationType = url.searchParams.get('type') || 'all'

		console.log(`🔍 [스키마 검증] ${validationType} 검증 시작`)

		let results: any[] = []
		let summary = {
			total: 0,
			valid: 0,
			invalid: 0,
			issues: [] as string[]
		}

		// 1. 데이터베이스 스키마 검증
		if (validationType === 'all' || validationType === 'schema') {
			console.log('📋 [데이터베이스 스키마 검증] 시작')
			const schemaResults = await SchemaValidator.validateDatabaseSchema()
			results.push(
				...schemaResults.map(result => ({
					...result,
					validationType: 'schema'
				}))
			)
		}

		// 2. 칼럼명 일관성 검증
		if (validationType === 'all' || validationType === 'naming') {
			console.log('📝 [칼럼명 일관성 검증] 시작')
			const namingResults = await SchemaValidator.validateColumnNamingConsistency()
			results.push(
				...namingResults.map(result => ({
					...result,
					validationType: 'naming'
				}))
			)
		}

		// 3. 스키마 규칙 조회
		if (validationType === 'rules') {
			console.log('📚 [스키마 규칙 조회] 시작')
			const rules = SchemaValidator.getSchemaRules()
			return json({
				success: true,
				validationType: 'rules',
				rules,
				generatedAt: new Date().toISOString()
			})
		}

		// 결과 요약
		summary.total = results.length
		summary.valid = results.filter(r => r.isValid).length
		summary.invalid = results.filter(r => !r.isValid).length
		summary.issues = results.filter(r => !r.isValid).flatMap(r => r.issues)

		console.log(
			`✅ [스키마 검증] 완료 - ${summary.valid}/${summary.total}개 통과, ${summary.invalid}개 문제`
		)

		return json({
			success: true,
			validationType,
			results,
			summary,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		console.error('Schema validation error:', error)
		return json(
			{
				success: false,
				error: '스키마 검증 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { query, tableName, validationType = 'query' } = await request.json()

		if (!query || !tableName) {
			return json({ error: '쿼리와 테이블명이 필요합니다.' }, { status: 400 })
		}

		console.log(`🔍 [쿼리 검증] 테이블 ${tableName} 쿼리 검증 시작`)

		// 쿼리 칼럼 검증
		const results = SchemaValidator.validateQueryColumns(query, tableName)

		const summary = {
			total: results.length,
			valid: results.filter(r => r.isValid).length,
			invalid: results.filter(r => !r.isValid).length,
			issues: results.filter(r => !r.isValid).flatMap(r => r.issues)
		}

		console.log(
			`✅ [쿼리 검증] 완료 - ${summary.valid}/${summary.total}개 통과, ${summary.invalid}개 문제`
		)

		return json({
			success: true,
			validationType,
			query,
			tableName,
			results,
			summary,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		console.error('Query validation error:', error)
		return json(
			{
				success: false,
				error: '쿼리 검증 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}






