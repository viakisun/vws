import { writable } from 'svelte/store';

// 성과 평가
export interface PerformanceReview {
	id: string;
	employeeId: string;
	reviewerId: string; // 평가자 ID
	reviewPeriod: {
		startDate: string;
		endDate: string;
		year: number;
		quarter?: number; // 분기별 평가인 경우
	};
	reviewType: 'annual' | 'quarterly' | 'probation' | 'project';
	status: 'draft' | 'in-progress' | 'completed' | 'approved';
	
	// 목표 대비 성과
	goals: {
		id: string;
		title: string;
		description: string;
		target: string;
		actual: string;
		achievement: number; // 달성률 (%)
		weight: number; // 가중치 (%)
		rating: number; // 1-5 점수
		comments: string;
	}[];
	
	// 역량 평가
	competencies: {
		id: string;
		name: string;
		description: string;
		rating: number; // 1-5 점수
		evidence: string; // 근거/사례
		improvement: string; // 개선사항
	}[];
	
	// 종합 평가
	overallRating: number; // 1-5 점수
	strengths: string[];
	improvementAreas: string[];
	developmentPlan: string;
	careerGoals: string;
	
	// 승진/보상 관련
	promotionRecommendation: boolean;
	salaryIncreaseRecommendation: boolean;
	bonusRecommendation: boolean;
	
	// 메타데이터
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	approvedAt?: string;
	approvedBy?: string;
}

// 360도 피드백
export interface Feedback360 {
	id: string;
	revieweeId: string; // 피평가자 ID
	reviewerId: string; // 평가자 ID
	reviewerType: 'manager' | 'peer' | 'subordinate' | 'self' | 'customer';
	reviewPeriod: {
		startDate: string;
		endDate: string;
	};
	
	// 평가 항목
	leadership: number; // 1-5 점수
	communication: number;
	teamwork: number;
	problemSolving: number;
	initiative: number;
	adaptability: number;
	technicalSkills: number;
	
	// 서술형 피드백
	strengths: string;
	improvementAreas: string;
	recommendations: string;
	additionalComments: string;
	
	// 익명 여부
	isAnonymous: boolean;
	
	status: 'pending' | 'completed' | 'cancelled';
	createdAt: string;
	completedAt?: string;
}

// 역량 매트릭스
export interface CompetencyMatrix {
	id: string;
	employeeId: string;
	competencyId: string;
	competencyName: string;
	level: number; // 1-5 레벨
	evidence: string; // 역량 입증 근거
	lastAssessed: string;
	nextAssessment: string;
	assessorId: string;
	createdAt: string;
	updatedAt: string;
}

// 교육 이수 관리
export interface TrainingRecord {
	id: string;
	employeeId: string;
	trainingType: 'internal' | 'external' | 'online' | 'certification';
	title: string;
	description: string;
	provider: string;
	startDate: string;
	endDate: string;
	duration: number; // 시간
	status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
	score?: number; // 점수 (100점 만점)
	passingScore?: number; // 합격 점수
	certificateUrl?: string;
	skills: string[]; // 습득한 스킬
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

// 승진/보상 기록
export interface PromotionRecord {
	id: string;
	employeeId: string;
	fromPosition: string;
	toPosition: string;
	fromLevel: string;
	toLevel: string;
	effectiveDate: string;
	reason: string;
	approvedBy: string;
	approvedAt: string;
	createdAt: string;
}

export interface CompensationRecord {
	id: string;
	employeeId: string;
	type: 'salary-increase' | 'bonus' | 'stock-option' | 'allowance';
	amount: number;
	percentage?: number; // 인상률 (%)
	effectiveDate: string;
	reason: string;
	approvedBy: string;
	approvedAt: string;
	createdAt: string;
}

// 초기 데이터
const initialPerformanceReviews: PerformanceReview[] = [
	{
		id: 'review-1',
		employeeId: 'emp-1',
		reviewerId: 'emp-3',
		reviewPeriod: {
			startDate: '2023-01-01',
			endDate: '2023-12-31',
			year: 2023
		},
		reviewType: 'annual',
		status: 'completed',
		goals: [
			{
				id: 'goal-1',
				title: '프로젝트 완료율 향상',
				description: '담당 프로젝트 100% 완료',
				target: '100%',
				actual: '95%',
				achievement: 95,
				weight: 30,
				rating: 4,
				comments: '대부분의 프로젝트를 성공적으로 완료했으나 일부 지연 발생'
			},
			{
				id: 'goal-2',
				title: '팀 멘토링',
				description: '신입 개발자 2명 멘토링',
				target: '2명',
				actual: '2명',
				achievement: 100,
				weight: 20,
				rating: 5,
				comments: '훌륭한 멘토링으로 신입 개발자들의 성장에 크게 기여'
			}
		],
		competencies: [
			{
				id: 'comp-1',
				name: '기술적 역량',
				description: '프로그래밍 및 기술적 문제 해결 능력',
				rating: 4,
				evidence: '복잡한 기술적 문제를 효과적으로 해결하고 팀에 지식 공유',
				improvement: '최신 기술 트렌드에 대한 지속적인 학습 필요'
			},
			{
				id: 'comp-2',
				name: '리더십',
				description: '팀을 이끌고 동기부여하는 능력',
				rating: 4,
				evidence: '프로젝트 리딩 및 팀원들의 성장을 돕는 역할 수행',
				improvement: '더 적극적인 의사결정 및 책임감 향상 필요'
			}
		],
		overallRating: 4,
		strengths: [
			'뛰어난 기술적 역량',
			'팀워크 및 협업 능력',
			'지속적인 학습 의지'
		],
		improvementAreas: [
			'의사소통 스킬 향상',
			'프로젝트 관리 능력 강화'
		],
		developmentPlan: '프로젝트 관리 교육 수강 및 커뮤니케이션 스킬 향상',
		careerGoals: '시니어 개발자에서 리드 개발자로 성장',
		promotionRecommendation: true,
		salaryIncreaseRecommendation: true,
		bonusRecommendation: true,
		createdAt: '2023-12-01T00:00:00Z',
		updatedAt: '2023-12-15T00:00:00Z',
		completedAt: '2023-12-15T00:00:00Z',
		approvedAt: '2023-12-20T00:00:00Z',
		approvedBy: 'emp-3'
	}
];

const initialFeedback360: Feedback360[] = [
	{
		id: 'feedback-1',
		revieweeId: 'emp-1',
		reviewerId: 'emp-2',
		reviewerType: 'peer',
		reviewPeriod: {
			startDate: '2023-01-01',
			endDate: '2023-12-31'
		},
		leadership: 4,
		communication: 4,
		teamwork: 5,
		problemSolving: 4,
		initiative: 3,
		adaptability: 4,
		technicalSkills: 5,
		strengths: '기술적 역량이 뛰어나고 팀원들을 잘 도와줍니다.',
		improvementAreas: '더 적극적인 의견 제시가 필요합니다.',
		recommendations: '팀 미팅에서 더 많은 아이디어를 제안해보세요.',
		additionalComments: '전반적으로 훌륭한 동료입니다.',
		isAnonymous: false,
		status: 'completed',
		createdAt: '2023-12-01T00:00:00Z',
		completedAt: '2023-12-10T00:00:00Z'
	}
];

const initialCompetencyMatrix: CompetencyMatrix[] = [
	{
		id: 'comp-matrix-1',
		employeeId: 'emp-1',
		competencyId: 'tech-skills',
		competencyName: '기술적 역량',
		level: 4,
		evidence: 'React, TypeScript, Node.js 등 다양한 기술 스택 활용',
		lastAssessed: '2023-12-15',
		nextAssessment: '2024-06-15',
		assessorId: 'emp-3',
		createdAt: '2023-12-15T00:00:00Z',
		updatedAt: '2023-12-15T00:00:00Z'
	}
];

const initialTrainingRecords: TrainingRecord[] = [
	{
		id: 'training-1',
		employeeId: 'emp-1',
		trainingType: 'external',
		title: 'AWS Solutions Architect',
		description: 'AWS 클라우드 아키텍처 설계 교육',
		provider: 'Amazon Web Services',
		startDate: '2023-06-01',
		endDate: '2023-06-30',
		duration: 40,
		status: 'completed',
		score: 85,
		passingScore: 70,
		certificateUrl: '/certificates/aws-sa.pdf',
		skills: ['AWS', 'Cloud Architecture', 'DevOps'],
		createdAt: '2023-06-01T00:00:00Z',
		updatedAt: '2023-06-30T00:00:00Z'
	}
];

const initialPromotionRecords: PromotionRecord[] = [
	{
		id: 'promotion-1',
		employeeId: 'emp-1',
		fromPosition: '미드레벨 개발자',
		toPosition: '시니어 개발자',
		fromLevel: 'mid',
		toLevel: 'senior',
		effectiveDate: '2023-01-15',
		reason: '뛰어난 기술적 역량과 팀 리딩 능력',
		approvedBy: 'emp-3',
		approvedAt: '2023-01-10T00:00:00Z',
		createdAt: '2023-01-10T00:00:00Z'
	}
];

const initialCompensationRecords: CompensationRecord[] = [
	{
		id: 'compensation-1',
		employeeId: 'emp-1',
		type: 'salary-increase',
		amount: 5000000,
		percentage: 10,
		effectiveDate: '2024-01-01',
		reason: '성과 평가 결과에 따른 인상',
		approvedBy: 'emp-3',
		approvedAt: '2023-12-20T00:00:00Z',
		createdAt: '2023-12-20T00:00:00Z'
	}
];

// 스토어 생성
export const performanceReviews = writable<PerformanceReview[]>(initialPerformanceReviews);
export const feedback360 = writable<Feedback360[]>(initialFeedback360);
export const competencyMatrix = writable<CompetencyMatrix[]>(initialCompetencyMatrix);
export const trainingRecords = writable<TrainingRecord[]>(initialTrainingRecords);
export const promotionRecords = writable<PromotionRecord[]>(initialPromotionRecords);
export const compensationRecords = writable<CompensationRecord[]>(initialCompensationRecords);

// 성과 평가 관리 함수들
export function addPerformanceReview(review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>) {
	const newReview: PerformanceReview = {
		...review,
		id: `review-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	performanceReviews.update(current => [...current, newReview]);
}

export function updatePerformanceReview(id: string, updates: Partial<PerformanceReview>) {
	performanceReviews.update(current =>
		current.map(review => 
			review.id === id 
				? { ...review, ...updates, updatedAt: new Date().toISOString() }
				: review
		)
	);
}

export function completePerformanceReview(id: string) {
	performanceReviews.update(current =>
		current.map(review => 
			review.id === id 
				? { 
					...review, 
					status: 'completed', 
					completedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString() 
				}
				: review
		)
	);
}

export function approvePerformanceReview(id: string, approvedBy: string) {
	performanceReviews.update(current =>
		current.map(review => 
			review.id === id 
				? { 
					...review, 
					status: 'approved', 
					approvedBy, 
					approvedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString() 
				}
				: review
		)
	);
}

// 360도 피드백 관리 함수들
export function addFeedback360(feedback: Omit<Feedback360, 'id' | 'createdAt'>) {
	const newFeedback: Feedback360 = {
		...feedback,
		id: `feedback-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	feedback360.update(current => [...current, newFeedback]);
}

export function completeFeedback360(id: string) {
	feedback360.update(current =>
		current.map(feedback => 
			feedback.id === id 
				? { ...feedback, status: 'completed', completedAt: new Date().toISOString() }
				: feedback
		)
	);
}

// 역량 매트릭스 관리 함수들
export function addCompetencyMatrix(matrix: Omit<CompetencyMatrix, 'id' | 'createdAt' | 'updatedAt'>) {
	const newMatrix: CompetencyMatrix = {
		...matrix,
		id: `comp-matrix-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	competencyMatrix.update(current => [...current, newMatrix]);
}

export function updateCompetencyMatrix(id: string, updates: Partial<CompetencyMatrix>) {
	competencyMatrix.update(current =>
		current.map(matrix => 
			matrix.id === id 
				? { ...matrix, ...updates, updatedAt: new Date().toISOString() }
				: matrix
		)
	);
}

// 교육 이수 관리 함수들
export function addTrainingRecord(record: Omit<TrainingRecord, 'id' | 'createdAt' | 'updatedAt'>) {
	const newRecord: TrainingRecord = {
		...record,
		id: `training-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	trainingRecords.update(current => [...current, newRecord]);
}

export function updateTrainingRecord(id: string, updates: Partial<TrainingRecord>) {
	trainingRecords.update(current =>
		current.map(record => 
			record.id === id 
				? { ...record, ...updates, updatedAt: new Date().toISOString() }
				: record
		)
	);
}

export function completeTraining(id: string, score: number, certificateUrl?: string) {
	trainingRecords.update(current =>
		current.map(record => 
			record.id === id 
				? { 
					...record, 
					status: 'completed', 
					score, 
					certificateUrl,
					updatedAt: new Date().toISOString() 
				}
				: record
		)
	);
}

// 승진/보상 기록 관리 함수들
export function addPromotionRecord(record: Omit<PromotionRecord, 'id' | 'createdAt'>) {
	const newRecord: PromotionRecord = {
		...record,
		id: `promotion-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	promotionRecords.update(current => [...current, newRecord]);
}

export function addCompensationRecord(record: Omit<CompensationRecord, 'id' | 'createdAt'>) {
	const newRecord: CompensationRecord = {
		...record,
		id: `compensation-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	compensationRecords.update(current => [...current, newRecord]);
}

// 유틸리티 함수들
export function getPerformanceReviewsByEmployee(employeeId: string, reviewList: PerformanceReview[]): PerformanceReview[] {
	return reviewList.filter(review => review.employeeId === employeeId);
}

export function getFeedback360ByReviewee(revieweeId: string, feedbackList: Feedback360[]): Feedback360[] {
	return feedbackList.filter(feedback => feedback.revieweeId === revieweeId);
}

export function getCompetencyMatrixByEmployee(employeeId: string, matrixList: CompetencyMatrix[]): CompetencyMatrix[] {
	return matrixList.filter(matrix => matrix.employeeId === employeeId);
}

export function getTrainingRecordsByEmployee(employeeId: string, recordList: TrainingRecord[]): TrainingRecord[] {
	return recordList.filter(record => record.employeeId === employeeId);
}

export function getPromotionRecordsByEmployee(employeeId: string, recordList: PromotionRecord[]): PromotionRecord[] {
	return recordList.filter(record => record.employeeId === employeeId);
}

export function getCompensationRecordsByEmployee(employeeId: string, recordList: CompensationRecord[]): CompensationRecord[] {
	return recordList.filter(record => record.employeeId === employeeId);
}

export function calculateOverallRating(review: PerformanceReview): number {
	if (review.goals.length === 0) return 0;
	
	const weightedSum = review.goals.reduce((sum, goal) => sum + (goal.rating * goal.weight), 0);
	const totalWeight = review.goals.reduce((sum, goal) => sum + goal.weight, 0);
	
	return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export function calculateAverageFeedback360(revieweeId: string, feedbackList: Feedback360[]): {
	leadership: number;
	communication: number;
	teamwork: number;
	problemSolving: number;
	initiative: number;
	adaptability: number;
	technicalSkills: number;
	overall: number;
} {
	const revieweeFeedbacks = getFeedback360ByReviewee(revieweeId, feedbackList);
	
	if (revieweeFeedbacks.length === 0) {
		return {
			leadership: 0,
			communication: 0,
			teamwork: 0,
			problemSolving: 0,
			initiative: 0,
			adaptability: 0,
			technicalSkills: 0,
			overall: 0
		};
	}
	
	const totals = revieweeFeedbacks.reduce((acc, feedback) => ({
		leadership: acc.leadership + feedback.leadership,
		communication: acc.communication + feedback.communication,
		teamwork: acc.teamwork + feedback.teamwork,
		problemSolving: acc.problemSolving + feedback.problemSolving,
		initiative: acc.initiative + feedback.initiative,
		adaptability: acc.adaptability + feedback.adaptability,
		technicalSkills: acc.technicalSkills + feedback.technicalSkills
	}), {
		leadership: 0,
		communication: 0,
		teamwork: 0,
		problemSolving: 0,
		initiative: 0,
		adaptability: 0,
		technicalSkills: 0
	});
	
	const count = revieweeFeedbacks.length;
	const averages = {
		leadership: Math.round((totals.leadership / count) * 10) / 10,
		communication: Math.round((totals.communication / count) * 10) / 10,
		teamwork: Math.round((totals.teamwork / count) * 10) / 10,
		problemSolving: Math.round((totals.problemSolving / count) * 10) / 10,
		initiative: Math.round((totals.initiative / count) * 10) / 10,
		adaptability: Math.round((totals.adaptability / count) * 10) / 10,
		technicalSkills: Math.round((totals.technicalSkills / count) * 10) / 10
	};
	
	const overall = Math.round(((averages.leadership + averages.communication + averages.teamwork + 
		averages.problemSolving + averages.initiative + averages.adaptability + averages.technicalSkills) / 7) * 10) / 10;
	
	return { ...averages, overall };
}
