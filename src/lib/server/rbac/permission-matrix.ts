import { getConnection } from '$lib/database/connection'
import { getMatrixResources, getAllResourceKeys } from '$lib/config/resources'
import { PermissionAction, PermissionLevel } from '$lib/config/permissions'

export interface RolePermissionMatrix {
  resource: string
  resourceKo: string
  permissions: {
    [roleCode: string]: PermissionLevel
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

    // 2. resources.ts에서 권한 매트릭스에 표시할 리소스 가져오기
    const matrixResources = getMatrixResources()
    const allResourceKeys = getAllResourceKeys()

    // 3. 리소스별 권한 매핑 조회 (동적으로 모든 리소스 포함)
    const matrixResult = await client.query(
      `
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
        AND p.resource = ANY($1)
      ORDER BY p.resource, p.action, r.priority DESC
    `,
      [allResourceKeys],
    )

    // 4. 매트릭스용 리소스 데이터 구성
    // resources.ts에서 정의한 리소스를 기반으로 권한 집계
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

    // 5. 매트릭스 구성 - resources.ts에서 showInMatrix=true인 리소스만 사용
    const matrix: RolePermissionMatrix[] = []

    for (const resource of matrixResources) {
      // 해당 리소스와 하위 리소스들의 권한 집계
      const aggregatedActions = new Map<string, Set<string>>()

      // 부모 리소스 권한
      const parentRoleMap = resourceMap.get(resource.key)
      if (parentRoleMap) {
        for (const [roleCode, actions] of parentRoleMap.entries()) {
          if (!aggregatedActions.has(roleCode)) {
            aggregatedActions.set(roleCode, new Set())
          }
          actions.forEach((action) => aggregatedActions.get(roleCode)!.add(action))
        }
      }

      // 하위 리소스 권한 (예: finance → finance.accounts, finance.transactions)
      if (resource.children) {
        for (const child of resource.children) {
          const childRoleMap = resourceMap.get(child.key)
          if (childRoleMap) {
            for (const [roleCode, actions] of childRoleMap.entries()) {
              if (!aggregatedActions.has(roleCode)) {
                aggregatedActions.set(roleCode, new Set())
              }
              actions.forEach((action) => aggregatedActions.get(roleCode)!.add(action))
            }
          }
        }
      }

      // 역할별 권한 레벨 결정
      const permissions: Record<string, PermissionLevel> = {}

      for (const role of roles) {
        const actions = aggregatedActions.get(role.code) || new Set()

        // write/delete/approve 중 하나라도 있으면 full 권한
        if (
          actions.has(PermissionAction.WRITE) ||
          actions.has(PermissionAction.DELETE) ||
          actions.has(PermissionAction.APPROVE)
        ) {
          permissions[role.code.toLowerCase()] = PermissionLevel.FULL
        } else if (actions.has(PermissionAction.READ)) {
          permissions[role.code.toLowerCase()] = PermissionLevel.READ
        } else {
          permissions[role.code.toLowerCase()] = PermissionLevel.NONE
        }
      }

      matrix.push({
        resource: resource.key,
        resourceKo: resource.nameKo,
        permissions,
      })
    }

    return { roles, matrix }
  } finally {
    client.release()
  }
}
