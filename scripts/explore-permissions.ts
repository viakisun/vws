import { Pool } from 'pg'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false },
})

async function exploreData() {
  const client = await pool.connect()

  try {
    console.log('🔍 데이터베이스 권한 데이터 탐색\n')
    console.log('='.repeat(80))

    // 1. 전체 역할 목록
    console.log('\n📌 1. 전체 역할 목록')
    console.log('-'.repeat(80))
    const roles = await client.query(`
      SELECT code, name_ko, priority, is_active
      FROM roles
      ORDER BY priority DESC
    `)
    console.log(`총 ${roles.rows.length}개 역할:\n`)
    roles.rows.forEach((row) => {
      const status = row.is_active ? '✓' : '✗'
      console.log(
        `  ${status} ${row.name_ko.padEnd(15)} (${row.code.padEnd(20)}) 우선순위: ${row.priority}`,
      )
    })

    // 2. 플래너 권한 상세
    console.log('\n📌 2. 플래너 관련 권한 (planner.*)')
    console.log('-'.repeat(80))
    const plannerPerms = await client.query(`
      SELECT code, resource, action, scope, description
      FROM permissions
      WHERE resource LIKE 'planner.%'
      ORDER BY resource, action
    `)
    console.log(`총 ${plannerPerms.rows.length}개 플래너 권한:\n`)

    const grouped = plannerPerms.rows.reduce(
      (acc, row) => {
        if (!acc[row.resource]) acc[row.resource] = []
        acc[row.resource].push({ action: row.action, scope: row.scope })
        return acc
      },
      {} as Record<string, Array<{ action: string; scope: string }>>,
    )

    Object.entries(grouped).forEach(
      ([resource, actions]: [string, Array<{ action: string; scope: string }>]) => {
        console.log(`  ${resource}:`)
        actions.forEach((a) => console.log(`    - ${a.action} (${a.scope})`))
      },
    )

    // 3. 프로젝트 권한 상세
    console.log('\n📌 3. 프로젝트 관련 권한 (project.*)')
    console.log('-'.repeat(80))
    const projectPerms = await client.query(`
      SELECT code, resource, action, scope
      FROM permissions
      WHERE resource LIKE 'project.%'
      ORDER BY resource, action
    `)
    console.log(`총 ${projectPerms.rows.length}개 프로젝트 권한:\n`)

    const projGrouped = projectPerms.rows.reduce(
      (acc, row) => {
        if (!acc[row.resource]) acc[row.resource] = []
        acc[row.resource].push({ action: row.action, scope: row.scope })
        return acc
      },
      {} as Record<string, Array<{ action: string; scope: string }>>,
    )

    Object.entries(projGrouped).forEach(
      ([resource, actions]: [string, Array<{ action: string; scope: string }>]) => {
        console.log(`  ${resource}:`)
        actions.forEach((a) => console.log(`    - ${a.action} (${a.scope})`))
      },
    )

    // 4. 역할별 권한 매트릭스
    console.log('\n📌 4. 역할별 권한 매트릭스')
    console.log('-'.repeat(80))
    const matrix = await client.query(`
      SELECT 
        r.code as role_code,
        r.name_ko as role_name,
        COUNT(DISTINCT CASE WHEN p.resource LIKE 'planner.%' THEN p.id END) as planner_count,
        COUNT(DISTINCT CASE WHEN p.resource LIKE 'project.%' THEN p.id END) as project_count,
        COUNT(DISTINCT CASE WHEN p.resource LIKE 'finance.%' THEN p.id END) as finance_count,
        COUNT(DISTINCT CASE WHEN p.resource LIKE 'hr.%' THEN p.id END) as hr_count,
        COUNT(DISTINCT CASE WHEN p.resource LIKE 'sales.%' THEN p.id END) as sales_count,
        COUNT(DISTINCT p.id) as total_count
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.is_active = true
      GROUP BY r.code, r.name_ko, r.priority
      ORDER BY r.priority DESC
    `)

    console.log('\n역할        | 플래너 | 프로젝트 | 재무 | 인사 | 영업 | 전체')
    console.log('-'.repeat(80))
    matrix.rows.forEach((row) => {
      const name = row.role_name.padEnd(12)
      const planner = String(row.planner_count).padStart(6)
      const project = String(row.project_count).padStart(8)
      const finance = String(row.finance_count).padStart(4)
      const hr = String(row.hr_count).padStart(4)
      const sales = String(row.sales_count).padStart(4)
      const total = String(row.total_count).padStart(4)
      console.log(`${name}| ${planner} | ${project} | ${finance} | ${hr} | ${sales} | ${total}`)
    })

    // 5. 연구원 상세 권한
    console.log('\n📌 5. 연구원(RESEARCHER) 상세 권한')
    console.log('-'.repeat(80))
    const researcher = await client.query(`
      SELECT p.resource, p.action, p.scope
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.code = 'RESEARCHER'
      ORDER BY p.resource, p.action
    `)

    console.log(`총 ${researcher.rows.length}개 권한:\n`)

    const resGrouped = researcher.rows.reduce(
      (acc, row) => {
        const [category] = row.resource.split('.')
        if (!acc[category]) acc[category] = []
        acc[category].push(`${row.action} (${row.scope})`)
        return acc
      },
      {} as Record<string, string[]>,
    )

    Object.entries(resGrouped).forEach(([category, perms]: [string, string[]]) => {
      console.log(`  ${category}:`)
      perms.forEach((p) => console.log(`    - ${p}`))
    })

    // 6. 권한 캐시 상태
    console.log('\n📌 6. 권한 캐시 상태')
    console.log('-'.repeat(80))
    const cache = await client.query(`
      SELECT COUNT(*) as count,
             MIN(calculated_at) as oldest,
             MAX(calculated_at) as newest
      FROM permission_cache
    `)
    console.log(`캐시된 사용자 수: ${cache.rows[0].count}`)
    if (cache.rows[0].count > 0) {
      console.log(`가장 오래된 캐시: ${cache.rows[0].oldest}`)
      console.log(`가장 최근 캐시: ${cache.rows[0].newest}`)
    }

    // 7. 최근 권한 감사 로그
    console.log('\n📌 7. 최근 권한 변경 이력 (최근 10건)')
    console.log('-'.repeat(80))
    const audit = await client.query(`
      SELECT 
        action,
        performed_at,
        details
      FROM permission_audit_log
      ORDER BY performed_at DESC
      LIMIT 10
    `)
    if (audit.rows.length > 0) {
      audit.rows.forEach((row) => {
        console.log(`  ${row.performed_at} - ${row.action}`)
        if (row.details) {
          console.log(`    ${JSON.stringify(row.details)}`)
        }
      })
    } else {
      console.log('  (감사 로그 없음)')
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ 데이터 탐색 완료!\n')
  } catch (error) {
    console.error('❌ 오류:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

exploreData().catch(console.error)
