import { getConnection } from '$lib/database/connection'

export interface RolePermissionMatrix {
  resource: string
  resourceKo: string
  permissions: {
    [roleCode: string]: 'full' | 'read' | 'none'
  }
}

export interface RoleInfo {
  code: string
  nameKo: string
  priority: number
}

/**
 * 역할별 권한 매트릭스 데이터 조회
 */
export async function getPermissionMatrix(): Promise<{
  roles: RoleInfo[]
  matrix: RolePermissionMatrix[]
}> {
  const client = await getConnection()

  try {
    // 1. 활성 역할 조회 (우선순위 높은 순)
    const rolesResult = await client.query(`
      SELECT code, name_ko as "nameKo", priority
      FROM roles
      WHERE is_active = true
      ORDER BY priority DESC
    `)

    const roles: RoleInfo[] = rolesResult.rows

    // 2. 리소스별 권한 매핑 조회
    const matrixResult = await client.query(`
      SELECT 
        p.resource,
        p.action,
        r.code as role_code,
        CASE 
          WHEN rp.role_id IS NOT NULL THEN true
          ELSE false
        END as has_permission
      FROM permissions p
      CROSS JOIN roles r
      LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = r.id
      WHERE p.is_active = true 
        AND r.is_active = true
        AND p.resource IN (
          'common.dashboard',
          'finance.accounts',
          'finance.transactions',
          'finance.budgets',
          'hr.employees',
          'hr.payslips',
          'hr.attendance',
          'hr.leaves',
          'project.projects',
          'project.deliverables',
          'planner.products',
          'planner.initiatives',
          'planner.threads',
          'planner.formations',
          'planner.milestones',
          'sales.customers',
          'sales.contracts'
        )
      ORDER BY p.resource, p.action, r.priority DESC
    `)

    // 3. 리소스별로 그룹핑하여 매트릭스 구성
    const resourceMap = new Map<string, Map<string, Set<string>>>()

    for (const row of matrixResult.rows) {
      if (!resourceMap.has(row.resource)) {
        resourceMap.set(row.resource, new Map())
      }

      const roleMap = resourceMap.get(row.resource)!
      if (!roleMap.has(row.role_code)) {
        roleMap.set(row.role_code, new Set())
      }

      if (row.has_permission) {
        roleMap.get(row.role_code)!.add(row.action)
      }
    }

    // 4. 리소스별 집계하여 간소화된 매트릭스 생성
    const resourceGroupMap = new Map<string, Map<string, Set<string>>>()

    // 리소스 그룹별로 집계 (예: finance.*, hr.*, planner.*)
    for (const [resource, roleMap] of resourceMap.entries()) {
      const [category] = resource.split('.')
      const groupKey =
        category === 'common'
          ? 'common.dashboard'
          : category === 'finance'
            ? '재무 관리'
            : category === 'hr'
              ? '인사 관리'
              : category === 'project'
                ? '프로젝트 관리'
                : category === 'planner'
                  ? '플래너'
                  : category === 'sales'
                    ? '영업 관리'
                    : resource

      if (!resourceGroupMap.has(groupKey)) {
        resourceGroupMap.set(groupKey, new Map())
      }

      const groupRoleMap = resourceGroupMap.get(groupKey)!

      for (const [roleCode, actions] of roleMap.entries()) {
        if (!groupRoleMap.has(roleCode)) {
          groupRoleMap.set(roleCode, new Set())
        }
        actions.forEach((action) => groupRoleMap.get(roleCode)!.add(action))
      }
    }

    // 5. 매트릭스 구성
    const matrix: RolePermissionMatrix[] = []

    const displayResources = [
      { key: '재무 관리', name: '재무 관리' },
      { key: '인사 관리', name: '인사 관리' },
      { key: '프로젝트 관리', name: '프로젝트 관리' },
      { key: '플래너', name: '플래너' },
      { key: '영업 관리', name: '영업 관리' },
      { key: 'common.dashboard', name: '대시보드' },
    ]

    for (const { key, name } of displayResources) {
      const roleMap = resourceGroupMap.get(key)
      if (!roleMap) continue

      const permissions: Record<string, 'full' | 'read' | 'none'> = {}

      for (const role of roles) {
        const actions = roleMap.get(role.code) || new Set()

        if (actions.has('write') || actions.has('delete') || actions.has('approve')) {
          permissions[role.code.toLowerCase()] = 'full'
        } else if (actions.has('read')) {
          permissions[role.code.toLowerCase()] = 'read'
        } else {
          permissions[role.code.toLowerCase()] = 'none'
        }
      }

      matrix.push({
        resource: key,
        resourceKo: name,
        permissions,
      })
    }

    return { roles, matrix }
  } finally {
    client.release()
  }
}
