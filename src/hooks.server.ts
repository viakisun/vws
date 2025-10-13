import { UserService } from '$lib/auth/user-service'
import { PermissionAction, PermissionScope } from '$lib/config/permissions'
import { ROUTE_PERMISSIONS } from '$lib/config/routes'
import { Routes } from '$lib/config/routes.enum'
import { DatabaseService } from '$lib/database/connection'
import { permissionService } from '$lib/server/services/permission.service'
import { logger } from '$lib/utils/logger'
import type { Handle } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'

// 애플리케이션 시작 시 환경변수 상태 로깅
console.log('=== Application Startup - Environment Check ===')
console.log('Node version:', process.version)
console.log('Platform:', process.platform)
console.log('Timestamp:', new Date().toISOString())
console.log('\nAWS Environment Variables:')
const awsEnvKeys = Object.keys(process.env).filter((k) => k.startsWith('AWS_'))
awsEnvKeys.forEach((key) => {
  const value = process.env[key]
  if (key.includes('SECRET') || key.includes('KEY')) {
    console.log(`- ${key}: ${value ? `SET (length: ${value.length})` : 'NOT SET'}`)
  } else {
    console.log(`- ${key}: ${value || 'NOT SET'}`)
  }
})
console.log('\nOther relevant variables:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET')
console.log('===============================================\n')

// 공개 API 목록 (인증 불필요)
const PUBLIC_API_ROUTES = [
  Routes.API_AUTH_LOGIN,
  Routes.API_AUTH_REGISTER,
  Routes.API_AUTH_LOGOUT,
  Routes.API_AUTH_GOOGLE,
  Routes.API_AUTH_CALLBACK_GOOGLE,
]

// HTTP 메소드별 액션 매핑
// TODO: 현재 POST/PUT/PATCH가 'write'로 매핑되지만 실제로는 READ만 체크됨
// 향후 API 엔드포인트에서 WRITE/DELETE 권한 체크 구현 필요
const METHOD_ACTION_MAP: Record<string, PermissionAction> = {
  GET: PermissionAction.READ,
  POST: PermissionAction.WRITE,
  PUT: PermissionAction.WRITE,
  PATCH: PermissionAction.WRITE,
  DELETE: PermissionAction.DELETE,
}

// ============================================
// 헬퍼 함수들
// ============================================

/** 빈 권한 객체 생성 */
function createEmptyPermissions(userId: string) {
  return {
    userId,
    permissions: [],
    roles: [],
    calculatedAt: new Date(),
    expiresAt: new Date(),
  }
}

/** ADMIN 권한 객체 생성 */
function createAdminPermissions(userId: string) {
  return {
    userId,
    permissions: [], // ADMIN은 권한 체크를 우회하므로 빈 배열
    roles: [
      {
        id: 'system-admin',
        code: 'ADMIN',
        name: 'System Administrator',
        nameKo: '시스템 관리자',
        description: '시스템 전체 권한',
        priority: 100,
      },
    ],
    calculatedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년
  }
}

/** 직원 정보를 user 객체에 병합 */
function mergeEmployeeToUser(user: any, employee: any) {
  return {
    ...user,
    employee: {
      id: employee.id,
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      department: employee.department,
      position: employee.position,
      hire_date: employee.hire_date,
      status: employee.status,
      employment_type: employee.employment_type,
      phone: employee.phone,
      birth_date: employee.birth_date,
    },
  }
}

/** 시스템 관리자 계정 처리 */
async function handleSystemAdmin(event: any, user: any) {
  event.locals.user = user
  event.locals.permissions = createAdminPermissions(user.id)
}

/** 직원 계정 처리 */
async function handleEmployeeAccount(event: any, user: any) {
  try {
    const employeeResult = await DatabaseService.query(
      `SELECT 
        id, 
        employee_id, 
        first_name, 
        last_name, 
        email, 
        department, 
        position, 
        hire_date::text as hire_date, 
        birth_date::text as birth_date,
        status, 
        employment_type, 
        phone,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM employees 
      WHERE email = $1`,
      [user.email],
    )

    if (employeeResult.rows.length === 0) {
      // 직원 정보 없음 → 권한 없는 일반 사용자
      event.locals.user = user
      event.locals.permissions = createEmptyPermissions(user.id)
      return
    }

    const employee = employeeResult.rows[0]

    // 직원 정보를 user에 병합
    event.locals.user = mergeEmployeeToUser(user, employee)

    // 직원 권한 로드
    try {
      const permissions = await permissionService.getUserPermissions(employee.id)
      event.locals.permissions = permissions
    } catch (permError) {
      logger.error('Failed to load employee permissions:', permError)
      event.locals.permissions = createEmptyPermissions(employee.id)
    }
  } catch (error) {
    logger.error('Failed to query employee:', error)
    event.locals.user = user
    event.locals.permissions = createEmptyPermissions(user.id)
  }
}

// ============================================
// Main Handle
// ============================================

export const handle: Handle = async ({ event, resolve }) => {
  // Authentication middleware
  try {
    const token = event.cookies.get('auth_token')

    if (token) {
      const userService = UserService.getInstance()
      const payload = userService.verifyToken(token)
      const user = await userService.getUserById(payload.userId)

      if (user && user.is_active) {
        // 계정 타입에 따라 분기 처리
        if (user.account_type === 'system') {
          await handleSystemAdmin(event, user)
        } else {
          await handleEmployeeAccount(event, user)
        }
      }
    }
  } catch (_error) {
    // Invalid token, clear cookie
    event.cookies.delete('auth_token', { path: '/' })
  }

  // API 권한 체크 미들웨어
  if (event.url.pathname.startsWith('/api/')) {
    const user = event.locals.user
    const permissions = event.locals.permissions

    // 공개 API는 인증 불필요
    if (!user && !PUBLIC_API_ROUTES.some((route) => event.url.pathname.startsWith(route))) {
      throw error(401, 'Unauthorized')
    }

    // 시스템 계정 → 모든 API 접근 허용
    if (user && !user.employee) {
      return resolve(event)
    }

    // 직원 계정 → 권한 체크 수행
    if (user && user.employee && permissions) {
      // ADMIN 역할 → 모든 API 접근 허용
      const isAdmin = permissions.roles.some((role) => role.code === 'ADMIN')
      if (isAdmin) {
        return resolve(event)
      }

      // 일반 직원 → 개별 권한 체크
      for (const [routeKey, permission] of Object.entries(ROUTE_PERMISSIONS)) {
        const route = routeKey as string

        if (event.url.pathname.startsWith(route)) {
          // 리소스 권한이 없으면 스킵 (역할 기반 라우트)
          if (!permission.resource) {
            break
          }

          const method = event.request.method
          const action = METHOD_ACTION_MAP[method] || permission.action || 'read'

          const hasPermission = await permissionService.hasPermission(
            user.employee.id,
            permission.resource,
            action,
          )

          if (!hasPermission) {
            // 본인 데이터 접근 시도 확인
            if (event.url.pathname.includes('/own') || event.url.pathname.includes('/me')) {
              const hasOwnPermission = await permissionService.hasPermission(
                user.employee.id,
                permission.resource,
                action,
                PermissionScope.OWN,
              )

              if (!hasOwnPermission) {
                throw error(403, 'Insufficient permissions')
              }
            } else {
              throw error(403, 'Insufficient permissions')
            }
          }
          break
        }
      }
    }
  }

  return resolve(event)
}
