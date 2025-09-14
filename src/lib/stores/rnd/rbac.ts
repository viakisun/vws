// R&D 통합관리 시스템 RBAC (Role-Based Access Control) 구현

import { writable, derived } from 'svelte/store';
import { 
	UserRole, 
	Permission, 
	type Person, 
	type UUID 
} from './types';

// ===== 권한 매트릭스 정의 =====
const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
	[UserRole.RESEARCHER]: [
		Permission.READ_PROJECT,
		Permission.UPLOAD_DOCUMENT,
		Permission.CREATE_REPORT
	],
	[UserRole.PM]: [
		Permission.READ_PROJECT,
		Permission.WRITE_PROJECT,
		Permission.APPROVE_EXPENSE,
		Permission.MANAGE_PERSONNEL,
		Permission.CREATE_REPORT,
		Permission.UPLOAD_DOCUMENT
	],
	[UserRole.DEPARTMENT_HEAD]: [
		Permission.READ_PROJECT,
		Permission.WRITE_PROJECT,
		Permission.APPROVE_EXPENSE,
		Permission.UPLOAD_DOCUMENT
	],
	[UserRole.MANAGEMENT_SUPPORT]: [
		Permission.READ_ALL,
		Permission.WRITE_ALL,
		Permission.APPROVE_ALL,
		Permission.MANAGE_BUDGET,
		Permission.MANAGE_PERSONNEL,
		Permission.CREATE_REPORT,
		Permission.UPLOAD_DOCUMENT,
		Permission.VIEW_AUDIT_LOG
	],
	[UserRole.LAB_HEAD]: [
		Permission.READ_ALL,
		Permission.WRITE_PROJECT,
		Permission.APPROVE_ALL,
		Permission.MANAGE_PERSONNEL,
		Permission.CREATE_REPORT,
		Permission.VIEW_AUDIT_LOG
	],
	[UserRole.EXECUTIVE]: [
		Permission.READ_ALL,
		Permission.APPROVE_ALL,
		Permission.MANAGE_BUDGET,
		Permission.MANAGE_PERSONNEL,
		Permission.VIEW_AUDIT_LOG
	],
	[UserRole.AUDITOR]: [
		Permission.READ_ALL,
		Permission.VIEW_AUDIT_LOG
	]
};

// ===== 엔터티별 권한 정의 =====
const ENTITY_PERMISSIONS: Record<string, Record<UserRole, string[]>> = {
	Project: {
		[UserRole.RESEARCHER]: ['read'],
		[UserRole.PM]: ['read', 'write', 'approve'],
		[UserRole.DEPARTMENT_HEAD]: ['read', 'write'],
		[UserRole.MANAGEMENT_SUPPORT]: ['read', 'write', 'approve', 'lock'],
		[UserRole.LAB_HEAD]: ['read', 'write', 'approve'],
		[UserRole.EXECUTIVE]: ['read', 'approve', 'lock'],
		[UserRole.AUDITOR]: ['read']
	},
	ExpenseItem: {
		[UserRole.RESEARCHER]: ['read'],
		[UserRole.PM]: ['read', 'write', 'approve'],
		[UserRole.DEPARTMENT_HEAD]: ['read', 'write', 'approve'],
		[UserRole.MANAGEMENT_SUPPORT]: ['read', 'write', 'approve', 'lock'],
		[UserRole.LAB_HEAD]: ['read', 'write', 'approve'],
		[UserRole.EXECUTIVE]: ['read', 'approve'],
		[UserRole.AUDITOR]: ['read']
	},
	Document: {
		[UserRole.RESEARCHER]: ['read', 'write'],
		[UserRole.PM]: ['read', 'write', 'approve'],
		[UserRole.DEPARTMENT_HEAD]: ['read', 'write'],
		[UserRole.MANAGEMENT_SUPPORT]: ['read', 'write', 'approve', 'lock'],
		[UserRole.LAB_HEAD]: ['read', 'write', 'approve'],
		[UserRole.EXECUTIVE]: ['read', 'approve'],
		[UserRole.AUDITOR]: ['read']
	},
	ResearchNote: {
		[UserRole.RESEARCHER]: ['read', 'write'],
		[UserRole.PM]: ['read', 'write', 'approve'],
		[UserRole.DEPARTMENT_HEAD]: ['read'],
		[UserRole.MANAGEMENT_SUPPORT]: ['read', 'write'],
		[UserRole.LAB_HEAD]: ['read', 'write', 'approve'],
		[UserRole.EXECUTIVE]: ['read'],
		[UserRole.AUDITOR]: ['read']
	},
	SubmissionBundle: {
		[UserRole.RESEARCHER]: [],
		[UserRole.PM]: ['read'],
		[UserRole.DEPARTMENT_HEAD]: ['read'],
		[UserRole.MANAGEMENT_SUPPORT]: ['read', 'write', 'approve'],
		[UserRole.LAB_HEAD]: ['read'],
		[UserRole.EXECUTIVE]: ['read', 'approve'],
		[UserRole.AUDITOR]: ['read', 'lock']
	}
};

// ===== 현재 사용자 스토어 =====
export const currentUser = writable<Person | null>(null);

// ===== 사용자 역할 스토어 =====
export const userRoles = writable<UserRole[]>([]);

// ===== 사용자 권한 스토어 =====
export const userPermissions = derived(
	userRoles,
	($userRoles) => {
		const permissions = new Set<Permission>();
		$userRoles.forEach(role => {
			PERMISSION_MATRIX[role]?.forEach(permission => {
				permissions.add(permission);
			});
		});
		return Array.from(permissions);
	}
);

// ===== RBAC 함수들 =====

/**
 * 사용자에게 특정 권한이 있는지 확인
 */
export function hasPermission(permission: Permission, userRoles: UserRole[]): boolean {
	return userRoles.some(role => 
		PERMISSION_MATRIX[role]?.includes(permission)
	);
}

/**
 * 사용자가 특정 엔터티에 대해 특정 액션을 수행할 수 있는지 확인
 */
export function canPerformAction(
	entity: string, 
	action: string, 
	userRoles: UserRole[]
): boolean {
	return userRoles.some(role => {
		const entityPermissions = ENTITY_PERMISSIONS[entity];
		if (!entityPermissions || !entityPermissions[role]) {
			return false;
		}
		return entityPermissions[role].includes(action);
	});
}

/**
 * 사용자의 모든 권한을 가져옴
 */
export function getUserPermissions(userRoles: UserRole[]): Permission[] {
	const permissions = new Set<Permission>();
	userRoles.forEach(role => {
		PERMISSION_MATRIX[role]?.forEach(permission => {
			permissions.add(permission);
		});
	});
	return Array.from(permissions);
}

/**
 * 특정 역할의 모든 권한을 가져옴
 */
export function getRolePermissions(role: UserRole): Permission[] {
	return PERMISSION_MATRIX[role] || [];
}

/**
 * 사용자 역할 설정
 */
export function setUserRoles(roles: UserRole[]): void {
	userRoles.set(roles);
}

/**
 * 사용자 역할 추가
 */
export function addUserRole(role: UserRole): void {
	userRoles.update(roles => {
		if (!roles.includes(role)) {
			return [...roles, role];
		}
		return roles;
	});
}

/**
 * 사용자 역할 제거
 */
export function removeUserRole(role: UserRole): void {
	userRoles.update(roles => roles.filter(r => r !== role));
}

/**
 * 현재 사용자 설정
 */
export function setCurrentUser(user: Person): void {
	currentUser.set(user);
	setUserRoles(user.roleSet);
}

/**
 * 현재 사용자 정보 가져오기
 */
export function getCurrentUser(): Person | null {
	let user: Person | null = null;
	currentUser.subscribe(value => user = value)();
	return user;
}

/**
 * 권한 체크 헬퍼 함수들
 */
export const permissionChecks = {
	canReadAll: (roles: UserRole[]) => hasPermission(Permission.READ_ALL, roles),
	canWriteAll: (roles: UserRole[]) => hasPermission(Permission.WRITE_ALL, roles),
	canApproveAll: (roles: UserRole[]) => hasPermission(Permission.APPROVE_ALL, roles),
	canAuditAll: (roles: UserRole[]) => hasPermission(Permission.AUDIT_ALL, roles),
	canManageBudget: (roles: UserRole[]) => hasPermission(Permission.MANAGE_BUDGET, roles),
	canManagePersonnel: (roles: UserRole[]) => hasPermission(Permission.MANAGE_PERSONNEL, roles),
	canCreateReport: (roles: UserRole[]) => hasPermission(Permission.CREATE_REPORT, roles),
	canUploadDocument: (roles: UserRole[]) => hasPermission(Permission.UPLOAD_DOCUMENT, roles),
	canViewAuditLog: (roles: UserRole[]) => hasPermission(Permission.VIEW_AUDIT_LOG, roles)
};

/**
 * 엔터티별 권한 체크 헬퍼 함수들
 */
export const entityPermissionChecks = {
	canReadProject: (roles: UserRole[]) => canPerformAction('Project', 'read', roles),
	canWriteProject: (roles: UserRole[]) => canPerformAction('Project', 'write', roles),
	canApproveProject: (roles: UserRole[]) => canPerformAction('Project', 'approve', roles),
	canLockProject: (roles: UserRole[]) => canPerformAction('Project', 'lock', roles),
	
	canReadExpense: (roles: UserRole[]) => canPerformAction('ExpenseItem', 'read', roles),
	canWriteExpense: (roles: UserRole[]) => canPerformAction('ExpenseItem', 'write', roles),
	canApproveExpense: (roles: UserRole[]) => canPerformAction('ExpenseItem', 'approve', roles),
	canLockExpense: (roles: UserRole[]) => canPerformAction('ExpenseItem', 'lock', roles),
	
	canReadDocument: (roles: UserRole[]) => canPerformAction('Document', 'read', roles),
	canWriteDocument: (roles: UserRole[]) => canPerformAction('Document', 'write', roles),
	canApproveDocument: (roles: UserRole[]) => canPerformAction('Document', 'approve', roles),
	canLockDocument: (roles: UserRole[]) => canPerformAction('Document', 'lock', roles),
	
	canReadResearchNote: (roles: UserRole[]) => canPerformAction('ResearchNote', 'read', roles),
	canWriteResearchNote: (roles: UserRole[]) => canPerformAction('ResearchNote', 'write', roles),
	canApproveResearchNote: (roles: UserRole[]) => canPerformAction('ResearchNote', 'approve', roles),
	
	canReadSubmissionBundle: (roles: UserRole[]) => canPerformAction('SubmissionBundle', 'read', roles),
	canWriteSubmissionBundle: (roles: UserRole[]) => canPerformAction('SubmissionBundle', 'write', roles),
	canApproveSubmissionBundle: (roles: UserRole[]) => canPerformAction('SubmissionBundle', 'approve', roles),
	canLockSubmissionBundle: (roles: UserRole[]) => canPerformAction('SubmissionBundle', 'lock', roles)
};

/**
 * 역할별 메뉴 접근 권한 확인
 */
export function canAccessMenu(menuName: string, roles: UserRole[]): boolean {
	const menuPermissions: Record<string, Permission[]> = {
		'대시보드': [Permission.READ_PROJECT],
		'프로젝트 관리': [Permission.READ_PROJECT, Permission.WRITE_PROJECT],
		'예산 관리': [Permission.MANAGE_BUDGET],
		'지출 관리': [Permission.APPROVE_EXPENSE],
		'인력 관리': [Permission.MANAGE_PERSONNEL],
		'연구노트': [Permission.READ_PROJECT],
		'리포트': [Permission.CREATE_REPORT],
		'결재 관리': [Permission.APPROVE_ALL],
		'국가R&D 업로드': [Permission.WRITE_ALL],
		'감사 로그': [Permission.VIEW_AUDIT_LOG]
	};

	const requiredPermissions = menuPermissions[menuName];
	if (!requiredPermissions) return false;

	return requiredPermissions.some(permission => hasPermission(permission, roles));
}

/**
 * 데이터 마스킹 (민감 정보 보호)
 */
export function maskSensitiveData(data: any, roles: UserRole[]): any {
	if (!data) return data;

	// 경영지원팀과 경영진만 급여 정보 조회 가능
	const canViewSalary = roles.some(role => 
		[UserRole.MANAGEMENT_SUPPORT, UserRole.EXECUTIVE].includes(role)
	);

	if (!canViewSalary && data.salary) {
		data.salary = '***';
	}

	// 개인정보 마스킹 (연구원은 본인 정보만 조회 가능)
	const canViewPersonalInfo = roles.some(role => 
		[UserRole.MANAGEMENT_SUPPORT, UserRole.EXECUTIVE, UserRole.LAB_HEAD].includes(role)
	);

	if (!canViewPersonalInfo) {
		if (data.phone) data.phone = '***-****-****';
		if (data.email) data.email = data.email.replace(/(.{2}).*(@.*)/, '$1***$2');
	}

	return data;
}

/**
 * 역할별 대시보드 타입 결정
 */
export function getDashboardType(roles: UserRole[]): string {
	if (roles.includes(UserRole.EXECUTIVE)) return 'executive';
	if (roles.includes(UserRole.LAB_HEAD)) return 'lab_head';
	if (roles.includes(UserRole.PM)) return 'pm';
	if (roles.includes(UserRole.MANAGEMENT_SUPPORT)) return 'management_support';
	if (roles.includes(UserRole.DEPARTMENT_HEAD)) return 'department_head';
	return 'researcher';
}

/**
 * 역할별 우선순위 (높을수록 권한이 높음)
 */
const ROLE_PRIORITY: Record<UserRole, number> = {
	[UserRole.RESEARCHER]: 1,
	[UserRole.DEPARTMENT_HEAD]: 2,
	[UserRole.PM]: 3,
	[UserRole.MANAGEMENT_SUPPORT]: 4,
	[UserRole.LAB_HEAD]: 5,
	[UserRole.EXECUTIVE]: 6,
	[UserRole.AUDITOR]: 7
};

/**
 * 사용자의 최고 권한 역할 가져오기
 */
export function getHighestRole(roles: UserRole[]): UserRole | null {
	if (roles.length === 0) return null;
	
	return roles.reduce((highest, current) => {
		return ROLE_PRIORITY[current] > ROLE_PRIORITY[highest] ? current : highest;
	});
}

/**
 * 역할별 설명
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
	[UserRole.RESEARCHER]: '연구원 - 연구노트 작성, 산출물 업로드, 본인 휴가/참여율 확인',
	[UserRole.PM]: 'PM(과제책임자) - 분기 목표/산출물 정의, 참여 배정, 지출요청 승인(1차), 리스크 등록',
	[UserRole.DEPARTMENT_HEAD]: '담당부서(구매·기술 등) - 카테고리별 지출 집행/검수, 문서 수취',
	[UserRole.MANAGEMENT_SUPPORT]: '경영지원(회계·총무) - 예산 항목 관리, 증빙 검토, 내부 전자결재 기안/종결, 국가R&D 업로드 번들 생성',
	[UserRole.LAB_HEAD]: '연구소장 - 주간/분기 리포트 수신, 중요 승인(2차), 인력 교체 승인',
	[UserRole.EXECUTIVE]: '경영진 - 의사결정/에스컬레이션 승인, 신규 채용 트리거 승인',
	[UserRole.AUDITOR]: '감사/외부평가 - 읽기 전용(감사 로그/증빙 번들 열람)'
};

/**
 * 역할별 한글명
 */
export const ROLE_NAMES_KO: Record<UserRole, string> = {
	[UserRole.RESEARCHER]: '연구원',
	[UserRole.PM]: 'PM(과제책임자)',
	[UserRole.DEPARTMENT_HEAD]: '담당부서',
	[UserRole.MANAGEMENT_SUPPORT]: '경영지원',
	[UserRole.LAB_HEAD]: '연구소장',
	[UserRole.EXECUTIVE]: '경영진',
	[UserRole.AUDITOR]: '감사'
};

// ===== 초기화 함수 =====
export function initializeRBAC(): void {
	// 기본 사용자 설정 (경영지원팀)
	const defaultUser: Person = {
		id: 'user-001',
		name: '김경영',
		email: 'kim.kyung@company.com',
		phone: '010-1234-5678',
		department: '경영지원팀',
		position: '팀장',
		roleSet: [UserRole.MANAGEMENT_SUPPORT],
		active: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	setCurrentUser(defaultUser);
}

// ===== 내보내기 =====
export {
	PERMISSION_MATRIX,
	ENTITY_PERMISSIONS,
	ROLE_PRIORITY
};
