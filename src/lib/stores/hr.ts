import { writable } from 'svelte/store';

// 직원 기본 정보
export interface Employee {
	id: string;
	employeeId: string; // 사번
	name: string;
	email: string;
	phone: string;
	address: string;
	department: string;
	position: string;
	level: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
	employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
	hireDate: string;
	status: 'active' | 'inactive' | 'on-leave' | 'terminated';
	managerId?: string;
	profileImage?: string;
	emergencyContact: {
		name: string;
		relationship: string;
		phone: string;
	};
	personalInfo: {
		birthDate: string;
		gender: 'male' | 'female' | 'other';
		nationality: string;
		maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
	};
}

// 근로 계약서
export interface EmploymentContract {
	id: string;
	employeeId: string;
	contractType: 'permanent' | 'fixed-term' | 'probation' | 'internship';
	startDate: string;
	endDate?: string;
	salary: number;
	workingHours: number;
	probationPeriod?: number; // 개월
	noticePeriod: number; // 개월
	benefits: string[];
	terms: string;
	status: 'draft' | 'active' | 'expired' | 'terminated';
	createdAt: string;
	updatedAt: string;
}

// 직무기술서
export interface JobDescription {
	id: string;
	position: string;
	department: string;
	level: string;
	responsibilities: string[];
	requirements: string[];
	preferredQualifications: string[];
	reportingTo: string;
	teamSize?: number;
	location: string;
	employmentType: string;
	salaryRange: {
		min: number;
		max: number;
	};
	benefits: string[];
	createdAt: string;
	updatedAt: string;
}

// 경력/자격증/교육 이력
export interface CareerRecord {
	id: string;
	employeeId: string;
	type: 'career' | 'certification' | 'education' | 'training';
	title: string;
	description: string;
	institution?: string;
	startDate: string;
	endDate?: string;
	status: 'completed' | 'in-progress' | 'planned';
	certificateUrl?: string;
	verified: boolean;
	createdAt: string;
}

// 비밀유지계약/개인정보 동의서
export interface Agreement {
	id: string;
	employeeId: string;
	type: 'nda' | 'privacy' | 'non-compete' | 'ip-assignment';
	title: string;
	content: string;
	signedDate: string;
	expiryDate?: string;
	status: 'active' | 'expired' | 'terminated';
	documentUrl?: string;
	createdAt: string;
}

// 초기 데이터
const initialEmployees: Employee[] = [
	{
		id: 'emp-1',
		employeeId: 'EMP001',
		name: '김철수',
		email: 'kim.cs@workstream.com',
		phone: '010-1234-5678',
		address: '서울시 강남구 테헤란로 123',
		department: '개발팀',
		position: '시니어 개발자',
		level: 'senior',
		employmentType: 'full-time',
		hireDate: '2023-01-15',
		status: 'active',
		managerId: 'emp-3',
		emergencyContact: {
			name: '김영희',
			relationship: '배우자',
			phone: '010-9876-5432'
		},
		personalInfo: {
			birthDate: '1985-03-15',
			gender: 'male',
			nationality: '한국',
			maritalStatus: 'married'
		}
	},
	{
		id: 'emp-2',
		employeeId: 'EMP002',
		name: '이영희',
		email: 'lee.yh@workstream.com',
		phone: '010-2345-6789',
		address: '서울시 서초구 서초대로 456',
		department: '마케팅팀',
		position: '마케팅 매니저',
		level: 'manager',
		employmentType: 'full-time',
		hireDate: '2022-06-01',
		status: 'active',
		emergencyContact: {
			name: '이민수',
			relationship: '부모',
			phone: '010-1111-2222'
		},
		personalInfo: {
			birthDate: '1990-07-22',
			gender: 'female',
			nationality: '한국',
			maritalStatus: 'single'
		}
	},
	{
		id: 'emp-3',
		employeeId: 'EMP003',
		name: '박민수',
		email: 'park.ms@workstream.com',
		phone: '010-3456-7890',
		address: '서울시 송파구 올림픽로 789',
		department: '개발팀',
		position: '개발팀장',
		level: 'manager',
		employmentType: 'full-time',
		hireDate: '2021-03-01',
		status: 'active',
		emergencyContact: {
			name: '박수진',
			relationship: '배우자',
			phone: '010-3333-4444'
		},
		personalInfo: {
			birthDate: '1982-11-08',
			gender: 'male',
			nationality: '한국',
			maritalStatus: 'married'
		}
	}
];

const initialContracts: EmploymentContract[] = [
	{
		id: 'contract-1',
		employeeId: 'emp-1',
		contractType: 'permanent',
		startDate: '2023-01-15',
		salary: 60000000,
		workingHours: 40,
		probationPeriod: 3,
		noticePeriod: 1,
		benefits: ['건강보험', '퇴직연금', '연차휴가', '교육비지원'],
		terms: '표준 근로계약서 조건',
		status: 'active',
		createdAt: '2023-01-15T00:00:00Z',
		updatedAt: '2023-01-15T00:00:00Z'
	},
	{
		id: 'contract-2',
		employeeId: 'emp-2',
		contractType: 'permanent',
		startDate: '2022-06-01',
		salary: 70000000,
		workingHours: 40,
		probationPeriod: 3,
		noticePeriod: 1,
		benefits: ['건강보험', '퇴직연금', '연차휴가', '교육비지원', '사내카페테리아'],
		terms: '표준 근로계약서 조건',
		status: 'active',
		createdAt: '2022-06-01T00:00:00Z',
		updatedAt: '2022-06-01T00:00:00Z'
	}
];

const initialJobDescriptions: JobDescription[] = [
	{
		id: 'jd-1',
		position: '시니어 개발자',
		department: '개발팀',
		level: 'senior',
		responsibilities: [
			'웹 애플리케이션 개발 및 유지보수',
			'코드 리뷰 및 멘토링',
			'기술적 의사결정 참여',
			'프로젝트 관리 및 팀 협업'
		],
		requirements: [
			'5년 이상 개발 경험',
			'JavaScript, TypeScript 숙련',
			'React, Vue.js 등 프론트엔드 프레임워크 경험',
			'Node.js, Python 등 백엔드 개발 경험'
		],
		preferredQualifications: [
			'클라우드 플랫폼 경험 (AWS, GCP)',
			'DevOps 경험',
			'팀 리딩 경험'
		],
		reportingTo: '개발팀장',
		teamSize: 8,
		location: '서울 본사',
		employmentType: 'full-time',
		salaryRange: {
			min: 50000000,
			max: 80000000
		},
		benefits: ['건강보험', '퇴직연금', '연차휴가', '교육비지원'],
		createdAt: '2023-01-01T00:00:00Z',
		updatedAt: '2023-01-01T00:00:00Z'
	}
];

const initialCareerRecords: CareerRecord[] = [
	{
		id: 'career-1',
		employeeId: 'emp-1',
		type: 'career',
		title: 'ABC 회사 프론트엔드 개발자',
		description: 'React 기반 웹 애플리케이션 개발',
		institution: 'ABC 회사',
		startDate: '2020-01-01',
		endDate: '2022-12-31',
		status: 'completed',
		verified: true,
		createdAt: '2023-01-15T00:00:00Z'
	},
	{
		id: 'career-2',
		employeeId: 'emp-1',
		type: 'certification',
		title: 'AWS Solutions Architect',
		description: 'AWS 클라우드 아키텍처 설계 자격증',
		institution: 'Amazon Web Services',
		startDate: '2022-06-01',
		endDate: '2025-06-01',
		status: 'completed',
		certificateUrl: '/certificates/aws-sa.pdf',
		verified: true,
		createdAt: '2022-06-01T00:00:00Z'
	}
];

const initialAgreements: Agreement[] = [
	{
		id: 'agreement-1',
		employeeId: 'emp-1',
		type: 'nda',
		title: '비밀유지계약서',
		content: '회사의 기밀정보 보호 및 비밀유지 의무',
		signedDate: '2023-01-15',
		status: 'active',
		createdAt: '2023-01-15T00:00:00Z'
	},
	{
		id: 'agreement-2',
		employeeId: 'emp-1',
		type: 'privacy',
		title: '개인정보 처리 동의서',
		content: '개인정보 수집, 이용, 제공에 대한 동의',
		signedDate: '2023-01-15',
		status: 'active',
		createdAt: '2023-01-15T00:00:00Z'
	}
];

// 스토어 생성
export const employees = writable<Employee[]>(initialEmployees);
export const employmentContracts = writable<EmploymentContract[]>(initialContracts);
export const jobDescriptions = writable<JobDescription[]>(initialJobDescriptions);
export const careerRecords = writable<CareerRecord[]>(initialCareerRecords);
export const agreements = writable<Agreement[]>(initialAgreements);

// 직원 관리 함수들
export function addEmployee(employee: Omit<Employee, 'id'>) {
	const newEmployee: Employee = {
		...employee,
		id: `emp-${Date.now()}`
	};
	employees.update(current => [...current, newEmployee]);
}

export function updateEmployee(id: string, updates: Partial<Employee>) {
	employees.update(current =>
		current.map(emp => emp.id === id ? { ...emp, ...updates } : emp)
	);
}

export function deleteEmployee(id: string) {
	employees.update(current => current.filter(emp => emp.id !== id));
}

// 근로계약서 관리 함수들
export function addEmploymentContract(contract: Omit<EmploymentContract, 'id' | 'createdAt' | 'updatedAt'>) {
	const newContract: EmploymentContract = {
		...contract,
		id: `contract-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	employmentContracts.update(current => [...current, newContract]);
}

export function updateEmploymentContract(id: string, updates: Partial<EmploymentContract>) {
	employmentContracts.update(current =>
		current.map(contract => 
			contract.id === id 
				? { ...contract, ...updates, updatedAt: new Date().toISOString() }
				: contract
		)
	);
}

// 직무기술서 관리 함수들
export function addJobDescription(jd: Omit<JobDescription, 'id' | 'createdAt' | 'updatedAt'>) {
	const newJD: JobDescription = {
		...jd,
		id: `jd-${Date.now()}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	jobDescriptions.update(current => [...current, newJD]);
}

export function updateJobDescription(id: string, updates: Partial<JobDescription>) {
	jobDescriptions.update(current =>
		current.map(jd => 
			jd.id === id 
				? { ...jd, ...updates, updatedAt: new Date().toISOString() }
				: jd
		)
	);
}

// 경력 기록 관리 함수들
export function addCareerRecord(record: Omit<CareerRecord, 'id' | 'createdAt'>) {
	const newRecord: CareerRecord = {
		...record,
		id: `career-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	careerRecords.update(current => [...current, newRecord]);
}

export function updateCareerRecord(id: string, updates: Partial<CareerRecord>) {
	careerRecords.update(current =>
		current.map(record => record.id === id ? { ...record, ...updates } : record)
	);
}

// 계약서 관리 함수들
export function addAgreement(agreement: Omit<Agreement, 'id' | 'createdAt'>) {
	const newAgreement: Agreement = {
		...agreement,
		id: `agreement-${Date.now()}`,
		createdAt: new Date().toISOString()
	};
	agreements.update(current => [...current, newAgreement]);
}

export function updateAgreement(id: string, updates: Partial<Agreement>) {
	agreements.update(current =>
		current.map(agreement => agreement.id === id ? { ...agreement, ...updates } : agreement)
	);
}

// 유틸리티 함수들
export function getEmployeeById(id: string, employeeList: Employee[]): Employee | undefined {
	return employeeList.find(emp => emp.id === id);
}

export function getEmployeesByDepartment(department: string, employeeList: Employee[]): Employee[] {
	return employeeList.filter(emp => emp.department === department);
}

export function getActiveEmployees(employeeList: Employee[]): Employee[] {
	return employeeList.filter(emp => emp.status === 'active');
}

export function getEmployeeContract(employeeId: string, contractList: EmploymentContract[]): EmploymentContract | undefined {
	return contractList.find(contract => contract.employeeId === employeeId && contract.status === 'active');
}

export function getEmployeeCareerRecords(employeeId: string, recordList: CareerRecord[]): CareerRecord[] {
	return recordList.filter(record => record.employeeId === employeeId);
}

export function getEmployeeAgreements(employeeId: string, agreementList: Agreement[]): Agreement[] {
	return agreementList.filter(agreement => agreement.employeeId === employeeId);
}
