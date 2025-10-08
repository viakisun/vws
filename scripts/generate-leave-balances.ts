import { query } from '../src/lib/database/connection'

/**
 * 한국 근로기준법 기반 연차 계산
 * - 신입사원: 입사 후 1개월당 1개 (최대 11개, 1년 미만)
 * - 1년 이상: 15개
 * - 3년 이상: 15개 + (근속년수-1)/2 (최대 25개)
 */
function calculateAnnualLeave(hireDate: Date, targetYear: number): number {
  const yearStart = new Date(targetYear, 0, 1)
  const yearEnd = new Date(targetYear, 11, 31)

  // 입사일이 대상 연도보다 미래면 0
  if (hireDate > yearEnd) {
    return 0
  }

  // 근속 개월 수 계산 (해당 연도 말 기준)
  const monthsWorked =
    (yearEnd.getFullYear() - hireDate.getFullYear()) * 12 +
    (yearEnd.getMonth() - hireDate.getMonth()) +
    1

  // 1년 미만: 1개월당 1개
  if (monthsWorked < 12) {
    return Math.min(monthsWorked, 11)
  }

  // 근속 연수 계산
  const yearsWorked = monthsWorked / 12

  // 1년 이상 ~ 3년 미만: 15개
  if (yearsWorked < 3) {
    return 15
  }

  // 3년 이상: 15 + (근속년수-1)/2, 최대 25개
  const additionalDays = Math.floor((yearsWorked - 1) / 2)
  return Math.min(15 + additionalDays, 25)
}

async function generateLeaveBalances() {
  console.log('연차 생성 시작...\n')

  // 연차 타입 ID 조회
  const leaveTypeResult = await query(`SELECT id FROM leave_types WHERE name = '연차'`)
  if (leaveTypeResult.rows.length === 0) {
    console.error('연차 타입을 찾을 수 없습니다.')
    return
  }
  const annualLeaveTypeId = leaveTypeResult.rows[0].id

  // 모든 재직 중인 직원 조회
  const employeesResult = await query(`
    SELECT
      e.id,
      e.employee_id,
      e.first_name,
      e.last_name,
      sc.start_date as hire_date
    FROM employees e
    JOIN salary_contracts sc ON e.id = sc.employee_id
    WHERE e.status = 'active' AND sc.status = 'active'
    ORDER BY sc.start_date
  `)

  console.log(`총 ${employeesResult.rows.length}명의 직원 연차 생성\n`)

  const targetYears = [2024, 2025]
  let totalCreated = 0

  for (const employee of employeesResult.rows) {
    const hireDate = new Date(employee.hire_date)
    const fullName = `${employee.last_name}${employee.first_name}`

    console.log(`\n직원: ${fullName} (${employee.employee_id})`)
    console.log(`입사일: ${hireDate.toISOString().split('T')[0]}`)

    for (const year of targetYears) {
      const totalDays = calculateAnnualLeave(hireDate, year)

      if (totalDays === 0) {
        console.log(`  ${year}년: 연차 없음 (입사 전)`)
        continue
      }

      // 기존 데이터 확인
      const existingResult = await query(
        `SELECT id FROM leave_balances
         WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
        [employee.id, annualLeaveTypeId, year],
      )

      if (existingResult.rows.length > 0) {
        console.log(`  ${year}년: 이미 존재 (${totalDays}일)`)
        continue
      }

      // 연차 생성
      await query(
        `INSERT INTO leave_balances
         (employee_id, leave_type_id, year, total_days, used_days, remaining_days)
         VALUES ($1, $2, $3, $4, 0, $4)`,
        [employee.id, annualLeaveTypeId, year, totalDays],
      )

      console.log(`  ${year}년: ${totalDays}일 생성 ✓`)
      totalCreated++
    }
  }

  console.log(`\n\n=== 완료 ===`)
  console.log(`총 ${totalCreated}개의 연차 잔액 생성`)
}

// 실행
generateLeaveBalances()
  .then(() => {
    console.log('\n연차 생성 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('에러 발생:', error)
    process.exit(1)
  })
