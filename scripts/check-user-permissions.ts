import { Pool } from 'pg'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'viahubdev',
  ssl: { rejectUnauthorized: false },
})

async function checkUserPermissions(email: string) {
  const client = await pool.connect()

  try {
    console.log(`\n🔍 ${email} 계정 권한 확인\n`)

    // 1. 직원 정보
    const employee = await client.query(
      `SELECT id, employee_id, first_name, last_name, email, department, position 
       FROM employees WHERE email = $1`,
      [email],
    )

    if (employee.rows.length === 0) {
      console.log('❌ 직원을 찾을 수 없습니다.')
      return
    }

    const emp = employee.rows[0]
    console.log('👤 직원 정보:')
    console.log(`   ID: ${emp.id}`)
    console.log(`   사번: ${emp.employee_id}`)
    console.log(`   이름: ${emp.first_name} ${emp.last_name}`)
    console.log(`   부서: ${emp.department}`)
    console.log(`   직급: ${emp.position}\n`)

    // 2. 역할 정보
    const roles = await client.query(
      `SELECT r.code, r.name_ko, r.priority
       FROM employee_roles er
       JOIN roles r ON r.id = er.role_id
       WHERE er.employee_id = $1 AND er.is_active = true
       ORDER BY r.priority DESC`,
      [emp.id],
    )

    console.log('👥 역할:')
    roles.rows.forEach((r) => {
      console.log(`   - ${r.name_ko} (${r.code}) [우선순위: ${r.priority}]`)
    })
    console.log()

    // 3. 권한 정보
    const permissions = await client.query(
      `SELECT DISTINCT p.resource, p.action, p.description
       FROM employee_roles er
       JOIN role_permissions rp ON rp.role_id = er.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE er.employee_id = $1 AND er.is_active = true
       ORDER BY p.resource, p.action`,
      [emp.id],
    )

    console.log(`🔐 권한 (총 ${permissions.rows.length}개):`)

    // 권한을 리소스별로 그룹화
    const grouped: Record<string, any[]> = {}
    permissions.rows.forEach((p) => {
      if (!grouped[p.resource]) {
        grouped[p.resource] = []
      }
      grouped[p.resource].push(p)
    })

    Object.keys(grouped)
      .sort()
      .forEach((resource) => {
        console.log(`\n   📦 ${resource}:`)
        grouped[resource].forEach((p) => {
          console.log(`      - ${p.action}: ${p.description}`)
        })
      })

    // 4. 급여관리/프로젝트 관리 권한 체크
    console.log('\n\n📊 주요 권한 체크:')
    const hasSalaryPerm = permissions.rows.some(
      (p) => p.resource === 'hr.payslips' && p.action === 'read',
    )
    console.log(`   급여관리 (hr.payslips.read): ${hasSalaryPerm ? '✅ 있음' : '❌ 없음'}`)

    const hasProjectPerm = permissions.rows.some(
      (p) => p.resource === 'project.projects' && p.action === 'read',
    )
    console.log(
      `   프로젝트 관리 (project.projects.read): ${hasProjectPerm ? '✅ 있음' : '❌ 없음'}`,
    )

    const hasPlannerPerm = permissions.rows.some((p) => p.resource.startsWith('planner.'))
    console.log(`   플래너 (planner.*): ${hasPlannerPerm ? '✅ 있음' : '❌ 없음'}`)

    // 5. 캐시 확인
    console.log('\n\n💾 권한 캐시 확인:')
    const cache = await client.query(
      `SELECT user_id, cached_at, expires_at, permissions_data
       FROM permission_cache
       WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
      [email],
    )

    if (cache.rows.length > 0) {
      const c = cache.rows[0]
      console.log(`   캐시 존재: ✅`)
      console.log(`   생성 시간: ${c.cached_at}`)
      console.log(`   만료 시간: ${c.expires_at}`)
      console.log(`   권한 수: ${c.permissions_data?.permissions?.length || 0}개`)
    } else {
      console.log(`   캐시 없음: ❌ (새로 로드됨)`)
    }
  } catch (error) {
    console.error('❌ 오류:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// 실행
const email = process.argv[2] || 'researcher@example.com'
checkUserPermissions(email)
