// Node.js 내장 fetch 사용

const API_BASE = 'http://localhost:5173/api'

// 직급 매핑 테이블
const positionToJobTitleMap = {
  // 임원급
  CEO: 'CEO',
  CFO: 'CFO',
  CTO: 'CTO',
  대표이사: 'CEO',
  재무이사: 'CFO',
  기술이사: 'CTO',
  연구소장: 'CTO',
  상무: 'Managing Director',

  // 관리직
  이사: 'Director',
  부장: 'Senior Manager',
  과장: 'Manager',
  팀장: 'Team Lead',
  'Team Lead': 'Team Lead',

  // 일반직
  선임연구원: 'Senior Manager',
  책임연구원: 'Manager',
  주임연구원: 'Manager',
  연구원: 'Manager',
  선임디자이너: 'Manager',
  디자이너: 'Manager',
  행정원: 'Manager',
  주임: 'Manager',
  대리: 'Manager',
  사원: 'Manager',

  // 특수직
  전략기획실: 'Manager',
  인사담당: 'Manager',
  경영지원담당: 'Manager',
  회계담당: 'Manager',
  총무담당: 'Manager',
  회계팀장: 'Team Lead',
  총무팀장: 'Team Lead',
  인사팀장: 'Team Lead',
  경영지원팀장: 'Team Lead',
  대표: 'CEO'
}

async function getJobTitles() {
  try {
    const response = await fetch(`${API_BASE}/job-titles`)
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching job titles:', error)
    return []
  }
}

async function getEmployees() {
  try {
    const response = await fetch(`${API_BASE}/employees?status=all`)
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

async function updateEmployeeJobTitle(employee, jobTitleId) {
  try {
    const response = await fetch(`${API_BASE}/employees`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: employee.id,
        job_title_id: jobTitleId,
        // 기존 데이터 유지
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        salary: employee.salary || 0,
        phone: employee.phone || '',
        hire_date: employee.hire_date,
        birth_date: employee.birth_date,
        termination_date: employee.termination_date,
        status: employee.status,
        employment_type: employee.employment_type || 'full-time'
      })
    })

    const result = await response.json()
    if (!result.success) {
      console.log(`❌ API 오류: ${result.error}`)
    }
    return result.success
  } catch (error) {
    console.error('Error updating employee:', error)
    return false
  }
}

async function main() {
  console.log('🔄 직원 직급 정보 업데이트 시작...')

  const jobTitles = await getJobTitles()
  const employees = await getEmployees()

  if (jobTitles.length === 0) {
    console.error('❌ 직급 데이터를 가져올 수 없습니다.')
    return
  }

  if (employees.length === 0) {
    console.error('❌ 직원 데이터를 가져올 수 없습니다.')
    return
  }

  console.log(`📊 총 ${employees.length}명의 직원, ${jobTitles.length}개의 직급 발견`)

  // 직급 이름으로 ID 매핑
  const jobTitleMap = {}
  jobTitles.forEach(jt => {
    jobTitleMap[jt.name] = jt.id
  })

  let updatedCount = 0
  let skippedCount = 0

  for (const employee of employees) {
    const position = employee.position
    const jobTitleName = positionToJobTitleMap[position]

    if (!jobTitleName) {
      console.log(
        `⚠️  매핑되지 않은 직급: ${employee.first_name} ${employee.last_name} - ${position}`
      )
      skippedCount++
      continue
    }

    const jobTitleId = jobTitleMap[jobTitleName]
    if (!jobTitleId) {
      console.log(`⚠️  직급 ID를 찾을 수 없음: ${jobTitleName}`)
      skippedCount++
      continue
    }

    // 이미 올바른 직급이 설정되어 있는지 확인
    if (employee.job_title_id === jobTitleId) {
      console.log(
        `✅ 이미 올바른 직급: ${employee.first_name} ${employee.last_name} - ${position} → ${jobTitleName}`
      )
      continue
    }

    console.log(
      `🔄 업데이트 중: ${employee.first_name} ${employee.last_name} - ${position} → ${jobTitleName}`
    )

    const success = await updateEmployeeJobTitle(employee, jobTitleId)
    if (success) {
      updatedCount++
      console.log(`✅ 성공: ${employee.first_name} ${employee.last_name}`)
    } else {
      console.log(`❌ 실패: ${employee.first_name} ${employee.last_name}`)
    }

    // API 호출 간격 조절
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n📈 업데이트 완료!')
  console.log(`✅ 업데이트된 직원: ${updatedCount}명`)
  console.log(`⚠️  건너뛴 직원: ${skippedCount}명`)
  console.log(`📊 총 처리된 직원: ${updatedCount + skippedCount}명`)
}

main().catch(console.error)
