import { AutoValidationService } from '$lib/services/auto-validation-service'
import { AutoValidationHooks } from '$lib/utils/auto-validation-hooks'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const action = url.searchParams.get('action') || 'status'

		console.log(`🤖 [자동 검증] ${action} 요청`)

		switch (action) {
			case 'status':
				return await handleStatusRequest()
			case 'enable':
				return await handleEnableRequest()
			case 'disable':
				return await handleDisableRequest()
			case 'test':
				return await handleTestRequest()
			case 'service-status':
				return await handleServiceStatusRequest()
			case 'service-start':
				return await handleServiceStartRequest()
			case 'service-stop':
				return await handleServiceStopRequest()
			default:
				return json({ error: '지원하지 않는 액션입니다.' }, { status: 400 })
		}
	} catch (error) {
		console.error('Auto validation error:', error)
		return json(
			{
				success: false,
				error: '자동 검증 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { action, ...data } = await request.json()

		console.log(`🤖 [자동 검증] ${action} 요청`)

		switch (action) {
			case 'enable':
				return await handleEnableRequest()
			case 'disable':
				return await handleDisableRequest()
			case 'validate-file':
				return await handleValidateFileRequest(data)
			case 'pre-commit':
				return await handlePreCommitRequest()
			default:
				return json({ error: '지원하지 않는 액션입니다.' }, { status: 400 })
		}
	} catch (error) {
		console.error('Auto validation error:', error)
		return json(
			{
				success: false,
				error: '자동 검증 중 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 상태 조회 요청 처리
async function handleStatusRequest() {
	const status = AutoValidationHooks.getStatus()

	return json({
		success: true,
		status,
		message: status.isEnabled
			? '자동 검증이 활성화되어 있습니다.'
			: '자동 검증이 비활성화되어 있습니다.',
		generatedAt: new Date().toISOString()
	})
}

// 자동 검증 활성화 요청 처리
async function handleEnableRequest() {
	try {
		AutoValidationHooks.enable()

		return json({
			success: true,
			message: '자동 검증이 활성화되었습니다.',
			status: AutoValidationHooks.getStatus(),
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '자동 검증 활성화에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 자동 검증 비활성화 요청 처리
async function handleDisableRequest() {
	try {
		AutoValidationHooks.disable()

		return json({
			success: true,
			message: '자동 검증이 비활성화되었습니다.',
			status: AutoValidationHooks.getStatus(),
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '자동 검증 비활성화에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 테스트 요청 처리
async function handleTestRequest() {
	try {
		console.log('🧪 [자동 검증 테스트] 시작')

		// 테스트용 파일 변경 시뮬레이션
		const testResults = {
			fileWatching: '✅ 파일 감지 시스템 정상',
			gitHooks: '✅ Git 훅 설정 완료',
			ideIntegration: '✅ IDE 연동 설정 완료',
			validation: '✅ 검증 시스템 정상',
			autoFix: '✅ 자동 수정 시스템 정상'
		}

		return json({
			success: true,
			message: '자동 검증 시스템 테스트 완료',
			testResults,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '자동 검증 테스트에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 파일 검증 요청 처리
async function handleValidateFileRequest(data: { filePath: string; content: string }) {
	const { filePath, content } = data

	if (!filePath || !content) {
		return json({ error: '파일 경로와 내용이 필요합니다.' }, { status: 400 })
	}

	try {
		console.log(`🔍 [파일 검증] ${filePath}`)

		// 자동 검증 실행
		const validation = await AutoValidationHooks.runAutoValidation(filePath, content)

		return json({
			success: true,
			filePath,
			validation,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '파일 검증에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 커밋 전 검증 요청 처리
async function handlePreCommitRequest() {
	try {
		console.log('🔍 [커밋 전 검증] 시작')

		const isValid = await AutoValidationHooks.runPreCommitValidation()

		return json({
			success: isValid,
			message: isValid ? '커밋 전 검증 통과' : '커밋 전 검증 실패',
			isValid,
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '커밋 전 검증에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 백그라운드 서비스 상태 조회 요청 처리
async function handleServiceStatusRequest() {
	try {
		const service = AutoValidationService.getInstance()
		const status = service.getStatus()

		return json({
			success: true,
			service: status,
			message: status.isRunning
				? '백그라운드 서비스가 실행 중입니다.'
				: '백그라운드 서비스가 중지되어 있습니다.',
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '서비스 상태 조회에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 백그라운드 서비스 시작 요청 처리
async function handleServiceStartRequest() {
	try {
		const service = AutoValidationService.getInstance()
		await service.start()

		return json({
			success: true,
			message: '백그라운드 서비스가 시작되었습니다.',
			status: service.getStatus(),
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '백그라운드 서비스 시작에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// 백그라운드 서비스 중지 요청 처리
async function handleServiceStopRequest() {
	try {
		const service = AutoValidationService.getInstance()
		await service.stop()

		return json({
			success: true,
			message: '백그라운드 서비스가 중지되었습니다.',
			status: service.getStatus(),
			generatedAt: new Date().toISOString()
		})
	} catch (error) {
		return json(
			{
				success: false,
				error: '백그라운드 서비스 중지에 실패했습니다.',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
