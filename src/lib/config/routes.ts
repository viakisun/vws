/**
 * 라우트 권한 설정
 * - 페이지 및 API 엔드포인트의 권한 관리
 * - 서버/클라이언트 공통 사용
 *
 * Note: Routes enum은 './routes.enum'에서 직접 import하세요
 * Note: 네비게이션 메뉴는 './navigation'에서 관리합니다
 */

import { Resource, RoleCode } from '$lib/stores/permissions'
import { Routes } from './routes.enum'

// ============================================
// Permission Configuration
// ============================================

export interface RoutePermission {
  /** 리소스 권한 */
  resource?: Resource
  /** 필요한 액션 (기본: read) */
  action?: 'read' | 'write' | 'delete' | 'approve'
  /** 권한 범위 */
  scope?: 'own' | 'department' | 'all'
  /** 필요한 역할 (하나라도 만족하면 OK) */
  roles?: RoleCode[]
  /** 모든 조건을 만족해야 하는지 */
  requireAll?: boolean
  /** 권한 없을 때 리다이렉트할 경로 */
  fallback?: Routes
}

/**
 * 라우트별 권한 설정
 * 여기에 정의된 라우트는 자동으로 권한 체크됨
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // 재무
  [Routes.FINANCE]: {
    resource: Resource.FINANCE_ACCOUNTS,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },

  // 급여
  [Routes.SALARY]: {
    resource: Resource.SALARY_MANAGEMENT,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },

  // 인사
  [Routes.HR]: {
    resource: Resource.HR_EMPLOYEES,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.HR_EMPLOYEES]: {
    resource: Resource.HR_EMPLOYEES,
    action: 'read',
  },
  [Routes.HR_ATTENDANCE]: {
    resource: Resource.HR_ATTENDANCE,
    action: 'read',
  },
  [Routes.HR_LEAVE]: {
    resource: Resource.HR_LEAVES,
    action: 'read',
  },

  // 프로젝트
  [Routes.PROJECT]: {
    resource: Resource.PROJECT_PROJECTS,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.PROJECT_PROJECTS]: {
    resource: Resource.PROJECT_PROJECTS,
    action: 'read',
  },

  // Planner
  [Routes.PLANNER]: {
    resource: Resource.PLANNER_PRODUCTS,
    action: 'read',
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.PLANNER_PRODUCTS]: {
    resource: Resource.PLANNER_PRODUCTS,
    action: 'read',
  },
  [Routes.PLANNER_INITIATIVES]: {
    resource: Resource.PLANNER_INITIATIVES,
    action: 'read',
  },
  [Routes.PLANNER_THREADS]: {
    resource: Resource.PLANNER_THREADS,
    action: 'read',
  },
  [Routes.PLANNER_FORMATIONS]: {
    resource: Resource.PLANNER_FORMATIONS,
    action: 'read',
  },
  [Routes.PLANNER_MILESTONES]: {
    resource: Resource.PLANNER_MILESTONES,
    action: 'read',
  },

  // 영업/고객 (역할 기반)
  [Routes.SALES]: {
    roles: [RoleCode.SALES, RoleCode.MANAGEMENT, RoleCode.ADMIN],
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.CRM]: {
    roles: [RoleCode.SALES, RoleCode.MANAGEMENT, RoleCode.ADMIN],
    fallback: Routes.UNAUTHORIZED,
  },

  // 보고서/분석 (역할 기반)
  [Routes.REPORTS]: {
    roles: [RoleCode.MANAGEMENT, RoleCode.RESEARCH_DIRECTOR, RoleCode.ADMIN],
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.ANALYTICS]: {
    roles: [RoleCode.MANAGEMENT, RoleCode.FINANCE_MANAGER, RoleCode.ADMIN],
    fallback: Routes.UNAUTHORIZED,
  },

  // 권한관리 (ADMIN만)
  [Routes.ADMIN_PERMISSIONS]: {
    roles: [RoleCode.ADMIN],
    fallback: Routes.DASHBOARD,
  },

  // ============================================
  // API Routes Permissions
  // ============================================

  // 재무 API
  [Routes.API_FINANCE_ACCOUNTS]: {
    resource: Resource.FINANCE_ACCOUNTS,
    action: 'read',
  },
  [Routes.API_FINANCE_TRANSACTIONS]: {
    resource: Resource.FINANCE_TRANSACTIONS,
    action: 'read',
  },
  [Routes.API_FINANCE_BUDGETS]: {
    resource: Resource.FINANCE_BUDGETS,
    action: 'read',
  },

  // 인사 API
  [Routes.API_HR_EMPLOYEES]: {
    resource: Resource.HR_EMPLOYEES,
    action: 'read',
  },
  [Routes.API_HR_PAYSLIPS]: {
    resource: Resource.HR_PAYSLIPS,
    action: 'read',
  },
  [Routes.API_HR_ATTENDANCE]: {
    resource: Resource.HR_ATTENDANCE,
    action: 'read',
  },
  [Routes.API_HR_LEAVES]: {
    resource: Resource.HR_LEAVES,
    action: 'read',
  },

  // 프로젝트 API
  [Routes.API_PROJECTS]: {
    resource: Resource.PROJECT_PROJECTS,
    action: 'read',
  },

  // 시스템 관리 API
  [Routes.API_ADMIN_USERS]: {
    resource: Resource.SYSTEM_USERS,
    action: 'read',
  },
  [Routes.API_ADMIN_ROLES]: {
    resource: Resource.SYSTEM_ROLES,
    action: 'read',
  },
}
