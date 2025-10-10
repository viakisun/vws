import { DatabaseService } from '../src/lib/database/connection'

async function checkAdminPermissions() {
  try {
    // 전체 권한 수
    const totalResult = await DatabaseService.query('SELECT COUNT(*) as total FROM permissions', [])
    console.log('\n📊 Total permissions in system:', totalResult.rows[0].total)

    // ADMIN 권한 수
    const adminResult = await DatabaseService.query(
      `SELECT COUNT(p.id) as count
       FROM roles r
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE r.role_name = 'ADMIN'`,
      [],
    )
    console.log('👑 ADMIN has:', adminResult.rows[0].count, 'permissions')

    // RESEARCHER 권한 수
    const researcherResult = await DatabaseService.query(
      `SELECT COUNT(p.id) as count
       FROM roles r
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE r.role_name = 'RESEARCHER'`,
      [],
    )
    console.log('🔬 RESEARCHER has:', researcherResult.rows[0].count, 'permissions')

    // Planner 권한 확인
    const plannerResult = await DatabaseService.query(
      `SELECT r.role_name, p.permission_name
       FROM roles r
       JOIN role_permissions rp ON r.id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE r.role_name IN ('ADMIN', 'RESEARCHER')
       AND p.permission_name LIKE 'planner%'
       ORDER BY r.role_name, p.permission_name`,
      [],
    )

    console.log('\n🎯 Planner permissions:')
    const byRole = plannerResult.rows.reduce(
      (acc, row) => {
        if (!acc[row.role_name]) acc[row.role_name] = []
        acc[row.role_name].push(row.permission_name)
        return acc
      },
      {} as Record<string, string[]>,
    )

    for (const [role, perms] of Object.entries(byRole) as [string, string[]][]) {
      console.log(`\n${role}: ${perms.length} planner permissions`)
      perms.forEach((p) => console.log(`  - ${p}`))
    }

    // 누락된 권한 확인 (ADMIN이 모든 권한을 가지고 있는지)
    const missingResult = await DatabaseService.query(
      `SELECT p.permission_name
       FROM permissions p
       WHERE p.id NOT IN (
         SELECT rp.permission_id
         FROM role_permissions rp
         JOIN roles r ON rp.role_id = r.id
         WHERE r.role_name = 'ADMIN'
       )
       ORDER BY p.permission_name`,
      [],
    )

    if (missingResult.rows.length > 0) {
      console.log('\n⚠️  ADMIN is missing these permissions:')
      missingResult.rows.forEach((row) => console.log(`  - ${row.permission_name}`))
    } else {
      console.log('\n✅ ADMIN has all permissions!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkAdminPermissions()
