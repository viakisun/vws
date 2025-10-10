import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getPermissionMatrix } from '$lib/server/rbac/permission-matrix'
import { getConnection } from '$lib/database/connection'

export const GET: RequestHandler = async () => {
  try {
    const data = await getPermissionMatrix()
    return json(data)
  } catch (error) {
    console.error('Failed to fetch permission matrix:', error)
    return json({ error: 'Failed to fetch permission matrix' }, { status: 500 })
  }
}

/**
 * 권한 매트릭스 업데이트
 * 체크박스 클릭 시 호출
 */
export const PUT: RequestHandler = async ({ request }) => {
  const client = await getConnection()

  try {
    const { roleCode, resource, level } = await request.json()

    // 유효성 검사
    if (!roleCode || !resource || !level) {
      return json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['full', 'read', 'none'].includes(level)) {
      return json({ error: 'Invalid permission level' }, { status: 400 })
    }

    await client.query('BEGIN')

    // 1. 역할 ID 조회
    const roleResult = await client.query('SELECT id FROM roles WHERE code = $1', [roleCode])
    if (roleResult.rows.length === 0) {
      throw new Error('Role not found')
    }
    const roleId = roleResult.rows[0].id

    // 2. 해당 리소스와 모든 하위 리소스의 권한 조회
    // 예: 'finance' → 'finance', 'finance.accounts', 'finance.transactions'
    const permissionsResult = await client.query(
      `SELECT id, resource, action 
       FROM permissions 
       WHERE resource = $1 OR resource LIKE $2`,
      [resource, `${resource}.%`],
    )

    if (permissionsResult.rows.length === 0) {
      throw new Error('Resource not found')
    }

    // 3. 기존 권한 매핑 삭제 (부모 + 모든 하위)
    await client.query(
      `
      DELETE FROM role_permissions 
      WHERE role_id = $1 
        AND permission_id IN (
          SELECT id FROM permissions 
          WHERE resource = $2 OR resource LIKE $3
        )
    `,
      [roleId, resource, `${resource}.%`],
    )

    // 4. 새 권한 추가 (부모 + 모든 하위 리소스)
    if (level === 'read') {
      // read 권한만 부여 (부모 + 하위 모두)
      const readPermissions = permissionsResult.rows.filter((p) => p.action === 'read')
      for (const perm of readPermissions) {
        await client.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [roleId, perm.id],
        )
      }
    } else if (level === 'full') {
      // 모든 권한 부여 (read, write, delete, approve) - 부모 + 하위 모두
      for (const perm of permissionsResult.rows) {
        await client.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [roleId, perm.id],
        )
      }
    }
    // level === 'none'인 경우는 이미 삭제했으므로 추가 작업 없음

    // 5. 권한 캐시 무효화
    await client.query('DELETE FROM permission_cache')

    await client.query('COMMIT')

    return json({ success: true })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Failed to update permission:', error)
    return json(
      { error: error instanceof Error ? error.message : 'Failed to update permission' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
