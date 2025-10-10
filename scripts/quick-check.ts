import { Pool } from 'pg'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false },
})

async function quickCheck() {
  const client = await pool.connect()

  try {
    console.log('\n🔍 빠른 권한 확인\n')

    // 플래너 권한 개수
    const plannerCount = await client.query(
      "SELECT COUNT(*) as count FROM permissions WHERE resource LIKE 'planner.%'",
    )
    console.log(`✅ 플래너 권한: ${plannerCount.rows[0].count}개`)

    // 연구원 플래너 권한
    const researcherPlanner = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER' AND p.resource LIKE 'planner.%'
    `)
    console.log(`✅ 연구원 플래너 권한: ${researcherPlanner.rows[0].count}개`)

    // 연구원 프로젝트 권한
    const researcherProject = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER' AND p.resource LIKE 'project.%'
    `)
    console.log(`✅ 연구원 프로젝트 권한: ${researcherProject.rows[0].count}개`)

    // 역할 목록
    const roles = await client.query(`
      SELECT code, name_ko, priority 
      FROM roles 
      WHERE is_active = true
      ORDER BY priority DESC
    `)
    console.log(`\n📋 활성 역할: ${roles.rows.length}개`)
    roles.rows.forEach((r) => {
      console.log(`   - ${r.name_ko} (${r.code}) - 우선순위 ${r.priority}`)
    })

    console.log('\n✅ 확인 완료!\n')
  } catch (error: any) {
    console.error('❌ 오류:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

quickCheck().catch(console.error)
