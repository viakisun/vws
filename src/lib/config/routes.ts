/**
 * 라우트 권한 설정
 * - 페이지 및 API 엔드포인트의 권한 관리
 * - 서버/클라이언트 공통 사용
 *
 * Note: Routes enum은 './routes.enum'에서 직접 import하세요
 * Note: 네비게이션 메뉴는 './navigation'에서 관리합니다
 *
 * TODO: 현재 모든 라우트가 PermissionAction.READ만 사용 중
 * WRITE/DELETE/APPROVE 액션은 향후 API 레벨에서 구현 필요
 */

import { Resource, RoleCode } from '$lib/stores/permissions'
import { Routes } from './routes.enum'
import { PermissionAction, PermissionScope } from './permissions'

// ============================================
// Permission Configuration
// ============================================

export interface RoutePermission {
  /** 리소스 권한 */
  resource?: Resource
  /** 필요한 액션 (기본: read) - TODO: WRITE/DELETE/APPROVE 구현 필요 */
  action?: PermissionAction
  /** 권한 범위 */
  scope?: PermissionScope
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
 *
 * TODO: 현재 모든 라우트가 action: PermissionAction.READ만 사용
 * 향후 API 엔드포인트에서 WRITE/DELETE 권한 체크 추가 필요
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // 공통
  [Routes.CALENDAR]: {
    resource: Resource.CALENDAR,
    action: PermissionAction.READ,
    fallback: Routes.DASHBOARD,
  },
  [Routes.MESSAGES]: {
    resource: Resource.MESSAGES,
    action: PermissionAction.READ,
    fallback: Routes.DASHBOARD,
  },

  // 재무
  [Routes.FINANCE]: {
    resource: Resource.FINANCE_ACCOUNTS,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },

  // 급여
  [Routes.SALARY]: {
    resource: Resource.SALARY_MANAGEMENT,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },

  // 인사
  [Routes.HR]: {
    resource: Resource.HR_EMPLOYEES,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.HR_EMPLOYEES]: {
    resource: Resource.HR_EMPLOYEES,
    action: PermissionAction.READ,
  },
  [Routes.HR_ATTENDANCE]: {
    resource: Resource.HR_ATTENDANCE,
    action: PermissionAction.READ,
  },
  [Routes.HR_LEAVE]: {
    resource: Resource.HR_LEAVES,
    action: PermissionAction.READ,
  },

  // 프로젝트
  [Routes.PROJECT]: {
    resource: Resource.PROJECT_PROJECTS,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.PROJECT_PROJECTS]: {
    resource: Resource.PROJECT_PROJECTS,
    action: PermissionAction.READ,
  },

  // Planner
  [Routes.PLANNER]: {
    resource: Resource.PLANNER_PRODUCTS,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.PLANNER_PRODUCTS]: {
    resource: Resource.PLANNER_PRODUCTS,
    action: PermissionAction.READ,
  },
  [Routes.PLANNER_INITIATIVES]: {
    resource: Resource.PLANNER_INITIATIVES,
    action: PermissionAction.READ,
  },
  [Routes.PLANNER_THREADS]: {
    resource: Resource.PLANNER_THREADS,
    action: PermissionAction.READ,
  },
  [Routes.PLANNER_FORMATIONS]: {
    resource: Resource.PLANNER_FORMATIONS,
    action: PermissionAction.READ,
  },
  [Routes.PLANNER_MILESTONES]: {
    resource: Resource.PLANNER_MILESTONES,
    action: PermissionAction.READ,
  },

  // 영업/고객
  [Routes.SALES]: {
    resource: Resource.SALES_CUSTOMERS,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.CRM]: {
    resource: Resource.CRM,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },

  // 보고서/분석 (리소스 기반)
  [Routes.REPORTS]: {
    resource: Resource.REPORTS,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },
  [Routes.ANALYTICS]: {
    resource: Resource.ANALYTICS,
    action: PermissionAction.READ,
    fallback: Routes.UNAUTHORIZED,
  },

  // 권한관리 (ADMIN만)
  [Routes.ADMIN_PERMISSIONS]: {
    roles: [RoleCode.ADMIN],
    fallback: Routes.DASHBOARD,
  },

  // ============================================
  // API Routes Permissions
  // TODO: POST/PUT/DELETE 엔드포인트에서 WRITE/DELETE 권한 체크 추가 필요
  // ============================================

  // 재무 API
  [Routes.API_FINANCE_ACCOUNTS]: {
    resource: Resource.FINANCE_ACCOUNTS,
    action: PermissionAction.READ,
  },
  [Routes.API_FINANCE_TRANSACTIONS]: {
    resource: Resource.FINANCE_TRANSACTIONS,
    action: PermissionAction.READ,
  },
  [Routes.API_FINANCE_BUDGETS]: {
    resource: Resource.FINANCE_BUDGETS,
    action: PermissionAction.READ,
  },

  // 인사 API
  [Routes.API_HR_EMPLOYEES]: {
    resource: Resource.HR_EMPLOYEES,
    action: PermissionAction.READ,
  },
  [Routes.API_HR_PAYSLIPS]: {
    resource: Resource.HR_PAYSLIPS,
    action: PermissionAction.READ,
  },
  [Routes.API_HR_ATTENDANCE]: {
    resource: Resource.HR_ATTENDANCE,
    action: PermissionAction.READ,
  },
  [Routes.API_HR_LEAVES]: {
    resource: Resource.HR_LEAVES,
    action: PermissionAction.READ,
  },

  // 프로젝트 API
  [Routes.API_PROJECTS]: {
    resource: Resource.PROJECT_PROJECTS,
    action: PermissionAction.READ,
  },

  // 시스템 관리 API
  [Routes.API_ADMIN_USERS]: {
    resource: Resource.SYSTEM_USERS,
    action: PermissionAction.READ,
  },
  [Routes.API_ADMIN_ROLES]: {
    resource: Resource.SYSTEM_ROLES,
    action: PermissionAction.READ,
  },
}
