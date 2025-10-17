/**
 * 라우트 경로 Enum
 * - 순수한 enum과 타입 정의만 포함
 * - 다른 파일에 의존하지 않음
 * - 어디서든 안전하게 import 가능
 */

// ============================================
// Routes Enum - 모든 라우트 경로
// ============================================

export enum Routes {
  // 인증
  LOGIN = '/login',
  LOGOUT = '/logout',
  UNAUTHORIZED = '/unauthorized',

  // 대시보드
  DASHBOARD = '/dashboard',
  DASHBOARD_ATTENDANCE = '/dashboard/attendance',
  DASHBOARD_LEAVE = '/dashboard/leave',
  DASHBOARD_PAYSLIP = '/dashboard/payslip',
  DASHBOARD_CERTIFICATE = '/dashboard/certificate',

  // 재무관리
  FINANCE = '/finance',

  // 급여관리
  SALARY = '/salary',

  // 인사관리
  HR = '/hr',
  HR_EMPLOYEES = '/hr/employees',
  HR_ATTENDANCE = '/hr/attendance',
  HR_ATTENDANCE_SETTINGS = '/hr/attendance-settings',
  HR_LEAVE = '/hr/leave-management',
  HR_PERFORMANCE = '/hr/performance',
  HR_RECRUITMENT = '/hr/recruitment',

  // 연구개발 (프로젝트)
  PROJECT = '/research-development',
  PROJECT_DASHBOARD = '/research-development/dashboard',
  PROJECT_PROJECTS = '/research-development/projects',
  PROJECT_DETAIL = '/research-development/projects/:id',
  PROJECT_BUDGET = '/research-development/projects/:id/budget',
  PROJECT_PERSONNEL = '/research-development/projects/:id/personnel',
  PROJECT_DELIVERABLES = '/research-development/projects/:id/deliverables',
  PROJECT_EXPENSES = '/research-development/projects/:id/expenses',
  PROJECT_REPORTS = '/research-development/projects/:id/reports',
  PROJECT_COMPLIANCE = '/research-development/projects/:id/compliance',
  PROJECT_BUDGET_OVERVIEW = '/research-development/budget-overview',
  PROJECT_PARTICIPATION = '/research-development/participation',
  PROJECT_REPORTS_LIST = '/research-development/reports',
  PROJECT_COMPLIANCE_LIST = '/research-development/compliance',

  // Planner
  PLANNER = '/planner',
  PLANNER_ME = '/planner/me',
  PLANNER_PRODUCT_DETAIL = '/planner/products/:id',
  PLANNER_INITIATIVES = '/planner/initiatives',
  PLANNER_INITIATIVE_NEW = '/planner/initiatives/new',
  PLANNER_INITIATIVE_DETAIL = '/planner/initiatives/:id',
  PLANNER_THREADS = '/planner/threads',
  PLANNER_THREAD_NEW = '/planner/threads/new',
  PLANNER_THREAD_DETAIL = '/planner/threads/:id',
  PLANNER_FORMATIONS = '/planner/formations',
  PLANNER_FORMATION_NEW = '/planner/formations/new',
  PLANNER_FORMATION_DETAIL = '/planner/formations/:id',
  PLANNER_MILESTONES = '/planner/milestones',

  // 고객관리
  CRM = '/crm',

  // 일정관리
  CALENDAR = '/calendar',

  // 보고서
  REPORTS = '/reports',

  // 분석
  ANALYTICS = '/analytics',

  // 메시지
  MESSAGES = '/messages',

  // 설정
  SETTINGS = '/settings',

  // 권한관리
  ADMIN_PERMISSIONS = '/admin/permissions',

  // 도움말
  HELP = '/help',

  // ============================================
  // API Routes
  // ============================================

  // 인증 API
  API_AUTH_LOGIN = '/api/auth/login',
  API_AUTH_REGISTER = '/api/auth/register',
  API_AUTH_LOGOUT = '/api/auth/logout',
  API_AUTH_GOOGLE = '/api/auth/google',
  API_AUTH_CALLBACK_GOOGLE = '/api/auth/callback/google',
  API_AUTH_PERMISSIONS = '/api/auth/permissions',

  // 재무 API
  API_FINANCE_ACCOUNTS = '/api/finance/accounts',
  API_FINANCE_TRANSACTIONS = '/api/finance/transactions',
  API_FINANCE_BUDGETS = '/api/finance/budgets',

  // 인사 API
  API_HR_EMPLOYEES = '/api/hr/employees',
  API_HR_PAYSLIPS = '/api/hr/payslips',
  API_HR_ATTENDANCE = '/api/hr/attendance',
  API_HR_LEAVES = '/api/hr/leaves',

  // 프로젝트 API
  API_PROJECTS = '/api/projects',

  // 시스템 관리 API
  API_ADMIN_USERS = '/api/admin/users',
  API_ADMIN_ROLES = '/api/admin/roles',

  // ============================================
  // Asset Management Routes
  // ============================================

  // 자산 관리
  ASSETS = '/assets',
  ASSETS_PHYSICAL = '/assets/physical',
  ASSETS_IP = '/assets/intellectual-property',
  ASSETS_CERTIFICATIONS = '/assets/certifications',
  ASSETS_REQUESTS = '/assets/requests',
  ASSETS_AUDIT = '/assets/audit',

  // 자산 관리 API
  API_ASSETS = '/api/assets',
  API_ASSETS_REQUESTS = '/api/assets/requests',
  API_ASSETS_IP = '/api/assets/ip',
  API_ASSETS_CERTIFICATIONS = '/api/assets/certifications',
  API_ASSETS_AUDIT = '/api/assets/audit',
  API_ASSETS_NOTIFICATIONS = '/api/assets/notifications',

  // ============================================
  // R&D Development Routes (개발자용)
  // ============================================

  // R&D Development
  RD_DEVELOPMENT = '/rd-development',
  RD_DEVELOPMENT_PROJECTS = '/rd-development/projects',
  RD_DEVELOPMENT_PROJECT_DETAIL = '/rd-development/projects/:id',
  RD_DEVELOPMENT_PROJECT_TIMELINE = '/rd-development/projects/:id/timeline',
  RD_DEVELOPMENT_PROJECT_DELIVERABLES = '/rd-development/projects/:id/deliverables',
  RD_DEVELOPMENT_PROJECT_INSTITUTIONS = '/rd-development/projects/:id/institutions',
  RD_DEVELOPMENT_PROJECT_VIA_ROLES = '/rd-development/projects/:id/via-roles',
  RD_DEVELOPMENT_PROJECT_TECHNICAL = '/rd-development/projects/:id/technical-specs',

  // R&D Development API
  API_RD_DEVELOPMENT_PROJECTS = '/api/rd-development/projects',
  API_RD_DEVELOPMENT_PHASES = '/api/rd-development/phases',
  API_RD_DEVELOPMENT_DELIVERABLES = '/api/rd-development/deliverables',
  API_RD_DEVELOPMENT_INSTITUTIONS = '/api/rd-development/institutions',
  API_RD_DEVELOPMENT_VIA_ROLES = '/api/rd-development/via-roles',
  API_RD_DEVELOPMENT_TECHNICAL_SPECS = '/api/rd-development/technical-specs',
  API_RD_DEVELOPMENT_QUARTERLY_MILESTONES = '/api/rd-development/quarterly-milestones',
  API_RD_DEVELOPMENT_TIMELINE = '/api/rd-development/timeline',
}

// ============================================
// Helper Functions
// ============================================

type RouteParams = Record<string, string | number>

/**
 * 라우트 경로에 파라미터를 바인딩하여 실제 URL 생성
 * @example
 * buildRoute(Routes.PROJECT_DETAIL, { id: 123 }) // '/research-development/projects/123'
 */
export function buildRoute(route: Routes, params?: RouteParams): string {
  if (!params) return route

  let path = route as string
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, String(value))
  })
  return path
}

/**
 * 현재 경로가 특정 라우트와 매치되는지 확인
 * @example
 * matchRoute('/planner/products/123', Routes.PLANNER_PRODUCT_DETAIL) // true
 */
export function matchRoute(pathname: string, route: Routes): boolean {
  const pattern = route.replace(/:\w+/g, '[^/]+')
  const regex = new RegExp(`^${pattern}$`)
  return regex.test(pathname)
}

/**
 * 현재 경로가 특정 섹션에 속하는지 확인
 * @example
 * isInSection('/planner/products/123', Routes.PLANNER) // true
 */
export function isInSection(pathname: string, sectionRoute: Routes): boolean {
  return pathname.startsWith(sectionRoute)
}
