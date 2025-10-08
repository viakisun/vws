import { DatabaseService } from '$lib/database/connection'

// 권한 타입 정의
export interface Permission {
  code: string
  resource: string
  action: string
  scope: 'own' | 'department' | 'all'
}

export interface Role {
  id: string
  code: string
  name: string
  nameKo: string
  description?: string
  priority: number
  parentRoleId?: string
}

export interface UserPermissionCache {
  userId: string
  permissions: Permission[]
  roles: Role[]
  calculatedAt: Date
  expiresAt: Date
}

// 역할 코드 enum
export enum RoleCode {
  ADMIN = 'ADMIN',
  MANAGEMENT = 'MANAGEMENT',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  HR_MANAGER = 'HR_MANAGER',
  ADMINISTRATOR = 'ADMINISTRATOR',
  RESEARCH_DIRECTOR = 'RESEARCH_DIRECTOR',
  SALES = 'SALES',
  RESEARCHER = 'RESEARCHER',
  EMPLOYEE = 'EMPLOYEE',
}

// 권한 액션 enum
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  APPROVE = 'approve',
}

export class PermissionService {
  /**
   * 사용자의 권한 캐시를 가져오거나 새로 계산
   */
  async getUserPermissions(userId: string): Promise<UserPermissionCache> {
    try {
      // 1. 시스템 계정 확인
      const systemAccount = await DatabaseService.query(
        `SELECT id FROM system_accounts WHERE id = $1`,
        [userId],
      )

      if (systemAccount.rows.length > 0) {
        // 시스템 계정은 모든 권한 자동 부여
        const allRoles = await this.getAllRoles()
        const allPermissions = await DatabaseService.query(
          `SELECT code, resource, action, scope FROM permissions WHERE is_active = true`,
        )

        return {
          userId,
          permissions: allPermissions.rows as Permission[],
          roles: allRoles,
          calculatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간
        }
      }

      // 2. 캐시 확인 (직원 계정만)
      const cached = await DatabaseService.query(
        `SELECT employee_id as "userId", permissions, roles, calculated_at as "calculatedAt", expires_at as "expiresAt"
         FROM permission_cache
         WHERE employee_id = $1 AND expires_at > NOW()`,
        [userId],
      )

      if (cached.rows.length > 0) {
        return cached.rows[0]
      }

      // 3. 권한 새로 계산 (직원 계정)
      return await this.refreshPermissionCache(userId)
    } catch (error) {
      console.error('Failed to get user permissions:', error)
      throw new Error('권한 정보를 가져올 수 없습니다.')
    }
  }

  /**
   * 사용자 권한 캐시 갱신 (직원 계정만)
   */
  async refreshPermissionCache(employeeId: string): Promise<UserPermissionCache> {
    try {
      // 1. 직원의 역할 가져오기
      const rolesResult = await DatabaseService.query(
        `SELECT DISTINCT
           r.id,
           r.code,
           r.name,
           r.name_ko as "nameKo",
           r.priority
         FROM employee_roles er
         JOIN roles r ON r.id = er.role_id
         WHERE er.employee_id = $1 AND er.is_active = true AND r.is_active = true
         ORDER BY r.priority DESC`,
        [employeeId],
      )

      const roles = rolesResult.rows as Role[]

      // 2. 역할별 권한 가져오기
      const permissionsResult = await DatabaseService.query(
        `SELECT DISTINCT
           p.code,
           p.resource,
           p.action,
           p.scope
         FROM employee_roles er
         JOIN role_permissions rp ON rp.role_id = er.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE er.employee_id = $1 AND er.is_active = true AND p.is_active = true`,
        [employeeId],
      )

      const permissions = permissionsResult.rows as Permission[]

      // 3. 캐시 저장
      const cache: UserPermissionCache = {
        userId: employeeId,
        permissions,
        roles,
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후 만료
      }

      await DatabaseService.query(
        `INSERT INTO permission_cache (employee_id, permissions, roles, calculated_at, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (employee_id) DO UPDATE
         SET permissions = $2, roles = $3, calculated_at = $4, expires_at = $5`,
        [
          employeeId,
          JSON.stringify(permissions),
          JSON.stringify(roles),
          cache.calculatedAt,
          cache.expiresAt,
        ],
      )

      return cache
    } catch (error) {
      console.error('Failed to refresh permission cache:', error)
      throw new Error('권한 캐시 갱신에 실패했습니다.')
    }
  }

  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    scope?: 'own' | 'department' | 'all',
  ): Promise<boolean> {
    try {
      const cache = await this.getUserPermissions(userId)

      return cache.permissions.some((perm) => {
        // 리소스와 액션이 일치하는지 확인
        if (perm.resource !== resource || perm.action !== action) {
          return false
        }

        // 범위 확인 (all > department > own)
        if (!scope || perm.scope === 'all') {
          return true
        }

        if (perm.scope === 'department' && (scope === 'department' || scope === 'own')) {
          return true
        }

        return perm.scope === scope
      })
    } catch (error) {
      console.error('Failed to check permission:', error)
      return false
    }
  }

  /**
   * 사용자가 특정 역할을 가지고 있는지 확인
   */
  async hasRole(userId: string, roleCode: RoleCode): Promise<boolean> {
    try {
      // 1. 시스템 계정 확인 - 시스템 계정은 모든 역할 보유
      const systemAccount = await DatabaseService.query(
        `SELECT id FROM system_accounts WHERE id = $1`,
        [userId],
      )

      if (systemAccount.rows.length > 0) {
        return true // 시스템 계정은 모든 역할 가짐
      }

      // 2. 직원 계정의 역할 확인
      const cache = await this.getUserPermissions(userId)
      return cache.roles.some((role) => role.code === roleCode)
    } catch (error) {
      console.error('Failed to check role:', error)
      return false
    }
  }

  /**
   * 직원에게 역할 할당
   */
  async assignRole(
    employeeId: string,
    roleCode: RoleCode,
    assignedBy: string,
    expiresAt?: Date,
  ): Promise<void> {
    try {
      // 역할 ID 조회
      const roleResult = await DatabaseService.query(
        `SELECT id FROM roles WHERE code = $1 AND is_active = true`,
        [roleCode],
      )

      if (roleResult.rows.length === 0) {
        throw new Error(`역할 ${roleCode}을 찾을 수 없습니다.`)
      }

      const roleId = roleResult.rows[0].id

      // assignedBy가 직원인지 시스템 계정인지 확인
      const employeeCheck = await DatabaseService.query(`SELECT id FROM employees WHERE id = $1`, [
        assignedBy,
      ])

      const assignedByEmployeeId = employeeCheck.rows.length > 0 ? assignedBy : null

      // 역할 할당
      await DatabaseService.query(
        `INSERT INTO employee_roles (employee_id, role_id, assigned_by_employee_id, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (employee_id, role_id) DO UPDATE
         SET assigned_by_employee_id = $3, assigned_at = NOW(), expires_at = $4, is_active = true`,
        [employeeId, roleId, assignedByEmployeeId, expiresAt],
      )

      // 감사 로그
      await this.logAudit(assignedBy, 'grant_role', employeeId, roleId, undefined, {
        roleCode,
        expiresAt,
      })

      // 캐시 무효화
      await DatabaseService.query(`DELETE FROM permission_cache WHERE employee_id = $1`, [
        employeeId,
      ])
    } catch (error) {
      console.error('Failed to assign role:', error)
      throw new Error('역할 할당에 실패했습니다.')
    }
  }

  /**
   * 직원에서 역할 제거
   */
  async revokeRole(employeeId: string, roleCode: RoleCode, revokedBy: string): Promise<void> {
    try {
      // 역할 ID 조회
      const roleResult = await DatabaseService.query(`SELECT id FROM roles WHERE code = $1`, [
        roleCode,
      ])

      if (roleResult.rows.length === 0) {
        throw new Error(`역할 ${roleCode}을 찾을 수 없습니다.`)
      }

      const roleId = roleResult.rows[0].id

      // 역할 비활성화
      await DatabaseService.query(
        `UPDATE employee_roles
         SET is_active = false
         WHERE employee_id = $1 AND role_id = $2`,
        [employeeId, roleId],
      )

      // 감사 로그
      await this.logAudit(revokedBy, 'revoke_role', employeeId, roleId, undefined, { roleCode })

      // 캐시 무효화
      await DatabaseService.query(`DELETE FROM permission_cache WHERE employee_id = $1`, [
        employeeId,
      ])
    } catch (error) {
      console.error('Failed to revoke role:', error)
      throw new Error('역할 제거에 실패했습니다.')
    }
  }

  /**
   * 사용자의 최고 권한 역할 가져오기
   */
  async getHighestRole(userId: string): Promise<Role | null> {
    try {
      const cache = await this.getUserPermissions(userId)
      if (cache.roles.length === 0) {
        return null
      }

      // priority가 가장 높은 역할 반환
      return cache.roles.reduce((highest, current) => {
        return current.priority > highest.priority ? current : highest
      })
    } catch (error) {
      console.error('Failed to get highest role:', error)
      return null
    }
  }

  /**
   * 리소스에 대한 접근 가능 여부 확인 (스코프 고려)
   */
  async canAccessResource(
    userId: string,
    resource: string,
    action: string,
    resourceOwnerId?: string,
    resourceDepartmentId?: string,
  ): Promise<boolean> {
    try {
      const cache = await this.getUserPermissions(userId)

      // 해당 리소스와 액션에 대한 권한 찾기
      const relevantPerms = cache.permissions.filter(
        (perm) => perm.resource === resource && perm.action === action,
      )

      if (relevantPerms.length === 0) {
        return false
      }

      // 권한 스코프 확인
      for (const perm of relevantPerms) {
        // all 스코프는 모든 접근 허용
        if (perm.scope === 'all') {
          return true
        }

        // own 스코프는 본인 리소스만
        if (perm.scope === 'own' && resourceOwnerId === userId) {
          return true
        }

        // department 스코프는 같은 부서만 (추후 구현)
        if (perm.scope === 'department' && resourceDepartmentId) {
          // TODO: 사용자의 부서 정보 확인 로직 추가
          // 현재는 임시로 true 반환
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Failed to check resource access:', error)
      return false
    }
  }

  /**
   * 권한 감사 로그 기록
   */
  private async logAudit(
    actorId: string,
    action: string,
    targetEmployeeId?: string,
    targetRoleId?: string,
    targetPermissionId?: string,
    details?: any,
  ): Promise<void> {
    try {
      // actorId가 시스템 계정인 경우 employee_id를 NULL로 설정
      const employeeCheck = await DatabaseService.query(`SELECT id FROM employees WHERE id = $1`, [
        actorId,
      ])
      const employeeId = employeeCheck.rows.length > 0 ? actorId : null

      await DatabaseService.query(
        `INSERT INTO permission_audit_log
         (employee_id, action, target_employee_id, target_role_id, target_permission_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          employeeId,
          action,
          targetEmployeeId,
          targetRoleId,
          targetPermissionId,
          JSON.stringify(details),
        ],
      )
    } catch (error) {
      console.error('Failed to log audit:', error)
      // 감사 로그 실패는 주 작업을 중단시키지 않음
    }
  }

  /**
   * 모든 역할 조회
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const result = await DatabaseService.query(
        `SELECT
           id,
           code,
           name,
           name_ko as "nameKo",
           description,
           priority,
           parent_role_id as "parentRoleId"
         FROM roles
         WHERE is_active = true
         ORDER BY priority DESC`,
      )

      return result.rows as Role[]
    } catch (error) {
      console.error('Failed to get all roles:', error)
      throw new Error('역할 목록을 가져올 수 없습니다.')
    }
  }

  /**
   * 역할별 권한 조회
   */
  async getRolePermissions(roleCode: RoleCode): Promise<Permission[]> {
    try {
      const result = await DatabaseService.query(
        `SELECT
           p.code,
           p.resource,
           p.action,
           p.scope
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         WHERE r.code = $1 AND r.is_active = true AND p.is_active = true
         ORDER BY p.resource, p.action`,
        [roleCode],
      )

      return result.rows as Permission[]
    } catch (error) {
      console.error('Failed to get role permissions:', error)
      throw new Error('역할 권한을 가져올 수 없습니다.')
    }
  }
}

// 싱글톤 인스턴스
export const permissionService = new PermissionService()
