import { ParticipationRateValidator, ValidationUtils } from '$lib/utils/validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
	try {
		const projectId = url.searchParams.get('projectId')

		if (!projectId) {
			return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
		}

		console.log(`🔍 [참여율 검증] 프로젝트 ${projectId} 검증 시작`)

		// 프로젝트 기본 정보 및 참여연구원 조회
		const [project, members] = await Promise.all([
			ValidationUtils.getProjectInfo(projectId),
			ValidationUtils.getProjectMembers(projectId)
		])

		console.log(`📋 프로젝트: ${project.title}`)

		// 참여율 검증
		const validation = ParticipationRateValidator.validateParticipationRate(members)

		const validationResults = [
			{
				validationType: 'participation_rate',
				validation,
				details: {
					members: members.map(member => ({
						id: member.id,
						name: `${member.first_name} ${member.last_name}`,
						role: member.role,
						participationRate: parseFloat(member.participation_rate) || 0,
						participationPeriod: `${member.start_date} ~ ${member.end_date}`,
						monthlyAmount: parseFloat(member.monthly_amount) || 0
					})),
					participationRateSummary: {
						totalMembers: members.length,
						over100Percent: members.filter(
							member => (parseFloat(member.participation_rate) || 0) > 100
						).length,
						averageParticipationRate:
							members.reduce(
								(sum, member) => sum + (parseFloat(member.participation_rate) || 0),
								0
							) / members.length
					}
				}
			}
		]

		// 전체 검증 결과 생성
		const overallValidation = ValidationUtils.createOverallValidation(validationResults)

		console.log(`✅ [참여율 검증] 완료 - ${validation.isValid ? '✅ 통과' : '❌ 실패'}`)

		return json(
			ValidationUtils.createValidationResponse(
				projectId,
				project.title,
				validationResults,
				overallValidation
			)
		)
	} catch (error) {
		console.error('Member validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '참여율 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { projectId, autoFix = false } = await request.json()

		if (!projectId) {
			return json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 })
		}

		console.log(`🔧 [참여율 검증] 프로젝트 ${projectId} ${autoFix ? '자동 수정' : '검증'} 시작`)

		// 프로젝트 기본 정보 및 참여연구원 조회
		const [project, members] = await Promise.all([
			ValidationUtils.getProjectInfo(projectId),
			ValidationUtils.getProjectMembers(projectId)
		])

		console.log(`📋 프로젝트: ${project.title}`)

		// 참여율 검증
		const validation = ParticipationRateValidator.validateParticipationRate(members)

		const fixes = []

		// 자동 수정이 활성화되고 불일치가 있는 경우
		if (autoFix && !validation.isValid) {
			for (const member of members) {
				const participationRate = parseFloat(member.participation_rate) || 0

				// 100%를 초과하는 참여율을 100%로 조정
				if (participationRate > 100) {
					await ValidationUtils.pool.query(
						'UPDATE project_members SET participation_rate = $1 WHERE id = $2',
						[100, member.id]
					)

					fixes.push({
						memberId: member.id,
						memberName: `${member.first_name} ${member.last_name}`,
						action: 'participation_rate_adjusted',
						oldValue: participationRate,
						newValue: 100
					})

					console.log(
						`🔧 ${member.first_name} ${member.last_name} 참여율 수정: ${participationRate}% → 100%`
					)
				}
			}
		}

		const validationResults = [
			{
				validationType: 'participation_rate',
				validation,
				details: {
					members: members.map(member => ({
						id: member.id,
						name: `${member.first_name} ${member.last_name}`,
						role: member.role,
						participationRate: parseFloat(member.participation_rate) || 0,
						participationPeriod: `${member.start_date} ~ ${member.end_date}`,
						monthlyAmount: parseFloat(member.monthly_amount) || 0
					})),
					participationRateSummary: {
						totalMembers: members.length,
						over100Percent: members.filter(
							member => (parseFloat(member.participation_rate) || 0) > 100
						).length,
						averageParticipationRate:
							members.reduce(
								(sum, member) => sum + (parseFloat(member.participation_rate) || 0),
								0
							) / members.length
					}
				},
				fixed: autoFix && !validation.isValid
			}
		]

		// 전체 검증 결과 생성
		const overallValidation = ValidationUtils.createOverallValidation(validationResults)

		console.log(
			`✅ [참여율 검증] 완료 - ${validation.isValid ? '✅ 통과' : '❌ 실패'}${fixes.length > 0 ? `, ${fixes.length}개 수정` : ''}`
		)

		return json({
			...ValidationUtils.createValidationResponse(
				projectId,
				project.title,
				validationResults,
				overallValidation
			),
			fixes: fixes.length > 0 ? fixes : undefined
		})
	} catch (error) {
		console.error('Member validation error:', error)
		return json(ValidationUtils.createErrorResponse(error, '참여율 검증 중 오류가 발생했습니다.'), {
			status: 500
		})
	}
}
