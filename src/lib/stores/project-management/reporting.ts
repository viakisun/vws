import { writable } from 'svelte/store';
import type { Report, Project, Milestone, ExpenseItem, ParticipationAssignment, ResearchNote } from './types';
import { logAudit } from './core';

// 리포트 관리
export const reports = writable<Report[]>([]);
export const reportTemplates = writable<Record<string, any>>({});

// 주간 리포트 생성
export function generateWeeklyReport(
	projectId: string,
	weekStart: string,
	weekEnd: string
): string {
	const reportId = crypto.randomUUID();
	
	// 데이터 수집
	const summaryData = collectWeeklyData(projectId, weekStart, weekEnd);
	
	const report: Report = {
		id: reportId,
		projectId,
		type: 'weekly',
		periodStart: weekStart,
		periodEnd: weekEnd,
		summaryJson: summaryData,
		generatedAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	reports.update(list => [...list, report]);
	logAudit('generate', 'weekly_report', reportId, {}, report);
	
	return reportId;
}

// 주간 데이터 수집
function collectWeeklyData(projectId: string, weekStart: string, weekEnd: string): any {
	// 마일스톤 달성률
	const milestoneProgress = calculateMilestoneProgress(projectId, weekStart, weekEnd);
	
	// 예산 집행률
	const budgetExecution = calculateBudgetExecution(projectId, weekStart, weekEnd);
	
	// 인력 참여율
	const participationRate = calculateParticipationRate(projectId, weekStart, weekEnd);
	
	// 연구노트 제출률
	const researchNoteSubmission = calculateResearchNoteSubmission(projectId, weekStart, weekEnd);
	
	// 이슈 및 리스크
	const issuesAndRisks = collectIssuesAndRisks(projectId, weekStart, weekEnd);
	
	// 다음 주 계획
	const nextWeekPlan = generateNextWeekPlan(projectId);
	
	return {
		milestoneProgress,
		budgetExecution,
		participationRate,
		researchNoteSubmission,
		issuesAndRisks,
		nextWeekPlan,
		generatedAt: new Date().toISOString()
	};
}

// 마일스톤 진행률 계산
function calculateMilestoneProgress(projectId: string, weekStart: string, weekEnd: string): any {
	// 실제 구현에서는 milestones 스토어에서 데이터 가져오기
	const currentWeek = new Date(weekStart);
	const quarter = Math.ceil((currentWeek.getMonth() + 1) / 3);
	
	return {
		quarter,
		totalMilestones: 5,
		completedMilestones: 2,
		inProgressMilestones: 2,
		delayedMilestones: 1,
		overallProgress: 60,
		milestoneDetails: [
			{
				id: 'milestone-1',
				title: '요구사항 분석',
				status: 'completed',
				progress: 100,
				dueDate: '2024-01-15'
			},
			{
				id: 'milestone-2',
				title: '시스템 설계',
				status: 'in-progress',
				progress: 80,
				dueDate: '2024-01-30'
			}
		]
	};
}

// 예산 집행률 계산
function calculateBudgetExecution(projectId: string, weekStart: string, weekEnd: string): any {
	// 실제 구현에서는 expenseItems 스토어에서 데이터 가져오기
	return {
		totalBudget: 100000000,
		executedAmount: 25000000,
		executionRate: 25,
		categoryBreakdown: [
			{
				category: 'PERSONNEL_CASH',
				planned: 50000000,
				executed: 15000000,
				rate: 30
			},
			{
				category: 'MATERIAL',
				planned: 30000000,
				executed: 8000000,
				rate: 27
			},
			{
				category: 'RESEARCH_ACTIVITY',
				planned: 20000000,
				executed: 2000000,
				rate: 10
			}
		],
		trend: 'increasing'
	};
}

// 인력 참여율 계산
function calculateParticipationRate(projectId: string, weekStart: string, weekEnd: string): any {
	// 실제 구현에서는 participationAssignments 스토어에서 데이터 가져오기
	return {
		totalParticipants: 8,
		averageParticipationRate: 85,
		participationDetails: [
			{
				personId: 'person-1',
				name: '김연구원',
				assignedRate: 100,
				actualRate: 95,
				status: 'normal'
			},
			{
				personId: 'person-2',
				name: '이연구원',
				assignedRate: 80,
				actualRate: 75,
				status: 'normal'
			}
		],
		overloadWarnings: 0,
		underutilizationWarnings: 1
	};
}

// 연구노트 제출률 계산
function calculateResearchNoteSubmission(projectId: string, weekStart: string, weekEnd: string): any {
	// 실제 구현에서는 researchNotes 스토어에서 데이터 가져오기
	return {
		expectedSubmissions: 8,
		actualSubmissions: 7,
		submissionRate: 87.5,
		missingSubmissions: [
			{
				authorId: 'person-3',
				name: '박연구원',
				weekOf: '2024-W03'
			}
		],
		trend: 'stable'
	};
}

// 이슈 및 리스크 수집
function collectIssuesAndRisks(projectId: string, weekStart: string, weekEnd: string): any {
	return {
		issues: [
			{
				id: 'issue-1',
				title: '외부 협력사 일정 지연',
				severity: 'medium',
				status: 'open',
				description: '협력사 A사의 부품 납기가 1주일 지연될 예정',
				impact: '프로토타입 제작 일정 1주일 지연',
				mitigation: '대체 공급업체 검토 중'
			}
		],
		risks: [
			{
				id: 'risk-1',
				title: '핵심 인력 이탈 위험',
				severity: 'high',
				probability: 30,
				impact: '프로젝트 일정 2개월 지연',
				mitigation: '인력 확보 계획 수립'
			}
		],
		totalIssues: 1,
		totalRisks: 1,
		criticalCount: 0,
		highCount: 1,
		mediumCount: 1,
		lowCount: 0
	};
}

// 다음 주 계획 생성
function generateNextWeekPlan(projectId: string): any {
	return {
		priorities: [
			{
				title: '시스템 설계 완료',
				owner: '김연구원',
				dueDate: '2024-01-30',
				priority: 'high'
			},
			{
				title: '프로토타입 개발 시작',
				owner: '이연구원',
				dueDate: '2024-02-05',
				priority: 'medium'
			}
		],
		deliverables: [
			{
				title: '시스템 설계서',
				type: 'document',
				dueDate: '2024-01-30'
			},
			{
				title: '프로토타입 v1.0',
				type: 'prototype',
				dueDate: '2024-02-05'
			}
		],
		meetings: [
			{
				title: '주간 진행회의',
				date: '2024-01-29',
				time: '14:00',
				participants: ['PM', '팀원 전체']
			}
		]
	};
}

// 분기 리포트 생성
export function generateQuarterlyReport(
	projectId: string,
	quarter: number,
	year: number
): string {
	const reportId = crypto.randomUUID();
	
	const quarterStart = new Date(year, (quarter - 1) * 3, 1);
	const quarterEnd = new Date(year, quarter * 3, 0);
	
	const summaryData = collectQuarterlyData(projectId, quarterStart, quarterEnd);
	
	const report: Report = {
		id: reportId,
		projectId,
		type: 'quarterly',
		periodStart: quarterStart.toISOString().split('T')[0],
		periodEnd: quarterEnd.toISOString().split('T')[0],
		summaryJson: summaryData,
		generatedAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	reports.update(list => [...list, report]);
	logAudit('generate', 'quarterly_report', reportId, {}, report);
	
	return reportId;
}

// 분기 데이터 수집
function collectQuarterlyData(projectId: string, quarterStart: Date, quarterEnd: Date): any {
	return {
		quarter: Math.ceil((quarterStart.getMonth() + 1) / 3),
		year: quarterStart.getFullYear(),
		executiveSummary: generateExecutiveSummary(projectId, quarterStart, quarterEnd),
		achievements: collectAchievements(projectId, quarterStart, quarterEnd),
		challenges: collectChallenges(projectId, quarterStart, quarterEnd),
		financialSummary: collectFinancialSummary(projectId, quarterStart, quarterEnd),
		personnelSummary: collectPersonnelSummary(projectId, quarterStart, quarterEnd),
		nextQuarterPlan: generateNextQuarterPlan(projectId),
		recommendations: generateRecommendations(projectId)
	};
}

// 경영진 요약 생성
function generateExecutiveSummary(projectId: string, quarterStart: Date, quarterEnd: Date): any {
	return {
		overallStatus: 'on-track',
		keyAchievements: [
			'시스템 설계 완료',
			'프로토타입 v1.0 개발 완료',
			'핵심 알고리즘 구현 완료'
		],
		keyChallenges: [
			'외부 협력사 일정 지연',
			'예산 집행률 부족'
		],
		overallProgress: 75,
		budgetUtilization: 60,
		riskLevel: 'medium'
	};
}

// 성과 수집
function collectAchievements(projectId: string, quarterStart: Date, quarterEnd: Date): any {
	return {
		milestones: [
			{
				title: '시스템 설계 완료',
				status: 'completed',
				completionDate: '2024-01-30',
				impact: 'high'
			},
			{
				title: '프로토타입 v1.0 개발',
				status: 'completed',
				completionDate: '2024-02-15',
				impact: 'high'
			}
		],
		deliverables: [
			{
				title: '시스템 설계서',
				type: 'document',
				status: 'delivered'
			},
			{
				title: '프로토타입 v1.0',
				type: 'prototype',
				status: 'delivered'
			}
		],
		publications: [],
		patents: [],
		awards: []
	};
}

// 도전과제 수집
function collectChallenges(projectId: string, quarterStart: Date, quarterEnd: Date): any {
	return {
		technical: [
			{
				title: '성능 최적화 이슈',
				description: '실시간 처리 성능이 요구사항에 미달',
				status: 'ongoing',
				impact: 'medium'
			}
		],
		resource: [
			{
				title: '예산 집행 지연',
				description: '예산 집행률이 계획 대비 낮음',
				status: 'ongoing',
				impact: 'low'
			}
		],
		schedule: [
			{
				title: '외부 협력사 일정 지연',
				description: '부품 납기 지연으로 인한 일정 영향',
				status: 'resolved',
				impact: 'medium'
			}
		]
	};
}

// 재무 요약 수집
function collectFinancialSummary(projectId: string, quarterStart: Date, quarterEnd: Date): any {
	return {
		totalBudget: 100000000,
		executedAmount: 60000000,
		executionRate: 60,
		categoryBreakdown: [
			{
				category: 'PERSONNEL_CASH',
				planned: 50000000,
				executed: 35000000,
				rate: 70
			},
			{
				category: 'MATERIAL',
				planned: 30000000,
				executed: 20000000,
				rate: 67
			},
			{
				category: 'RESEARCH_ACTIVITY',
				planned: 20000000,
				executed: 5000000,
				rate: 25
			}
		],
		trend: 'increasing',
		forecast: {
			expectedCompletion: 95,
			riskAreas: ['RESEARCH_ACTIVITY']
		}
	};
}

// 인력 요약 수집
function collectPersonnelSummary(projectId: string, quarterStart: Date, quarterEnd: Date): any {
	return {
		totalParticipants: 8,
		averageParticipationRate: 85,
		participationTrend: 'stable',
		keyPersonnel: [
			{
				personId: 'person-1',
				name: '김연구원',
				role: 'Lead Developer',
				participationRate: 100,
				performance: 'excellent'
			}
		],
		recruitment: {
			planned: 2,
			completed: 1,
			pending: 1
		},
		training: {
			completed: 3,
			planned: 2
		}
	};
}

// 다음 분기 계획 생성
function generateNextQuarterPlan(projectId: string): any {
	return {
		objectives: [
			{
				title: '프로토타입 v2.0 개발',
				description: '성능 최적화 및 기능 확장',
				priority: 'high',
				targetDate: '2024-06-30'
			},
			{
				title: '사용자 테스트 진행',
				description: '베타 테스터 모집 및 피드백 수집',
				priority: 'medium',
				targetDate: '2024-05-31'
			}
		],
		milestones: [
			{
				title: '프로토타입 v2.0 완성',
				dueDate: '2024-06-30',
				owner: '개발팀'
			},
			{
				title: '사용자 테스트 완료',
				dueDate: '2024-05-31',
				owner: 'QA팀'
			}
		],
		resourceRequirements: {
			personnel: 2,
			budget: 30000000,
			equipment: ['테스트 서버', '모니터링 도구']
		}
	};
}

// 권고사항 생성
function generateRecommendations(projectId: string): any {
	return {
		immediate: [
			{
				title: '예산 집행률 개선',
				description: '연구활동비 집행률이 낮으므로 집행 계획 재검토 필요',
				priority: 'high',
				actionOwner: 'PM'
			}
		],
		shortTerm: [
			{
				title: '성능 최적화 전략 수립',
				description: '성능 이슈 해결을 위한 구체적인 전략 수립',
				priority: 'medium',
				actionOwner: '기술팀'
			}
		],
		longTerm: [
			{
				title: '인력 확보 계획',
				description: '프로젝트 확장을 위한 추가 인력 확보 계획',
				priority: 'low',
				actionOwner: 'HR팀'
			}
		]
	};
}

// 리포트 템플릿 관리
export function createReportTemplate(
	templateName: string,
	templateType: 'weekly' | 'quarterly',
	templateData: any
): void {
	reportTemplates.update(templates => ({
		...templates,
		[templateName]: {
			type: templateType,
			data: templateData,
			createdAt: new Date().toISOString()
		}
	}));
}

// 리포트 템플릿 적용
export function applyReportTemplate(
	projectId: string,
	templateName: string,
	periodStart: string,
	periodEnd: string
): string {
	let template: any = null;
	
	reportTemplates.subscribe(templates => {
		template = templates[templateName];
	})();
	
	if (!template) {
		throw new Error(`Template ${templateName} not found`);
	}
	
	if (template.type === 'weekly') {
		return generateWeeklyReport(projectId, periodStart, periodEnd);
	} else if (template.type === 'quarterly') {
		return generateQuarterlyReport(projectId, 1, 2024); // 실제로는 파라미터에서 계산
	}
	
	throw new Error(`Unsupported template type: ${template.type}`);
}

// 리포트 내보내기
export function exportReport(
	reportId: string,
	format: 'pdf' | 'docx' | 'html' | 'excel'
): string {
	let report: Report | undefined = undefined;
	
	reports.subscribe(list => {
		report = list.find(r => r.id === reportId);
	})();
	
	if (!report) {
		throw new Error(`Report ${reportId} not found`);
	}
	
	// 실제 구현에서는 서버에서 해당 형식으로 변환
	// 여기서는 HTML 형식으로 반환
	return generateReportHTML(report);
}

// 리포트 HTML 생성
function generateReportHTML(report: Report): string {
	const data = report.summaryJson;
	
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<title>${report.type === 'weekly' ? '주간' : '분기'} 리포트</title>
			<meta charset="utf-8">
			<style>
				body { font-family: Arial, sans-serif; margin: 20px; }
				.header { background-color: #f0f0f0; padding: 20px; margin-bottom: 20px; }
				.section { margin-bottom: 30px; }
				.section h2 { color: #333; border-bottom: 2px solid #333; }
				.table { width: 100%; border-collapse: collapse; }
				.table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
				.table th { background-color: #f2f2f2; }
			</style>
		</head>
		<body>
			<div class="header">
				<h1>${report.type === 'weekly' ? '주간' : '분기'} 진도보고서</h1>
				<p>프로젝트: ${report.projectId}</p>
				<p>기간: ${report.periodStart} ~ ${report.periodEnd}</p>
				<p>생성일: ${report.generatedAt}</p>
			</div>
			
			${report.type === 'weekly' ? generateWeeklyReportHTML(data) : generateQuarterlyReportHTML(data)}
		</body>
		</html>
	`;
}

// 주간 리포트 HTML 생성
function generateWeeklyReportHTML(data: any): string {
	return `
		<div class="section">
			<h2>마일스톤 진행률</h2>
			<p>전체 진행률: ${data.milestoneProgress.overallProgress}%</p>
			<p>완료된 마일스톤: ${data.milestoneProgress.completedMilestones}/${data.milestoneProgress.totalMilestones}</p>
		</div>
		
		<div class="section">
			<h2>예산 집행률</h2>
			<p>집행률: ${data.budgetExecution.executionRate}%</p>
			<p>집행 금액: ${data.budgetExecution.executedAmount.toLocaleString()}원</p>
		</div>
		
		<div class="section">
			<h2>인력 참여율</h2>
			<p>평균 참여율: ${data.participationRate.averageParticipationRate}%</p>
			<p>참여자 수: ${data.participationRate.totalParticipants}명</p>
		</div>
		
		<div class="section">
			<h2>연구노트 제출률</h2>
			<p>제출률: ${data.researchNoteSubmission.submissionRate}%</p>
			<p>제출 건수: ${data.researchNoteSubmission.actualSubmissions}/${data.researchNoteSubmission.expectedSubmissions}</p>
		</div>
	`;
}

// 분기 리포트 HTML 생성
function generateQuarterlyReportHTML(data: any): string {
	return `
		<div class="section">
			<h2>경영진 요약</h2>
			<p>전체 상태: ${data.executiveSummary.overallStatus}</p>
			<p>전체 진행률: ${data.executiveSummary.overallProgress}%</p>
			<p>예산 활용률: ${data.executiveSummary.budgetUtilization}%</p>
		</div>
		
		<div class="section">
			<h2>주요 성과</h2>
			<ul>
				${data.achievements.milestones.map((milestone: any) => 
					`<li>${milestone.title} - ${milestone.status}</li>`
				).join('')}
			</ul>
		</div>
		
		<div class="section">
			<h2>재무 요약</h2>
			<p>총 예산: ${data.financialSummary.totalBudget.toLocaleString()}원</p>
			<p>집행 금액: ${data.financialSummary.executedAmount.toLocaleString()}원</p>
			<p>집행률: ${data.financialSummary.executionRate}%</p>
		</div>
	`;
}

// 자동 리포트 생성 스케줄링
export function scheduleAutoReports(
	projectId: string,
	scheduleType: 'weekly' | 'quarterly',
	dayOfWeek?: number, // 0-6 (일요일-토요일)
	dayOfMonth?: number // 1-31
): void {
	// 실제 구현에서는 백그라운드 작업으로 스케줄링
	// 여기서는 간단히 설정만 저장
	const schedule = {
		projectId,
		scheduleType,
		dayOfWeek,
		dayOfMonth,
		enabled: true,
		createdAt: new Date().toISOString()
	};
	
	// 스케줄 저장 (실제로는 별도 스토어에 저장)
	console.log('Auto report scheduled:', schedule);
}

// 리포트 통계
export function getReportStatistics(projectId: string): any {
	let projectReports: Report[] = [];
	
	reports.subscribe(list => {
		projectReports = list.filter(r => r.projectId === projectId);
	})();
	
	const weeklyReports = projectReports.filter(r => r.type === 'weekly');
	const quarterlyReports = projectReports.filter(r => r.type === 'quarterly');
	
	return {
		totalReports: projectReports.length,
		weeklyReports: weeklyReports.length,
		quarterlyReports: quarterlyReports.length,
		lastReportDate: projectReports.length > 0 ? 
			Math.max(...projectReports.map(r => new Date(r.generatedAt).getTime())) : null,
		averageGenerationTime: calculateAverageGenerationTime(projectReports)
	};
}

// 평균 생성 시간 계산
function calculateAverageGenerationTime(reports: Report[]): number {
	if (reports.length === 0) return 0;
	
	const totalTime = reports.reduce((sum, report) => {
		const created = new Date(report.createdAt).getTime();
		const generated = new Date(report.generatedAt).getTime();
		return sum + (generated - created);
	}, 0);
	
	return totalTime / reports.length;
}
