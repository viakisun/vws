// 시간대 검증기

import { ValidationUtils } from './validation'
import { toUTC } from './date-handler'

export interface TimezoneValidationResult {
	isValid: boolean
	issues: string[]
	warnings: string[]
	details: {
		projectId: string
		projectTitle: string
		timezoneIssues: Array<{
			type: 'start_date' | 'end_date' | 'due_date' | 'hire_date' | 'termination_date'
			field: string
			value: string
			expectedValue: string
			description: string
		}>
	}
}

export class TimezoneValidator {
	// 서울 시간대 (UTC+9)
	private static readonly SEOUL_TIMEZONE = 'Asia/Seoul'
	private static readonly SEOUL_OFFSET = 9 * 60 // 9시간을 분으로 변환

	/**
	 * 시간대 검증
	 */
	static async validateTimezone(projectId: string): Promise<TimezoneValidationResult> {
		try {
			console.log(`🕐 [시간대 검증] 프로젝트: ${projectId}`)

			const issues: string[] = []
			const warnings: string[] = []
			const timezoneIssues: any[] = []

			// 1. 프로젝트 정보 조회
			const project = await ValidationUtils.getProjectById(projectId)
			if (!project) {
				issues.push('프로젝트를 찾을 수 없습니다.')
				return ValidationUtils.createValidationResult(false, issues, warnings, {
					projectId,
					projectTitle: '',
					timezoneIssues: []
				})
			}

			// 2. 프로젝트 시작/종료 날짜 검증
			await this.validateProjectDates(project, timezoneIssues)

			// 3. 프로젝트 예산 날짜 검증
			const projectBudgets = await ValidationUtils.getProjectBudgets(projectId)
			if (projectBudgets) {
				await this.validateBudgetDates(projectBudgets, timezoneIssues)
			}

			// 4. 참여연구원 날짜 검증
			const projectMembers = await ValidationUtils.getProjectMembers(projectId)
			if (projectMembers) {
				await this.validateMemberDates(projectMembers, timezoneIssues)
			}

			// 5. 증빙 항목 날짜 검증
			const evidenceItems = await ValidationUtils.getEvidenceItems(projectId)
			if (evidenceItems) {
				await this.validateEvidenceDates(evidenceItems, timezoneIssues)
			}

			// 6. 문제가 있으면 issues에 추가
			if (timezoneIssues.length > 0) {
				timezoneIssues.forEach(issue => {
					issues.push(issue.description)
				})
			}

			const isValid = issues.length === 0
			console.log(`✅ [시간대 검증] 완료: ${isValid ? '통과' : '실패'}`)

			return ValidationUtils.createValidationResult(isValid, issues, warnings, {
				projectId,
				projectTitle: project.title,
				timezoneIssues
			})
		} catch (error) {
			console.error('❌ [시간대 검증] 오류:', error)
			return ValidationUtils.createValidationResult(false, [`검증 중 오류 발생: ${error}`], [], {
				projectId,
				projectTitle: '',
				timezoneIssues: []
			})
		}
	}

	/**
	 * 프로젝트 날짜 검증
	 */
	private static async validateProjectDates(project: any, timezoneIssues: any[]): Promise<void> {
		// 시작 날짜 검증
		if (project.start_date) {
			const startDate = new Date(project.start_date)
			const expectedStartDate = this.getExpectedSeoulDate(startDate)

			if (!this.isValidSeoulDate(startDate)) {
				timezoneIssues.push({
					type: 'start_date',
					field: 'start_date',
					value: project.start_date,
					expectedValue: toUTC(expectedStartDate),
					description: `프로젝트 시작일이 서울시간 기준이 아닙니다. 현재: ${project.start_date}, 예상: ${toUTC(expectedStartDate)}`
				})
			}
		}

		// 종료 날짜 검증
		if (project.end_date) {
			const endDate = new Date(project.end_date)
			const expectedEndDate = this.getExpectedSeoulDate(endDate)

			if (!this.isValidSeoulDate(endDate)) {
				timezoneIssues.push({
					type: 'end_date',
					field: 'end_date',
					value: project.end_date,
					expectedValue: toUTC(expectedEndDate),
					description: `프로젝트 종료일이 서울시간 기준이 아닙니다. 현재: ${project.end_date}, 예상: ${toUTC(expectedEndDate)}`
				})
			}
		}
	}

	/**
	 * 예산 날짜 검증
	 */
	private static async validateBudgetDates(
		projectBudgets: any[],
		timezoneIssues: any[]
	): Promise<void> {
		for (const budget of projectBudgets) {
			// 시작 날짜 검증
			if (budget.start_date) {
				const startDate = new Date(budget.start_date)
				const expectedStartDate = this.getExpectedSeoulDate(startDate)

				if (!this.isValidSeoulDate(startDate)) {
					timezoneIssues.push({
						type: 'start_date',
						field: `budget_${budget.period_number}_start_date`,
						value: budget.start_date,
						expectedValue: toUTC(expectedStartDate),
						description: `${budget.period_number}차년도 시작일이 서울시간 기준이 아닙니다. 현재: ${budget.start_date}, 예상: ${toUTC(expectedStartDate)}`
					})
				}
			}

			// 종료 날짜 검증
			if (budget.end_date) {
				const endDate = new Date(budget.end_date)
				const expectedEndDate = this.getExpectedSeoulDate(endDate)

				if (!this.isValidSeoulDate(endDate)) {
					timezoneIssues.push({
						type: 'end_date',
						field: `budget_${budget.period_number}_end_date`,
						value: budget.end_date,
						expectedValue: toUTC(expectedEndDate),
						description: `${budget.period_number}차년도 종료일이 서울시간 기준이 아닙니다. 현재: ${budget.end_date}, 예상: ${toUTC(expectedEndDate)}`
					})
				}
			}
		}
	}

	/**
	 * 참여연구원 날짜 검증
	 */
	private static async validateMemberDates(
		projectMembers: any[],
		timezoneIssues: any[]
	): Promise<void> {
		for (const member of projectMembers) {
			// 시작 날짜 검증
			if (member.start_date) {
				const startDate = new Date(member.start_date)
				const expectedStartDate = this.getExpectedSeoulDate(startDate)

				if (!this.isValidSeoulDate(startDate)) {
					timezoneIssues.push({
						type: 'start_date',
						field: `member_${member.id}_start_date`,
						value: member.start_date,
						expectedValue: toUTC(expectedStartDate),
						description: `참여연구원 ${member.employee_name || member.id} 시작일이 서울시간 기준이 아닙니다. 현재: ${member.start_date}, 예상: ${toUTC(expectedStartDate)}`
					})
				}
			}

			// 종료 날짜 검증
			if (member.end_date) {
				const endDate = new Date(member.end_date)
				const expectedEndDate = this.getExpectedSeoulDate(endDate)

				if (!this.isValidSeoulDate(endDate)) {
					timezoneIssues.push({
						type: 'end_date',
						field: `member_${member.id}_end_date`,
						value: member.end_date,
						expectedValue: toUTC(expectedEndDate),
						description: `참여연구원 ${member.employee_name || member.id} 종료일이 서울시간 기준이 아닙니다. 현재: ${member.end_date}, 예상: ${toUTC(expectedEndDate)}`
					})
				}
			}
		}
	}

	/**
	 * 증빙 항목 날짜 검증
	 */
	private static async validateEvidenceDates(
		evidenceItems: any[],
		timezoneIssues: any[]
	): Promise<void> {
		for (const item of evidenceItems) {
			// 마감일 검증
			if (item.due_date) {
				const dueDate = new Date(item.due_date)
				const expectedDueDate = this.getExpectedSeoulDate(dueDate)

				if (!this.isValidSeoulDate(dueDate)) {
					timezoneIssues.push({
						type: 'due_date',
						field: `evidence_${item.id}_due_date`,
						value: item.due_date,
						expectedValue: expectedDueDate.toISOString(),
						description: `증빙 항목 ${item.name || item.id} 마감일이 서울시간 기준이 아닙니다. 현재: ${item.due_date}, 예상: ${expectedDueDate.toISOString()}`
					})
				}
			}
		}
	}

	/**
	 * 서울시간 기준 유효한 날짜인지 확인
	 */
	private static isValidSeoulDate(date: Date): boolean {
		// 서울시간 기준으로 날짜가 시작되는지 확인
		// 예: 2024-01-01T00:00:00.000Z (UTC) -> 2024-01-01T09:00:00.000Z (서울시간)
		const seoulDate = new Date(date.getTime() + this.SEOUL_OFFSET * 60 * 1000)

		// 시간이 00:00:00인지 확인 (하루의 시작)
		return (
			seoulDate.getHours() === 0 && seoulDate.getMinutes() === 0 && seoulDate.getSeconds() === 0
		)
	}

	/**
	 * 예상되는 서울시간 기준 날짜 반환
	 */
	private static getExpectedSeoulDate(date: Date): Date {
		// UTC 시간을 서울시간으로 변환
		const seoulDate = new Date(date.getTime() + this.SEOUL_OFFSET * 60 * 1000)

		// 하루의 시작 시간으로 설정
		seoulDate.setHours(0, 0, 0, 0)

		// 다시 UTC로 변환
		return new Date(seoulDate.getTime() - this.SEOUL_OFFSET * 60 * 1000)
	}

	/**
	 * 자동 수정 실행
	 */
	static async autoFixTimezone(
		projectId: string
	): Promise<{ success: boolean; message: string; fixedIssues: string[] }> {
		try {
			console.log(`🔧 [시간대 자동 수정] 프로젝트: ${projectId}`)

			const fixedIssues: string[] = []

			// 1. 검증 실행
			const validation = await this.validateTimezone(projectId)

			if (validation.isValid) {
				return {
					success: true,
					message: '수정할 시간대 문제가 없습니다.',
					fixedIssues: []
				}
			}

			// 2. 프로젝트 날짜 수정
			const project = await ValidationUtils.getProjectById(projectId)
			if (project) {
				if (project.start_date) {
					const startDate = new Date(project.start_date)
					const correctedStartDate = this.getExpectedSeoulDate(startDate)

					await ValidationUtils.updateProject(projectId, {
						start_date: toUTC(correctedStartDate)
					})

					fixedIssues.push(`프로젝트 시작일을 ${toUTC(correctedStartDate)}로 수정`)
				}

				if (project.end_date) {
					const endDate = new Date(project.end_date)
					const correctedEndDate = this.getExpectedSeoulDate(endDate)

					await ValidationUtils.updateProject(projectId, {
						end_date: toUTC(correctedEndDate)
					})

					fixedIssues.push(`프로젝트 종료일을 ${toUTC(correctedEndDate)}로 수정`)
				}
			}

			// 3. 예산 날짜 수정
			const projectBudgets = await ValidationUtils.getProjectBudgets(projectId)
			if (projectBudgets) {
				for (const budget of projectBudgets) {
					if (budget.start_date) {
						const startDate = new Date(budget.start_date)
						const correctedStartDate = this.getExpectedSeoulDate(startDate)

						await ValidationUtils.updateProjectBudget(budget.id, {
							start_date: toUTC(correctedStartDate)
						})

						fixedIssues.push(
							`${budget.period_number}차년도 시작일을 ${toUTC(correctedStartDate)}로 수정`
						)
					}

					if (budget.end_date) {
						const endDate = new Date(budget.end_date)
						const correctedEndDate = this.getExpectedSeoulDate(endDate)

						await ValidationUtils.updateProjectBudget(budget.id, {
							end_date: toUTC(correctedEndDate)
						})

						fixedIssues.push(
							`${budget.period_number}차년도 종료일을 ${toUTC(correctedEndDate)}로 수정`
						)
					}
				}
			}

			// 4. 참여연구원 날짜 수정
			const projectMembers = await ValidationUtils.getProjectMembers(projectId)
			if (projectMembers) {
				for (const member of projectMembers) {
					if (member.start_date) {
						const startDate = new Date(member.start_date)
						const correctedStartDate = this.getExpectedSeoulDate(startDate)

						await ValidationUtils.updateProjectMember(member.id, {
							start_date: toUTC(correctedStartDate)
						})

						fixedIssues.push(
							`참여연구원 ${member.employee_name || member.id} 시작일을 ${toUTC(correctedStartDate)}로 수정`
						)
					}

					if (member.end_date) {
						const endDate = new Date(member.end_date)
						const correctedEndDate = this.getExpectedSeoulDate(endDate)

						await ValidationUtils.updateProjectMember(member.id, {
							end_date: toUTC(correctedEndDate)
						})

						fixedIssues.push(
							`참여연구원 ${member.employee_name || member.id} 종료일을 ${toUTC(correctedEndDate)}로 수정`
						)
					}
				}
			}

			// 5. 증빙 항목 날짜 수정
			const evidenceItems = await ValidationUtils.getEvidenceItems(projectId)
			if (evidenceItems) {
				for (const item of evidenceItems) {
					if (item.due_date) {
						const dueDate = new Date(item.due_date)
						const correctedDueDate = this.getExpectedSeoulDate(dueDate)

						await ValidationUtils.updateEvidenceItem(item.id, {
							due_date: toUTC(correctedDueDate)
						})

						fixedIssues.push(
							`증빙 항목 ${item.name || item.id} 마감일을 ${toUTC(correctedDueDate)}로 수정`
						)
					}
				}
			}

			console.log(`✅ [시간대 자동 수정] 완료: ${fixedIssues.length}개 수정`)

			return {
				success: true,
				message: `${fixedIssues.length}개의 시간대 문제를 자동으로 수정했습니다.`,
				fixedIssues
			}
		} catch (error) {
			console.error('❌ [시간대 자동 수정] 오류:', error)
			return {
				success: false,
				message: `자동 수정 중 오류 발생: ${error}`,
				fixedIssues: []
			}
		}
	}
}



