import { Pool } from 'pg'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false },
})

async function removeResearcherPermissions() {
  const client = await pool.connect()

  try {
    console.log('\n🔍 연구원 권한 확인 중...\n')

    // 현재 연구원 권한 확인
    const current = await client.query(`
      SELECT 
        p.id,
        p.resource,
        p.action,
        p.description
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER'
      ORDER BY p.resource, p.action
    `)

    console.log(`현재 연구원 권한: ${current.rows.length}개\n`)
    
    // 급여관리와 프로젝트 관리 권한 찾기
    const salaryPerms = current.rows.filter(p => p.resource.startsWith('salary.'))
    const projectPerms = current.rows.filter(p => p.resource.startsWith('project.'))
    
    console.log('📋 급여관리 권한:')
    salaryPerms.forEach(p => console.log(`  - ${p.resource}.${p.action}: ${p.description}`))
    
    console.log('\n📋 프로젝트 관리 권한:')
    projectPerms.forEach(p => console.log(`  - ${p.resource}.${p.action}: ${p.description}`))

    // 삭제 확인
    const toRemove = [...salaryPerms, ...projectPerms]
    if (toRemove.length === 0) {
      console.log('\n✅ 삭제할 권한이 없습니다.')
      return
    }

    console.log(`\n🗑️  총 ${toRemove.length}개 권한 삭제 중...`)

    // 연구원 역할 ID 가져오기
    const roleResult = await client.query(
      "SELECT id FROM roles WHERE code = 'RESEARCHER'"
    )
    const researcherRoleId = roleResult.rows[0].id

    // 급여관리 권한 삭제
    if (salaryPerms.length > 0) {
      const salaryIds = salaryPerms.map(p => p.id)
      await client.query(
        `DELETE FROM role_permissions 
         WHERE role_id = $1 
         AND permission_id = ANY($2)`,
        [researcherRoleId, salaryIds]
      )
      console.log(`  ✅ 급여관리 권한 ${salaryPerms.length}개 삭제`)
    }

    // 프로젝트 관리 권한 삭제
    if (projectPerms.length > 0) {
      const projectIds = projectPerms.map(p => p.id)
      await client.query(
        `DELETE FROM role_permissions 
         WHERE role_id = $1 
         AND permission_id = ANY($2)`,
        [researcherRoleId, projectIds]
      )
      console.log(`  ✅ 프로젝트 관리 권한 ${projectPerms.length}개 삭제`)
    }

    // permission_cache 초기화
    await client.query('DELETE FROM permission_cache')
    console.log('  ✅ 권한 캐시 초기화')

    // 최종 결과 확인
    const final = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      WHERE r.code = 'RESEARCHER'
    `)

    console.log(`\n✅ 완료! 연구원 최종 권한: ${final.rows[0].count}개`)

    // 남은 권한 목록
    const remaining = await client.query(`
      SELECT p.resource, COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER'
      GROUP BY p.resource
      ORDER BY p.resource
    `)

    console.log('\n📋 남은 권한:')
    remaining.rows.forEach(r => {
      console.log(`  - ${r.resource}: ${r.count}개`)
    })

  } catch (error) {
    console.error('❌ 오류:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

removeResearcherPermissions()
