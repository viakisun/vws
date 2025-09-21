import { CodeDependencyAnalyzer } from '$lib/utils/code-dependency-analyzer'
import { SafeChangeManager } from '$lib/utils/safe-change-manager'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const action = url.searchParams.get('action')
		const planId = url.searchParams.get('planId')

		console.log(`🔍 [안전한 변경 관리] ${action || 'list'} 요청`)

		switch (action) {
			case 'analyze':
				return await handleAnalyzeRequest(url)
			case 'plan':
				return await handleGetPlanRequest(planId)
			case 'list':
				return await handleListPlansRequest()
			case 'execute':
				return await handleExecuteRequest(planId)
			case 'rollback':
				return await handleRollbackRequest(planId)
			default:
				return await handleListPlansRequest()
		}
	} catch (error) {
		console.error('Safe change management error:', error)
		return json(
			{
				success: false,
				error: '안전한 변경 관리 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { action, ...data } = await request.json()

		console.log(`🔍 [안전한 변경 관리] ${action} 요청`)

		switch (action) {
			case 'create-plan':
				return await handleCreatePlanRequest(data)
			case 'validate':
				return await handleValidateRequest(data)
			case 'execute':
				return await handleExecutePlanRequest(data)
			case 'rollback':
				return await handleRollbackPlanRequest(data)
			default:
				return json({ error: '지원하지 않는 액션입니다.' }, { status: 400 })
		}
	} catch (error) {
		console.error('Safe change management error:', error)
		return json(
			{
				success: false,
				error: '안전한 변경 관리 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 의존성 분석 요청 처리
async function handleAnalyzeRequest(url: URL) {
	const filePath = url.searchParams.get('filePath')
	const scope = url.searchParams.get('scope') || 'project'

	console.log(`📊 [의존성 분석] ${scope} 분석 시작`)

	if (scope === 'project') {
		const analysis = await CodeDependencyAnalyzer.analyzeProjectDependencies()
		const summary = {
			totalFiles: analysis.size,
			highRiskFiles: Array.from(analysis.values()).filter(
				a => a.riskLevel === 'high' || a.riskLevel === 'critical'
			).length,
			criticalFiles: Array.from(analysis.values()).filter(a => a.riskLevel === 'critical').length
		}

		return json({
			success: true,
			analysis: Object.fromEntries(analysis),
			summary,
			generatedAt: new Date().toISOString()
		})
	} else if (filePath) {
		const analysis = CodeDependencyAnalyzer.analyzeFileDependencies(filePath)
		if (!analysis) {
			return json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })
		}

		return json({
			success: true,
			analysis,
			generatedAt: new Date().toISOString()
		})
	} else {
		return json({ error: '파일 경로가 필요합니다.' }, { status: 400 })
	}
}

// 변경 계획 조회 요청 처리
async function handleGetPlanRequest(planId: string | null) {
	if (!planId) {
		return json({ error: '계획 ID가 필요합니다.' }, { status: 400 })
	}

	const plan = SafeChangeManager.getChangePlan(planId)
	if (!plan) {
		return json({ error: '변경 계획을 찾을 수 없습니다.' }, { status: 404 })
	}

	return json({
		success: true,
		plan,
		generatedAt: new Date().toISOString()
	})
}

// 변경 계획 목록 조회 요청 처리
async function handleListPlansRequest() {
	const plans = SafeChangeManager.getAllChangePlans()
	const summary = {
		total: plans.length,
		pending: plans.filter(p => p.status === 'pending').length,
		inProgress: plans.filter(p => p.status === 'in_progress').length,
		completed: plans.filter(p => p.status === 'completed').length,
		failed: plans.filter(p => p.status === 'failed').length,
		rolledBack: plans.filter(p => p.status === 'rolled_back').length
	}

	return json({
		success: true,
		plans,
		summary,
		generatedAt: new Date().toISOString()
	})
}

// 변경 계획 실행 요청 처리
async function handleExecuteRequest(planId: string | null) {
	if (!planId) {
		return json({ error: '계획 ID가 필요합니다.' }, { status: 400 })
	}

	const result = await SafeChangeManager.executeChangePlan(planId)
	return json({
		success: result.success,
		message: result.message,
		nextStep: result.nextStep,
		generatedAt: new Date().toISOString()
	})
}

// 변경 계획 롤백 요청 처리
async function handleRollbackRequest(planId: string | null) {
	if (!planId) {
		return json({ error: '계획 ID가 필요합니다.' }, { status: 400 })
	}

	const result = await SafeChangeManager.rollbackChangePlan(planId)
	return json({
		success: result.success,
		message: result.message,
		generatedAt: new Date().toISOString()
	})
}

// 변경 계획 생성 요청 처리
async function handleCreatePlanRequest(data: {
	filePath: string
	changeType: 'modify' | 'delete' | 'rename' | 'move' | 'add'
	description: string
}) {
	const { filePath, changeType, description } = data

	if (!filePath || !changeType || !description) {
		return json({ error: '파일 경로, 변경 타입, 설명이 필요합니다.' }, { status: 400 })
	}

	try {
		const plan = await SafeChangeManager.createChangePlan(filePath, changeType, description)
		return json({
			success: true,
			plan,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 변경 검증 요청 처리
async function handleValidateRequest(data: {
	filePath: string
	changeType: 'modify' | 'delete' | 'rename' | 'move' | 'add'
	content: string
}) {
	const { filePath, changeType, content } = data

	if (!filePath || !changeType || !content) {
		return json({ error: '파일 경로, 변경 타입, 내용이 필요합니다.' }, { status: 400 })
	}

	const validation = SafeChangeManager.validateChange(filePath, changeType, content)
	return json({
		success: true,
		validation,
		generatedAt: new Date().toISOString()
	})
}

// 변경 계획 실행 요청 처리 (POST)
async function handleExecutePlanRequest(data: { planId: string }) {
	const { planId } = data

	if (!planId) {
		return json({ error: '계획 ID가 필요합니다.' }, { status: 400 })
	}

	const result = await SafeChangeManager.executeChangePlan(planId)
	return json({
		success: result.success,
		message: result.message,
		nextStep: result.nextStep,
		generatedAt: new Date().toISOString()
	})
}

// 변경 계획 롤백 요청 처리 (POST)
async function handleRollbackPlanRequest(data: { planId: string }) {
	const { planId } = data

	if (!planId) {
		return json({ error: '계획 ID가 필요합니다.' }, { status: 400 })
	}

	const result = await SafeChangeManager.rollbackChangePlan(planId)
	return json({
		success: result.success,
		message: result.message,
		generatedAt: new Date().toISOString()
	})
}






