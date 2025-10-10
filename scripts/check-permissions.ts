import { Pool } from 'pg'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false },
})

async function checkPermissions() {
  const client = await pool.connect()

  try {
    console.log('📊 권한 매트릭스 현황\n')

    // 1. 플래너 권한 확인
    const plannerPerms = await client.query(`
      SELECT code, resource, action 
      FROM permissions 
      WHERE resource LIKE 'planner.%'
      ORDER BY resource, action
    `)
    console.log(`✅ 플래너 권한: ${plannerPerms.rows.length}개`)
    if (plannerPerms.rows.length > 0) {
      plannerPerms.rows.slice(0, 3).forEach((row) => {
        console.log(`   - ${row.code}`)
      })
      if (plannerPerms.rows.length > 3) {
        console.log(`   ... 외 ${plannerPerms.rows.length - 3}개`)
      }
    }

    console.log('')

    // 2. 역할별 플래너 권한 확인
    const rolePermissions = await client.query(`
      SELECT 
        r.code as role_code,
        r.name_ko as role_name,
        COUNT(CASE WHEN p.resource LIKE 'planner.%' THEN 1 END) as planner_perms,
        COUNT(CASE WHEN p.resource LIKE 'project.%' THEN 1 END) as project_perms
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code IN ('ADMIN', 'MANAGEMENT', 'RESEARCHER', 'RESEARCH_DIRECTOR', 'EMPLOYEE')
      GROUP BY r.code, r.name_ko
      ORDER BY r.priority DESC
    `)

    console.log('📋 역할별 권한:')
    rolePermissions.rows.forEach((row) => {
      const plannerIcon = row.planner_perms > 0 ? '✓' : '✗'
      const projectIcon = row.project_perms > 0 ? '✓' : '✗'
      console.log(
        `   ${row.role_name.padEnd(12)} | 플래너: ${plannerIcon} (${row.planner_perms})  | 프로젝트: ${projectIcon} (${row.project_perms})`,
      )
    })

    console.log('')

    // 3. 연구원 상세 확인
    const researcherDetails = await client.query(`
      SELECT p.resource, p.action
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER'
        AND (p.resource LIKE 'planner.%' OR p.resource LIKE 'project.%')
      ORDER BY p.resource, p.action
    `)

    console.log('🔍 연구원 권한 상세:')
    const grouped = researcherDetails.rows.reduce(
      (acc, row) => {
        const category = row.resource.split('.')[0]
        if (!acc[category]) acc[category] = []
        acc[category].push(row.action)
        return acc
      },
      {} as Record<string, string[]>,
    )

    Object.entries(grouped).forEach(([category, actions]) => {
      console.log(`   ${category}: ${(actions as string[]).join(', ')}`)
    })

    console.log('\n✅ 확인 완료!')
  } catch (error) {
    console.error('❌ 오류:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkPermissions().catch(console.error)
