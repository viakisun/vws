// 참여연구원 인건비 일관성 검증기

import { ValidationUtils } from './validation'

export interface PersonnelCostConsistencyResult {
	isValid: boolean
	issues: string[]
	warnings: string[]
	details: {
		projectId: string
		projectTitle: string
		periodNumber: number
		budgetedPersonnelCost: number
		actualPersonnelCost: number
		spentPersonnelCost: number
		difference: number
		participatingMembers: Array<{
			memberId: string
			memberName: string
			participationRate: number
			monthlyAmount: number
			calculatedCost: number
		}>
	}
}

export class PersonnelCostConsistencyValidator {
	/**
	 * 참여연구원 인건비 일관성 검증
	 */
	static async validatePersonnelCostConsistency(
		projectId: string,
		periodNumber?: number
	): Promise<PersonnelCostConsistencyResult> {
		try {
			console.log(`🔍 [인건비 일관성 검증] 프로젝트: ${projectId}, 연차: ${periodNumber || '전체'}`)

			const issues: string[] = []
			const warnings: string[] = []
			const details: any = {
				projectId,
				projectTitle: '',
				periodNumber: periodNumber || 0,
				budgetedPersonnelCost: 0,
				actualPersonnelCost: 0,
				spentPersonnelCost: 0,
				difference: 0,
				participatingMembers: []
			}

			// 1. 프로젝트 정보 조회
			const project = await ValidationUtils.getProjectById(projectId)
			if (!project) {
				issues.push('프로젝트를 찾을 수 없습니다.')
				return ValidationUtils.createValidationResult(false, issues, warnings, details)
			}

			details.projectTitle = project.title

			// 2. 프로젝트 예산 정보 조회
			const projectBudgets = await ValidationUtils.getProjectBudgets(projectId, periodNumber)
			if (!projectBudgets || projectBudgets.length === 0) {
				issues.push('프로젝트 예산 정보를 찾을 수 없습니다.')
				return ValidationUtils.createValidationResult(false, issues, warnings, details)
			}

			// 3. 참여연구원 정보 조회
			const projectMembers = await ValidationUtils.getProjectMembers(projectId)
			if (!projectMembers || projectMembers.length === 0) {
				issues.push('참여연구원 정보를 찾을 수 없습니다.')
				return ValidationUtils.createValidationResult(false, issues, warnings, details)
			}

			// 4. 증빙 항목 정보 조회 (인건비 관련)
			const evidenceItems = await ValidationUtils.getEvidenceItems(projectId, 'personnel_cost')

			// 5. 각 연차별 검증
			for (const budget of projectBudgets) {
				const currentPeriodNumber = budget.period_number
				const budgetedPersonnelCost = parseFloat(budget.personnel_cost || '0')
				const spentPersonnelCost = parseFloat(budget.spent_amount || '0')

				// 6. 해당 연차의 참여연구원 인건비 계산
				const actualPersonnelCost = this.calculateActualPersonnelCost(
					projectMembers,
					budget.start_date,
					budget.end_date
				)

				// 7. 일관성 검증
				const difference = Math.abs(actualPersonnelCost - budgetedPersonnelCost)
				const tolerance = budgetedPersonnelCost * 0.01 // 1% 허용 오차

				if (difference > tolerance) {
					issues.push(
						`${currentPeriodNumber}차년도 인건비 불일치: 예산 ${budgetedPersonnelCost.toLocaleString()}원 vs 실제 ${actualPersonnelCost.toLocaleString()}원 (차이: ${difference.toLocaleString()}원)`
					)
				}

				// 8. 사용액 검증 (이번달까지의 실제 사용액)
				const currentDate = new Date()
				const budgetEndDate = new Date(budget.end_date)
				const isCurrentPeriod = currentDate <= budgetEndDate

				if (isCurrentPeriod) {
					// 현재 진행 중인 연차의 경우, 이번달까지의 실제 사용액 계산
					const actualSpentAmount = this.calculateActualSpentAmount(
						evidenceItems,
						budget.start_date,
						currentDate
					)

					const spentDifference = Math.abs(actualSpentAmount - spentPersonnelCost)
					const spentTolerance = budgetedPersonnelCost * 0.05 // 5% 허용 오차

					if (spentDifference > spentTolerance) {
						issues.push(
							`${currentPeriodNumber}차년도 사용액 불일치: 기록된 사용액 ${spentPersonnelCost.toLocaleString()}원 vs 실제 사용액 ${actualSpentAmount.toLocaleString()}원 (차이: ${spentDifference.toLocaleString()}원)`
						)
					}
				}

				// 9. 상세 정보 저장
				if (periodNumber && currentPeriodNumber === periodNumber) {
					details.periodNumber = currentPeriodNumber
					details.budgetedPersonnelCost = budgetedPersonnelCost
					details.actualPersonnelCost = actualPersonnelCost
					details.spentPersonnelCost = spentPersonnelCost
					details.difference = difference
					details.participatingMembers = this.getParticipatingMembersDetails(
						projectMembers,
						budget.start_date,
						budget.end_date
					)
				}
			}

			const isValid = issues.length === 0
			console.log(`✅ [인건비 일관성 검증] 완료: ${isValid ? '통과' : '실패'}`)

			return ValidationUtils.createValidationResult(isValid, issues, warnings, details)
		} catch (error) {
			console.error('❌ [인건비 일관성 검증] 오류:', error)
			return ValidationUtils.createValidationResult(false, [`검증 중 오류 발생: ${error}`], [], {})
		}
	}

	/**
	 * 실제 인건비 계산
	 */
	private static calculateActualPersonnelCost(
		projectMembers: any[],
		startDate: string,
		endDate: string
	): number {
		let totalCost = 0

		for (const member of projectMembers) {
			// 참여 기간과 예산 기간의 교집합 계산
			const memberStartDate = new Date(member.start_date)
			const memberEndDate = new Date(member.end_date)
			const budgetStartDate = new Date(startDate)
			const budgetEndDate = new Date(endDate)

			// 교집합 기간 계산
			const actualStartDate = new Date(
				Math.max(memberStartDate.getTime(), budgetStartDate.getTime())
			)
			const actualEndDate = new Date(Math.min(memberEndDate.getTime(), budgetEndDate.getTime()))

			if (actualStartDate <= actualEndDate) {
				// 참여 기간이 있는 경우
				const monthsDiff = ValidationUtils.getMonthsDifference(actualStartDate, actualEndDate)
				const monthlyAmount = parseFloat(member.monthly_amount || '0')
				const participationRate = parseFloat(member.participation_rate || '0') / 100

				const memberCost = monthlyAmount * participationRate * monthsDiff
				totalCost += memberCost
			}
		}

		return totalCost
	}

	/**
	 * 실제 사용액 계산 (이번달까지)
	 */
	private static calculateActualSpentAmount(
		evidenceItems: any[],
		startDate: string,
		currentDate: Date
	): number {
		let totalSpent = 0

		for (const item of evidenceItems) {
			const itemDate = new Date(item.due_date)
			const budgetStartDate = new Date(startDate)

			// 이번달까지의 증빙 항목만 계산
			if (itemDate >= budgetStartDate && itemDate <= currentDate) {
				totalSpent += parseFloat(item.amount || '0')
			}
		}

		return totalSpent
	}

	/**
	 * 참여연구원 상세 정보
	 */
	private static getParticipatingMembersDetails(
		projectMembers: any[],
		startDate: string,
		endDate: string
	): any[] {
		const members: any[] = []

		for (const member of projectMembers) {
			const memberStartDate = new Date(member.start_date)
			const memberEndDate = new Date(member.end_date)
			const budgetStartDate = new Date(startDate)
			const budgetEndDate = new Date(endDate)

			const actualStartDate = new Date(
				Math.max(memberStartDate.getTime(), budgetStartDate.getTime())
			)
			const actualEndDate = new Date(Math.min(memberEndDate.getTime(), budgetEndDate.getTime()))

			if (actualStartDate <= actualEndDate) {
				const monthsDiff = ValidationUtils.getMonthsDifference(actualStartDate, actualEndDate)
				const monthlyAmount = parseFloat(member.monthly_amount || '0')
				const participationRate = parseFloat(member.participation_rate || '0') / 100
				const calculatedCost = monthlyAmount * participationRate * monthsDiff

				members.push({
					memberId: member.id,
					memberName: member.employee_name || 'Unknown',
					participationRate: parseFloat(member.participation_rate || '0'),
					monthlyAmount,
					calculatedCost
				})
			}
		}

		return members
	}

	/**
	 * 자동 수정 실행
	 */
	static async autoFixPersonnelCostConsistency(
		projectId: string,
		periodNumber?: number
	): Promise<{ success: boolean; message: string; fixedIssues: string[] }> {
		try {
			console.log(
				`🔧 [인건비 일관성 자동 수정] 프로젝트: ${projectId}, 연차: ${periodNumber || '전체'}`
			)

			const fixedIssues: string[] = []

			// 1. 검증 실행
			const validation = await this.validatePersonnelCostConsistency(projectId, periodNumber)

			if (validation.isValid) {
				return {
					success: true,
					message: '수정할 문제가 없습니다.',
					fixedIssues: []
				}
			}

			// 2. 프로젝트 예산 정보 조회
			const projectBudgets = await ValidationUtils.getProjectBudgets(projectId, periodNumber)
			const projectMembers = await ValidationUtils.getProjectMembers(projectId)

			// 3. 각 연차별 자동 수정
			for (const budget of projectBudgets) {
				const actualPersonnelCost = this.calculateActualPersonnelCost(
					projectMembers,
					budget.start_date,
					budget.end_date
				)

				// 예산 금액을 실제 인건비로 수정
				await ValidationUtils.updateProjectBudget(budget.id, {
					personnel_cost: actualPersonnelCost.toString()
				})

				fixedIssues.push(
					`${budget.period_number}차년도 인건비 예산을 ${actualPersonnelCost.toLocaleString()}원으로 수정`
				)
			}

			// 4. 프로젝트 총 예산 업데이트
			const totalBudget = projectBudgets.reduce((sum, budget) => {
				return (
					sum +
					parseFloat(budget.personnel_cost || '0') +
					parseFloat(budget.research_material_cost || '0') +
					parseFloat(budget.research_activity_cost || '0') +
					parseFloat(budget.indirect_cost || '0')
				)
			}, 0)

			await ValidationUtils.updateProject(projectId, {
				budget_total: totalBudget.toString()
			})

			fixedIssues.push(`프로젝트 총 예산을 ${totalBudget.toLocaleString()}원으로 수정`)

			console.log(`✅ [인건비 일관성 자동 수정] 완료: ${fixedIssues.length}개 수정`)

			return {
				success: true,
				message: `${fixedIssues.length}개의 문제를 자동으로 수정했습니다.`,
				fixedIssues
			}
		} catch (error) {
			console.error('❌ [인건비 일관성 자동 수정] 오류:', error)
			return {
				success: false,
				message: `자동 수정 중 오류 발생: ${error}`,
				fixedIssues: []
			}
		}
	}
}



