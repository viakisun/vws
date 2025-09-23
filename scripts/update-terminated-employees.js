// Node.js 내장 fetch 사용

const API_BASE = 'http://localhost:5173/api'

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

async function updateTerminatedEmployee(employee, jobTitleId) {
  try {
    const response = await fetch(`${API_BASE}/employees`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: employee.id,
        department: '부서없음',
        job_title_id: jobTitleId,
        // 기존 데이터 유지
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
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
  console.log('🔄 퇴사한 직원 정보 정리 시작...')

  const employees = await getEmployees()
  const jobTitles = await getJobTitles()

  if (employees.length === 0) {
    console.error('❌ 직원 데이터를 가져올 수 없습니다.')
    return
  }

  if (jobTitles.length === 0) {
    console.error('❌ 직급 데이터를 가져올 수 없습니다.')
    return
  }

  // 퇴사한 직원들 필터링
  const terminatedEmployees = employees.filter(emp => emp.status === 'terminated')

  console.log(`📊 총 ${employees.length}명의 직원 중 퇴사한 직원: ${terminatedEmployees.length}명`)

  if (terminatedEmployees.length === 0) {
    console.log('✅ 퇴사한 직원이 없습니다.')
    return
  }

  // "연구원" 직급 ID 찾기
  const researcherJobTitle = jobTitles.find(jt => jt.name === 'Manager') // Manager가 연구원에 해당
  if (!researcherJobTitle) {
    console.error('❌ 연구원 직급을 찾을 수 없습니다.')
    return
  }

  console.log(`📋 연구원 직급 ID: ${researcherJobTitle.id} (${researcherJobTitle.name})`)

  let updatedCount = 0
  let skippedCount = 0

  for (const employee of terminatedEmployees) {
    console.log(
      `🔄 업데이트 중: ${employee.first_name} ${employee.last_name} - 부서: ${employee.department} → 부서없음, 직급: ${employee.job_title_name || 'null'} → 연구원`
    )

    const success = await updateTerminatedEmployee(employee, researcherJobTitle.id)
    if (success) {
      updatedCount++
      console.log(`✅ 성공: ${employee.first_name} ${employee.last_name}`)
    } else {
      console.log(`❌ 실패: ${employee.first_name} ${employee.last_name}`)
      skippedCount++
    }

    // API 호출 간격 조절
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n📈 업데이트 완료!')
  console.log(`✅ 업데이트된 직원: ${updatedCount}명`)
  console.log(`⚠️  실패한 직원: ${skippedCount}명`)
  console.log(`📊 총 처리된 직원: ${updatedCount + skippedCount}명`)
}

main().catch(console.error)
