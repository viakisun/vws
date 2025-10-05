import { UserService } from '$lib/auth/user-service'
import { DatabaseService } from '$lib/database/connection'
import type { Handle } from '@sveltejs/kit'

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
        } catch (employeeError) {
          // 직원 정보 조회 실패 시 기본 user만 설정
          event.locals.user = user
        }
      }
    }
  } catch (error) {
    // Invalid token, clear cookie
    event.cookies.delete('auth_token', { path: '/' })
  }

  return resolve(event)
}
