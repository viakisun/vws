import { UserService } from '$lib/auth/user-service'
import { DatabaseService } from '$lib/database/connection'
import { permissionService } from '$lib/server/services/permission.service'
import type { Handle } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'

// 라우트별 필요 권한 정의
const ROUTE_PERMISSIONS: Record<string, { resource: string; action: string }> = {
  // 재무 관련
  '/api/finance/accounts': { resource: 'finance.accounts', action: 'read' },
  '/api/finance/transactions': { resource: 'finance.transactions', action: 'read' },
  '/api/finance/budgets': { resource: 'finance.budgets', action: 'read' },

  // 인사 관련
  '/api/hr/employees': { resource: 'hr.employees', action: 'read' },
  '/api/hr/payslips': { resource: 'hr.payslips', action: 'read' },
  '/api/hr/attendance': { resource: 'hr.attendance', action: 'read' },
  '/api/hr/leaves': { resource: 'hr.leaves', action: 'read' },

  // 프로젝트 관련
  '/api/projects': { resource: 'project.projects', action: 'read' },

  // 시스템 관리
  '/api/admin/users': { resource: 'system.users', action: 'read' },
  '/api/admin/roles': { resource: 'system.roles', action: 'read' },
}

// HTTP 메소드별 액션 매핑
const METHOD_ACTION_MAP: Record<string, string> = {
  GET: 'read',
  POST: 'write',
  PUT: 'write',
  PATCH: 'write',
  DELETE: 'delete',
}

export const handle: Handle = async ({ event, resolve }) => {
  // Authentication middleware
  try {
    const token = event.cookies.get('auth_token')

    if (token) {
      const userService = UserService.getInstance()
      const payload = userService.verifyToken(token)
      const user = await userService.getUserById(payload.userId)

      if (user && user.is_active) {
        // 직원 정보 조회 (이메일로 연결)
        try {
          const employeeResult = await DatabaseService.query(
            'SELECT * FROM employees WHERE email = $1',
            [user.email],
          )

          if (employeeResult.rows.length > 0) {
            const employee = employeeResult.rows[0]
            // user 객체에 직원 정보 추가
            event.locals.user = {
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
          } else {
            event.locals.user = user
          }
        } catch (_employeeError) {
          // 직원 정보 조회 실패 시 기본 user만 설정
          event.locals.user = user
        }

        // 권한 정보 로드 및 캐싱
        try {
          const permissions = await permissionService.getUserPermissions(user.id)
          event.locals.permissions = permissions
        } catch (_permError) {
          console.error('Failed to load user permissions:', _permError)
          // 권한 로드 실패시 빈 권한으로 설정
          event.locals.permissions = {
            userId: user.id,
            permissions: [],
            roles: [],
            calculatedAt: new Date(),
            expiresAt: new Date(),
          }
        }
      }
    }
  } catch (_error) {
    // Invalid token, clear cookie
    event.cookies.delete('auth_token', { path: '/' })
  }

  // 직원 계정 권한 체크 미들웨어
  if (event.url.pathname.startsWith('/api/')) {
    const user = event.locals.user
    const permissions = event.locals.permissions

    // 공개 API는 인증 불필요
    const publicAPIs = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/auth/google',
      '/api/auth/callback/google',
    ]
    if (!user && !publicAPIs.some((api) => event.url.pathname.startsWith(api))) {
      throw error(401, 'Unauthorized')
    }

    // 시스템 계정 (user.employee 없음) → 모든 API 접근 허용
    if (user && !user.employee) {
      return resolve(event)
    }

    // 직원 계정 (user.employee 있음) → 권한 체크 수행
    if (user && user.employee && permissions) {
      // ADMIN 역할을 가진 직원 → 모든 API 접근 허용
      const isAdmin = permissions.roles.some((role) => role.code === 'ADMIN')
      if (isAdmin) {
        return resolve(event)
      }

      // 일반 직원 → 개별 권한 체크
      for (const [route, requiredPerm] of Object.entries(ROUTE_PERMISSIONS)) {
        if (event.url.pathname.startsWith(route)) {
          const method = event.request.method
          const action = METHOD_ACTION_MAP[method] || requiredPerm.action

          const hasPermission = await permissionService.hasPermission(
            user.id,
            requiredPerm.resource,
            action,
          )

          if (!hasPermission) {
            // 본인 데이터 접근 시도 확인
            if (event.url.pathname.includes('/own') || event.url.pathname.includes('/me')) {
              const hasOwnPermission = await permissionService.hasPermission(
                user.id,
                requiredPerm.resource,
                action,
                'own',
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
