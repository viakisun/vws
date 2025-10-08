import { Pool } from 'pg'
import { isNonWorkingDay, getWorkingDays } from '../src/lib/utils/holidays'

const pool = new Pool({
  host: 'db-viahub.cdgqkcss8mpj.ap-northeast-2.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'viahubdev',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
})

interface Employee {
  id: string
  first_name: string
  last_name: string
  hire_date: Date
}

/**
 * 랜덤 날짜 생성 (주말/공휴일 제외)
 */
function getRandomWorkingDate(year: number, month: number): Date | null {
  const daysInMonth = new Date(year, month, 0).getDate()
  const attempts = 50 // 최대 시도 횟수

  for (let i = 0; i < attempts; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1
    const date = new Date(year, month - 1, day)

    if (!isNonWorkingDay(date)) {
      return date
    }
  }

  return null
}

/**
 * 연속된 근무일 찾기
 */
function getConsecutiveWorkingDays(startDate: Date, days: number): Date | null {
  const current = new Date(startDate)
  let workingDaysCount = 0

  // 최대 30일까지만 검색
  for (let i = 0; i < 30; i++) {
    if (!isNonWorkingDay(current)) {
      workingDaysCount++
      if (workingDaysCount === days) {
        return new Date(current)
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return null
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 연차 더미 데이터 생성
 */
async function seedLeaveData() {
  try {
    console.log('📅 연차 더미 데이터 생성 시작...\n')

    // 1. 기존 연차 데이터 삭제
    await pool.query('DELETE FROM leave_requests')
    console.log('✓ 기존 연차 데이터 삭제 완료\n')

    // 2. 연차 타입 ID 가져오기
    const leaveTypeResult = await pool.query(`
      SELECT id FROM leave_types WHERE name = '연차' LIMIT 1
    `)
    const annualLeaveTypeId = leaveTypeResult.rows[0]?.id

    if (!annualLeaveTypeId) {
      throw new Error('연차 타입을 찾을 수 없습니다.')
    }
    console.log(`✓ 연차 타입 ID: ${annualLeaveTypeId}\n`)

    // 3. 직원 목록 가져오기
    const employeesResult = await pool.query<Employee>(`
      SELECT id, first_name, last_name, hire_date
      FROM employees
      WHERE status = 'active'
      ORDER BY hire_date
    `)

    const employees = employeesResult.rows
    console.log(`✓ ${employees.length}명의 직원 정보 로드 완료\n`)

    let totalCreated = 0

    // 3. 각 직원별로 연차 데이터 생성
    for (const employee of employees) {
      const fullName = `${employee.last_name}${employee.first_name}`
      console.log(`\n${fullName} (입사일: ${formatDate(new Date(employee.hire_date))})`)

      const leaveRequests: Array<{
        start_date: string
        end_date: string
        total_days: number
        reason: string
        status: string
      }> = []

      // 2024년 데이터 (승인됨)
      // 단기 연차 (1-3일) - 3~5건
      const shortLeaveCount2024 = Math.floor(Math.random() * 3) + 3
      for (let i = 0; i < shortLeaveCount2024; i++) {
        const month = Math.floor(Math.random() * 12) + 1
        const startDate = getRandomWorkingDate(2024, month)

        if (startDate) {
          const duration = Math.floor(Math.random() * 3) + 1 // 1-3일
          const endDate = getConsecutiveWorkingDays(startDate, duration)

          if (endDate) {
            const total_days = getWorkingDays(startDate, endDate)
            leaveRequests.push({
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
              total_days,
              reason: '개인 사유',
              status: 'approved',
            })
          }
        }
      }

      // 2025년 데이터
      // 단기 연차 (1-3일) - 2~4건
      const shortLeaveCount2025 = Math.floor(Math.random() * 3) + 2
      for (let i = 0; i < shortLeaveCount2025; i++) {
        const month = Math.floor(Math.random() * 9) + 1 // 1-9월
        const startDate = getRandomWorkingDate(2025, month)

        if (startDate && startDate <= new Date()) {
          const duration = Math.floor(Math.random() * 3) + 1
          const endDate = getConsecutiveWorkingDays(startDate, duration)

          if (endDate && endDate <= new Date()) {
            const total_days = getWorkingDays(startDate, endDate)
            leaveRequests.push({
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
              total_days,
              reason: '개인 사유',
              status: 'approved',
            })
          }
        }
      }

      // 장기 연차 (5-10일) - 1건 (여름휴가 or 연말)
      const hasLongLeave = Math.random() > 0.3 // 70% 확률
      if (hasLongLeave) {
        const isSummer = Math.random() > 0.5
        const month = isSummer ? (Math.random() > 0.5 ? 7 : 8) : 12 // 7월, 8월, 또는 12월
        const year = month === 12 ? 2024 : 2025

        const startDate = getRandomWorkingDate(year, month)
        if (startDate) {
          const duration = Math.floor(Math.random() * 6) + 5 // 5-10일
          const endDate = getConsecutiveWorkingDays(startDate, duration)

          if (endDate && (year === 2024 || endDate <= new Date())) {
            const total_days = getWorkingDays(startDate, endDate)
            leaveRequests.push({
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
              total_days,
              reason: isSummer ? '여름휴가' : '연말휴가',
              status: 'approved',
            })
          }
        }
      }

      // 미래 연차 (대기중/승인됨) - 0~2건
      const futureLeaveCount = Math.floor(Math.random() * 3)
      for (let i = 0; i < futureLeaveCount; i++) {
        const month = Math.floor(Math.random() * 3) + 10 // 10-12월
        const startDate = getRandomWorkingDate(2025, month)

        if (startDate && startDate > new Date()) {
          const duration = Math.floor(Math.random() * 3) + 1
          const endDate = getConsecutiveWorkingDays(startDate, duration)

          if (endDate) {
            const total_days = getWorkingDays(startDate, endDate)
            const status = Math.random() > 0.5 ? 'approved' : 'pending'
            leaveRequests.push({
              start_date: formatDate(startDate),
              end_date: formatDate(endDate),
              total_days,
              reason: '개인 사유',
              status,
            })
          }
        }
      }

      // DB에 삽입
      for (const leave of leaveRequests) {
        await pool.query(
          `
          INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `,
          [
            employee.id,
            annualLeaveTypeId,
            leave.start_date,
            leave.end_date,
            leave.total_days,
            leave.reason,
            leave.status,
          ],
        )
        totalCreated++
      }

      console.log(`  → ${leaveRequests.length}건의 연차 생성`)
    }

    console.log(`\n✅ 총 ${totalCreated}건의 연차 데이터 생성 완료!`)
  } catch (error) {
    console.error('❌ 에러 발생:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// 스크립트 실행
seedLeaveData()
