import { query } from '../src/lib/database/connection'

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function generateLeaveRequestsDummy() {
  console.log('연차 사용 더미 데이터 생성 시작...\n')

  // 연차 타입들 조회
  const leaveTypesResult = await query(`
    SELECT id, name FROM leave_types
    WHERE name IN ('연차', '반차', '오전반반차', '오후반반차')
  `)

  const leaveTypes: Record<string, string> = {}
  for (const row of leaveTypesResult.rows) {
    leaveTypes[row.name] = row.id
  }

  // 모든 연차 잔액 조회
  const balancesResult = await query(`
    SELECT
      lb.id as balance_id,
      lb.employee_id,
      lb.year,
      lb.total_days,
      e.employee_id as emp_code,
      e.first_name,
      e.last_name
    FROM leave_balances lb
    JOIN employees e ON lb.employee_id = e.id
    WHERE lb.total_days > 0
    ORDER BY lb.year, e.employee_id
  `)

  console.log(`총 ${balancesResult.rows.length}개의 연차 잔액에 대해 더미 데이터 생성\n`)

  let totalRequests = 0

  for (const balance of balancesResult.rows) {
    const fullName = `${balance.last_name}${balance.first_name}`
    const targetDays = Math.floor(balance.total_days * 0.5) // 50% 사용

    if (targetDays === 0) {
      console.log(
        `${fullName} (${balance.emp_code}) - ${balance.year}년: 사용 안함 (총 ${balance.total_days}일)`,
      )
      continue
    }

    console.log(
      `${fullName} (${balance.emp_code}) - ${balance.year}년: ${targetDays}일 사용 (총 ${balance.total_days}일 중)`,
    )

    const startDate = new Date(balance.year, 0, 1)
    const endDate = balance.year === 2025 ? new Date(2025, 9, 8) : new Date(balance.year, 11, 31) // 2025년은 10월 8일까지

    let usedDays = 0
    const requests: Array<{
      type: string
      days: number
      startDate: Date
      endDate: Date
    }> = []

    while (usedDays < targetDays) {
      const remaining = targetDays - usedDays

      let leaveType: string
      let days: number

      // 랜덤하게 연차 타입 선택
      const rand = Math.random()
      if (remaining >= 1 && rand < 0.6) {
        // 60% 확률로 연차 (1일)
        leaveType = '연차'
        days = 1
      } else if (remaining >= 0.5 && rand < 0.85) {
        // 25% 확률로 반차 (0.5일)
        leaveType = '반차'
        days = 0.5
      } else if (remaining >= 0.25) {
        // 15% 확률로 반반차 (0.25일)
        leaveType = Math.random() < 0.5 ? '오전반반차' : '오후반반차'
        days = 0.25
      } else {
        break // 남은 일수가 부족하면 종료
      }

      const reqStartDate = getRandomDate(startDate, endDate)
      requests.push({
        type: leaveType,
        days,
        startDate: reqStartDate,
        endDate: new Date(reqStartDate), // 같은 날
      })

      usedDays += days
    }

    // 날짜순 정렬
    requests.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    // DB에 insert
    for (const req of requests) {
      await query(
        `INSERT INTO leave_requests
         (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'approved', NOW())`,
        [
          balance.employee_id,
          leaveTypes[req.type],
          req.startDate.toISOString(),
          req.endDate.toISOString(),
          req.days,
          `${req.type} 사용`,
        ],
      )
      totalRequests++
    }

    // leave_balances 업데이트
    await query(
      `UPDATE leave_balances
       SET used_days = $1, remaining_days = total_days - $1
       WHERE id = $2`,
      [usedDays, balance.balance_id],
    )

    console.log(`  → ${requests.length}건 생성, 총 ${usedDays}일 사용`)
  }

  console.log(`\n\n=== 완료 ===`)
  console.log(`총 ${totalRequests}개의 연차 신청 생성`)
}

// 실행
generateLeaveRequestsDummy()
  .then(() => {
    console.log('\n더미 데이터 생성 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('에러 발생:', error)
    process.exit(1)
  })
