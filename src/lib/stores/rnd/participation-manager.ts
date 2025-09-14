import { writable, derived, get } from 'svelte/store';
import { employees, projects } from '../rd';
import type { ParticipationAssignment } from './types';
import type { Employee, Project } from '../rd';

// 고도화된 참여율 관리 스토어
export const participationAssignments = writable<ParticipationAssignment[]>([]);
export const participationHistory = writable<ParticipationHistory[]>([]);
export const participationConflicts = writable<ParticipationConflict[]>([]);
export const participationRecommendations = writable<ParticipationRecommendation[]>([]);
// participationHealth와 participationTrends는 derived store로 정의됨

// 참여율 히스토리 인터페이스
export interface ParticipationHistory {
	id: string;
	personId: string;
	projectId: string;
	oldRate: number;
	newRate: number;
	changeReason: string;
	changedBy: string;
	changedAt: string;
	effectiveFrom: string;
	effectiveTo: string;
}

// 참여율 충돌 인터페이스
export interface ParticipationConflict {
	id: string;
	personId: string;
	conflictType: 'overload' | 'underutilization' | 'schedule_conflict' | 'skill_mismatch';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	affectedProjects: string[];
	recommendedActions: string[];
	detectedAt: string;
	resolvedAt?: string;
}

// 참여율 추천 인터페이스
export interface ParticipationRecommendation {
	id: string;
	type: 'rebalance' | 'hire' | 'reduce' | 'optimize';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	title: string;
	description: string;
	affectedPersons: string[];
	affectedProjects: string[];
	estimatedImpact: {
		cost: number;
		benefit: number;
		risk: number;
	};
	recommendedActions: string[];
	createdAt: string;
	expiresAt: string;
}

// 고급 참여율 분석 함수들
export class ParticipationManager {
	// 1. 참여율 충돌 감지
	static detectConflicts(): ParticipationConflict[] {
		const conflicts: ParticipationConflict[] = [];
		const currentAssignments = get(participationAssignments);
		const currentEmployees = get(employees);
		const currentProjects = get(projects);

		// 월별 참여율 분석
		const monthlyAnalysis = this.analyzeMonthlyParticipation();
		
		// 과부하 감지
		monthlyAnalysis.forEach(monthData => {
			monthData.personAnalysis.forEach(personData => {
				if (personData.totalRate > 100) {
					conflicts.push({
						id: crypto.randomUUID(),
						personId: personData.personId,
						conflictType: 'overload',
						severity: personData.totalRate > 120 ? 'critical' : 'high',
						description: `${personData.personName}의 ${monthData.month} 참여율이 ${personData.totalRate}%로 과부하 상태입니다.`,
						affectedProjects: personData.projects.map(p => p.projectId),
						recommendedActions: [
							'참여율 재조정',
							'추가 인력 투입',
							'프로젝트 일정 조정'
						],
						detectedAt: new Date().toISOString()
					});
				}
			});
		});

		// 미활용 감지
		monthlyAnalysis.forEach(monthData => {
			monthData.personAnalysis.forEach(personData => {
				if (personData.totalRate < 50 && personData.totalRate > 0) {
					conflicts.push({
						id: crypto.randomUUID(),
						personId: personData.personId,
						conflictType: 'underutilization',
						severity: personData.totalRate < 30 ? 'medium' : 'low',
						description: `${personData.personName}의 ${monthData.month} 참여율이 ${personData.totalRate}%로 미활용 상태입니다.`,
						affectedProjects: personData.projects.map(p => p.projectId),
						recommendedActions: [
							'추가 프로젝트 배정',
							'교육 및 개발 활동',
							'다른 팀 지원'
						],
						detectedAt: new Date().toISOString()
					});
				}
			});
		});

		// 스킬 불일치 감지
		currentAssignments.forEach(assignment => {
			const employee = currentEmployees.find(e => e.id === assignment.personId);
			const project = currentProjects.find(p => p.id === assignment.projectId);
			
			if (employee && project) {
				const skillMatch = this.calculateSkillMatch(employee, project);
				if (skillMatch < 0.6) {
					conflicts.push({
						id: crypto.randomUUID(),
						personId: assignment.personId,
						conflictType: 'skill_mismatch',
						severity: skillMatch < 0.4 ? 'high' : 'medium',
						description: `${employee.name}의 스킬이 ${project.name} 프로젝트 요구사항과 ${(skillMatch * 100).toFixed(0)}% 일치합니다.`,
						affectedProjects: [assignment.projectId],
						recommendedActions: [
							'스킬 향상 교육',
							'멘토링 프로그램',
							'프로젝트 역할 조정'
						],
						detectedAt: new Date().toISOString()
					});
				}
			}
		});

		participationConflicts.set(conflicts);
		return conflicts;
	}

	// 2. 월별 참여율 분석
	static analyzeMonthlyParticipation(): Array<{
		month: string;
		personAnalysis: Array<{
			personId: string;
			personName: string;
			totalRate: number;
			projects: Array<{
				projectId: string;
				projectName: string;
				rate: number;
			}>;
		}>;
	}> {
		const assignments = get(participationAssignments);
		const employees = get(employees);
		const projects = get(projects);

		// 최근 12개월 분석
		const months = [];
		for (let i = 0; i < 12; i++) {
			const date = new Date();
			date.setMonth(date.getMonth() - i);
			months.push(date.toISOString().slice(0, 7)); // YYYY-MM 형식
		}

		return months.map(month => {
			const personAnalysis = employees.map(employee => {
				const personAssignments = assignments.filter(a => 
					a.personId === employee.id &&
					a.dateFrom <= `${month}-31` &&
					a.dateTo >= `${month}-01`
				);

				const projects = personAssignments.map(assignment => {
					const project = projects.find(p => p.id === assignment.projectId);
					return {
						projectId: assignment.projectId,
						projectName: project?.name || 'Unknown',
						rate: assignment.ratePct
					};
				});

				const totalRate = personAssignments.reduce((sum, a) => sum + a.ratePct, 0);

				return {
					personId: employee.id,
					personName: employee.name,
					totalRate,
					projects
				};
			});

			return { month, personAnalysis };
		});
	}

	// 3. 스킬 매칭 계산
	static calculateSkillMatch(employee: Employee, project: Project): number {
		// 실제 구현에서는 더 정교한 스킬 매칭 알고리즘 사용
		const requiredSkills = project.requiredSkills || [];
		const employeeSkills = employee.skills || [];
		
		if (requiredSkills.length === 0) return 1.0;
		
		const matchedSkills = requiredSkills.filter(skill => 
			employeeSkills.some(empSkill => empSkill.toLowerCase().includes(skill.toLowerCase()))
		);
		
		return matchedSkills.length / requiredSkills.length;
	}

	// 4. 참여율 최적화 추천
	static generateOptimizationRecommendations(): ParticipationRecommendation[] {
		const recommendations: ParticipationRecommendation[] = [];
		const conflicts = get(participationConflicts);
		const monthlyAnalysis = this.analyzeMonthlyParticipation();

		// 과부하 해결 추천
		const overloadConflicts = conflicts.filter(c => c.conflictType === 'overload');
		if (overloadConflicts.length > 0) {
			recommendations.push({
				id: crypto.randomUUID(),
				type: 'rebalance',
				priority: 'high',
				title: '참여율 재조정 필요',
				description: `${overloadConflicts.length}명의 연구원이 과부하 상태입니다. 참여율 재조정이 필요합니다.`,
				affectedPersons: overloadConflicts.map(c => c.personId),
				affectedProjects: [...new Set(overloadConflicts.flatMap(c => c.affectedProjects))],
				estimatedImpact: {
					cost: 0,
					benefit: 5000000, // 생산성 향상
					risk: 0.2
				},
				recommendedActions: [
					'과부하 인력의 참여율 20% 감소',
					'미활용 인력의 참여율 증가',
					'프로젝트 우선순위 재검토'
				],
				createdAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후
			});
		}

		// 신규 채용 추천
		const underutilizationConflicts = conflicts.filter(c => c.conflictType === 'underutilization');
		const totalUnderutilized = underutilizationConflicts.length;
		if (totalUnderutilized === 0) {
			// 모든 인력이 적절히 활용되고 있지만, 프로젝트가 많다면 신규 채용 고려
			const activeProjects = get(projects).filter(p => p.status === 'active');
			const totalEmployees = get(employees).length;
			
			if (activeProjects.length > totalEmployees * 0.8) {
				recommendations.push({
					id: crypto.randomUUID(),
					type: 'hire',
					priority: 'medium',
					title: '신규 연구원 채용 고려',
					description: '프로젝트 수가 인력 대비 많아 신규 채용을 고려해볼 수 있습니다.',
					affectedPersons: [],
					affectedProjects: activeProjects.map(p => p.id),
					estimatedImpact: {
						cost: 60000000, // 연봉 6000만원
						benefit: 80000000, // 생산성 향상
						risk: 0.3
					},
					recommendedActions: [
						'필요 스킬 분석',
						'채용 계획 수립',
						'온보딩 계획 준비'
					],
					createdAt: new Date().toISOString(),
					expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일 후
				});
			}
		}

		participationRecommendations.set(recommendations);
		return recommendations;
	}

	// 5. 참여율 자동 조정
	static autoAdjustParticipation(personId: string, targetRate: number, reason: string): boolean {
		const assignments = get(participationAssignments);
		const personAssignments = assignments.filter(a => a.personId === personId);
		
		if (personAssignments.length === 0) return false;

		// 현재 총 참여율 계산
		const currentTotal = personAssignments.reduce((sum, a) => sum + a.ratePct, 0);
		const adjustment = targetRate - currentTotal;

		if (Math.abs(adjustment) < 5) return true; // 5% 미만이면 조정하지 않음

		// 조정 로직: 우선순위가 낮은 프로젝트부터 조정
		const sortedAssignments = personAssignments.sort((a, b) => {
			const projectA = get(projects).find(p => p.id === a.projectId);
			const projectB = get(projects).find(p => p.id === b.projectId);
			return (projectA?.priority || 0) - (projectB?.priority || 0);
		});

		let remainingAdjustment = adjustment;
		const updates: Array<{ id: string; newRate: number }> = [];

		for (const assignment of sortedAssignments) {
			if (remainingAdjustment === 0) break;

			const currentRate = assignment.ratePct;
			let newRate = currentRate;

			if (remainingAdjustment > 0) {
				// 참여율 증가
				const maxIncrease = Math.min(remainingAdjustment, 100 - currentRate);
				newRate = currentRate + maxIncrease;
				remainingAdjustment -= maxIncrease;
			} else {
				// 참여율 감소
				const maxDecrease = Math.min(Math.abs(remainingAdjustment), currentRate);
				newRate = currentRate - maxDecrease;
				remainingAdjustment += maxDecrease;
			}

			if (newRate !== currentRate) {
				updates.push({ id: assignment.id, newRate });
			}
		}

		// 업데이트 적용
		updates.forEach(update => {
			this.updateParticipationRate(update.id, update.newRate, reason);
		});

		return true;
	}

	// 6. 참여율 업데이트 (히스토리 포함)
	static updateParticipationRate(assignmentId: string, newRate: number, reason: string): void {
		const assignments = get(participationAssignments);
		const assignment = assignments.find(a => a.id === assignmentId);
		
		if (!assignment) return;

		const oldRate = assignment.ratePct;
		
		// 히스토리 기록
		const history: ParticipationHistory = {
			id: crypto.randomUUID(),
			personId: assignment.personId,
			projectId: assignment.projectId,
			oldRate,
			newRate,
			changeReason: reason,
			changedBy: 'system', // 실제로는 현재 사용자 ID
			changedAt: new Date().toISOString(),
			effectiveFrom: new Date().toISOString(),
			effectiveTo: assignment.dateTo
		};

		// 할당 업데이트
		participationAssignments.update(assignments => 
			assignments.map(a => 
				a.id === assignmentId 
					? { ...a, ratePct: newRate, updatedAt: new Date().toISOString() }
					: a
			)
		);

		// 히스토리 추가
		participationHistory.update(history => [history, ...history]);
	}

	// 7. 참여율 예측 및 시뮬레이션
	static simulateParticipationChanges(changes: Array<{
		personId: string;
		projectId: string;
		newRate: number;
	}>): {
		monthlyImpact: Array<{
			month: string;
			overloadCount: number;
			underutilizedCount: number;
			totalCost: number;
		}>;
		recommendations: string[];
	} {
		// 시뮬레이션 로직 구현
		const monthlyImpact = [];
		const recommendations = [];

		// 최근 6개월 시뮬레이션
		for (let i = 0; i < 6; i++) {
			const date = new Date();
			date.setMonth(date.getMonth() + i);
			const month = date.toISOString().slice(0, 7);

			// 시뮬레이션된 참여율로 분석
			const simulatedAnalysis = this.analyzeMonthlyParticipation();
			const monthData = simulatedAnalysis.find(m => m.month === month);
			
			if (monthData) {
				const overloadCount = monthData.personAnalysis.filter(p => p.totalRate > 100).length;
				const underutilizedCount = monthData.personAnalysis.filter(p => p.totalRate < 50 && p.totalRate > 0).length;
				
				monthlyImpact.push({
					month,
					overloadCount,
					underutilizedCount,
					totalCost: this.calculateMonthlyCost(monthData)
				});
			}
		}

		// 추천사항 생성
		if (monthlyImpact.some(m => m.overloadCount > 0)) {
			recommendations.push('일부 인력의 과부하가 예상됩니다. 추가 인력 투입을 고려하세요.');
		}
		if (monthlyImpact.some(m => m.underutilizedCount > 0)) {
			recommendations.push('일부 인력의 미활용이 예상됩니다. 추가 프로젝트 배정을 고려하세요.');
		}

		return { monthlyImpact, recommendations };
	}

	// 8. 월별 비용 계산
	static calculateMonthlyCost(monthData: any): number {
		const employees = get(employees);
		let totalCost = 0;

		monthData.personAnalysis.forEach((personData: any) => {
			const employee = employees.find(e => e.id === personData.personId);
			if (employee) {
				// 월급의 참여율 비율로 계산
				const monthlySalary = employee.salary;
				const participationCost = monthlySalary * (personData.totalRate / 100);
				totalCost += participationCost;
			}
		});

		return totalCost;
	}
}

// 파생 스토어들
export const participationHealth = derived(
	[participationAssignments, participationConflicts],
	([assignments, conflicts]) => {
		const totalAssignments = assignments.length;
		const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
		const highConflicts = conflicts.filter(c => c.severity === 'high').length;
		
		const healthScore = Math.max(0, 100 - (criticalConflicts * 20) - (highConflicts * 10));
		
		return {
			score: healthScore,
			status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'fair' : 'poor',
			criticalIssues: criticalConflicts,
			highIssues: highConflicts,
			totalAssignments
		};
	}
);

export const participationTrends = derived(
	participationHistory,
	(history) => {
		// 최근 6개월 트렌드 분석
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
		
		const recentHistory = history.filter(h => new Date(h.changedAt) >= sixMonthsAgo);
		
		const monthlyChanges = {};
		recentHistory.forEach(change => {
			const month = change.changedAt.slice(0, 7);
			if (!monthlyChanges[month]) {
				monthlyChanges[month] = { increases: 0, decreases: 0, total: 0 };
			}
			
			if (change.newRate > change.oldRate) {
				monthlyChanges[month].increases++;
			} else if (change.newRate < change.oldRate) {
				monthlyChanges[month].decreases++;
			}
			monthlyChanges[month].total++;
		});

		return {
			monthlyChanges,
			totalChanges: recentHistory.length,
			averageChange: recentHistory.length > 0 
				? recentHistory.reduce((sum, h) => sum + Math.abs(h.newRate - h.oldRate), 0) / recentHistory.length 
				: 0
		};
	}
);

// 초기 데이터 로드
export function initializeParticipationManager() {
	// 충돌 감지
	ParticipationManager.detectConflicts();
	
	// 추천 생성
	ParticipationManager.generateOptimizationRecommendations();
}
