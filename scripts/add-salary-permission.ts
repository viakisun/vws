import { Pool } from 'pg'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false },
})

async function addSalaryPermission() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    console.log('🔧 salary.management 권한 추가 중...\n')

    // 1. 권한 추가
    await client.query(`
      INSERT INTO permissions (code, resource, action, description, scope)
      SELECT 'salary.management.read', 'salary.management', 'read', '급여 관리 시스템 접근', 'all'
      WHERE NOT EXISTS (
        SELECT 1 FROM permissions 
        WHERE resource = 'salary.management' AND action = 'read'
      )
    `)
    console.log('✅ salary.management 권한 생성')

    // 2. ADMIN 권한 부여
    const adminResult = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'ADMIN'
        AND p.resource = 'salary.management'
        AND p.action = 'read'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp2
          WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
        )
      RETURNING *
    `)
    console.log(`✅ ADMIN에게 부여 (${adminResult.rowCount}건)`)

    // 3. HR_MANAGER 권한 부여
    const hrResult = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'HR_MANAGER'
        AND p.resource = 'salary.management'
        AND p.action = 'read'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp2
          WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
        )
      RETURNING *
    `)
    console.log(`✅ HR_MANAGER에게 부여 (${hrResult.rowCount}건)`)

    // 4. MANAGEMENT 권한 부여
    const mgmtResult = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'MANAGEMENT'
        AND p.resource = 'salary.management'
        AND p.action = 'read'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp2
          WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
        )
      RETURNING *
    `)
    console.log(`✅ MANAGEMENT에게 부여 (${mgmtResult.rowCount}건)`)

    // 5. 캐시 초기화
    await client.query('DELETE FROM permission_cache')
    console.log('✅ 권한 캐시 초기화\n')

    // 6. 결과 확인
    const result = await client.query(`
      SELECT 
        r.name_ko as role,
        COUNT(CASE WHEN p.resource = 'salary.management' THEN 1 END) as salary_mgmt,
        COUNT(CASE WHEN p.resource = 'hr.payslips' THEN 1 END) as payslips
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code IN ('ADMIN', 'HR_MANAGER', 'MANAGEMENT', 'RESEARCHER')
      GROUP BY r.code, r.name_ko, r.priority
      ORDER BY r.priority DESC
    `)

    console.log('📊 역할별 권한 현황:')
    console.log('─'.repeat(60))
    console.log('역할\t\t\tsalary.management\thr.payslips')
    console.log('─'.repeat(60))
    result.rows.forEach((row) => {
      console.log(`${row.role}\t\t${row.salary_mgmt}\t\t\t${row.payslips}`)
    })
    console.log('─'.repeat(60))

    await client.query('COMMIT')
    console.log('\n✅ 완료!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ 오류:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

addSalaryPermission()
