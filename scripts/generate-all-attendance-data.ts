import pkg from 'pg'
const { Pool } = pkg

// 데이터베이스 연결
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

// 공휴일 데이터 (인라인)
const holidaySet = new Set([
  // 2024년
  '2024-01-01',
  '2024-02-09',
  '2024-02-10',
  '2024-02-11',
  '2024-02-12',
  '2024-03-01',
  '2024-04-10',
  '2024-05-05',
  '2024-05-06',
  '2024-05-15',
  '2024-06-06',
  '2024-08-15',
  '2024-09-16',
  '2024-09-17',
  '2024-09-18',
  '2024-10-03',
  '2024-10-09',
  '2024-12-25',
  // 2025년
  '2025-01-01',
  '2025-01-28',
  '2025-01-29',
  '2025-01-30',
  '2025-03-01',
  '2025-03-03',
  '2025-05-05',
  '2025-05-06',
  '2025-06-06',
  '2025-08-15',
  '2025-10-03',
  '2025-10-05',
  '2025-10-06',
  '2025-10-07',
  '2025-10-08',
  '2025-10-09',
  '2025-12-25',
  // 2026년
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-03-01',
  '2026-05-05',
  '2026-05-24',
  '2026-05-25',
  '2026-06-06',
  '2026-08-15',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-10-03',
  '2026-10-05',
  '2026-10-09',
  '2026-12-25',
])

function isHoliday(dateStr: string): boolean {
  return holidaySet.has(dateStr)
}

// 휴일 체크 (주말 + 공휴일)
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function isHolidayOrWeekend(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return isWeekend(date) || isHoliday(dateStr)
}

// 랜덤 시간 생성
function randomTime(
  baseDateStr: string,
  baseHour: number,
  baseMinute: number,
  variance: number,
): Date {
  const totalMinutes = baseHour * 60 + baseMinute + (Math.random() * variance * 2 - variance)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)

  // YYYY-MM-DD HH:mm:ss 형식으로 생성
  const timeStr = `${baseDateStr} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
  return new Date(timeStr)
}

// 출퇴근 상태 결정
function getAttendanceStatus(checkInTime: Date, workStart: Date, lateThreshold: number): string {
  const diffMinutes = (checkInTime.getTime() - workStart.getTime()) / (1000 * 60)
  if (diffMinutes > lateThreshold) {
    return 'late'
  }
  return 'present'
}

// 근무 시간 계산 (점심시간 1시간 제외)
function calculateWorkHours(checkIn: Date, checkOut: Date): { total: number; overtime: number } {
  const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
  // 점심시간 1시간 제외
  const workHours = totalHours - 1
  // 기본 근무시간 8시간
  const total = workHours
  const overtime = Math.max(workHours - 8, 0)
  return { total, overtime }
}

async function generateAllAttendanceData() {
  try {
    // 회사 근무시간 설정 업데이트
    await pool.query(`
      UPDATE attendance_settings
      SET work_start_time = '10:00:00',
          work_end_time = '19:00:00',
          late_threshold_minutes = 10,
          early_leave_threshold_minutes = 10
    `)
    console.log('회사 근무시간 설정 완료: 10:00 - 19:00\n')

    // 모든 직원 조회 (계약 정보 포함)
    const employeesResult = await pool.query(`
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        sc.start_date,
        sc.end_date
      FROM employees e
      LEFT JOIN salary_contracts sc ON e.id = sc.employee_id
      WHERE e.status = 'active'
        AND sc.start_date IS NOT NULL
      ORDER BY e.last_name, e.first_name
    `)

    console.log(`총 ${employeesResult.rows.length}명의 직원 출퇴근 기록 생성 시작...\n`)

    let totalInserted = 0

    for (const employee of employeesResult.rows) {
      const { id, first_name, last_name, start_date, end_date } = employee
      const name = `${last_name}${first_name}`

      // 계약 시작일부터 종료일 또는 오늘까지
      const startDate = new Date(start_date)
      const endDate = end_date ? new Date(end_date) : new Date()

      // 미래 날짜는 오늘까지만
      const today = new Date()
      const finalEndDate = endDate > today ? today : endDate

      let employeeWorkDays = 0
      let employeeLateDays = 0
      let employeeOvertimeDays = 0

      for (let date = new Date(startDate); date <= finalEndDate; date.setDate(date.getDate() + 1)) {
        // 현재 날짜의 복사본 생성 (루프 증가 표현식이 원본을 변경하기 전)
        const currentDate = new Date(date)
        const dateStr = currentDate.toISOString().split('T')[0]

        // UTC 기준 Date 객체 생성 (타임존 문제 해결)
        const utcDate = new Date(dateStr + 'T00:00:00Z')

        // 주말 및 공휴일 제외
        const dayOfWeek = utcDate.getUTCDay()
        const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
        const isHolidayDay = isHoliday(dateStr)

        if (isWeekendDay || isHolidayDay) {
          continue
        }

        // 랜덤하게 결근 처리 (5% 확률)
        if (Math.random() < 0.05) {
          continue
        }

        employeeWorkDays++

        // 지각 여부 결정 (10% 확률)
        const willBeLate = Math.random() < 0.1

        // 출근 시간: 정상(9:40~9:59) 또는 지각(10:15~10:50)
        const checkInTime = willBeLate
          ? randomTime(dateStr, 10, 30, 20)
          : randomTime(dateStr, 9, 50, 10)

        // 퇴근 시간: 무조건 19시(오후 7시) 이후
        let checkOutHour = 19
        let checkOutMinute = 0
        const random = Math.random()

        if (random < 0.3) {
          // 30% 확률로 야근 (21~23시)
          checkOutHour = 21 + Math.floor(Math.random() * 3)
          employeeOvertimeDays++
        } else {
          // 70% 확률로 일반 퇴근 (19:00~20:00)
          checkOutHour = 19
          checkOutMinute = Math.floor(Math.random() * 60) // 0~59분
        }

        // 퇴근 시간 생성 (야근인 경우만 편차 적용)
        const checkOutTime =
          checkOutHour >= 21
            ? randomTime(dateStr, checkOutHour, 0, 30)
            : (() => {
                const timeStr = `${dateStr} ${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}:00`
                return new Date(timeStr)
              })()

        // 출퇴근 상태 결정
        const status = willBeLate ? 'late' : 'present'

        if (willBeLate) {
          employeeLateDays++
        }

        // 근무 시간 계산
        const { total, overtime } = calculateWorkHours(checkInTime, checkOutTime)

        // 데이터 삽입
        try {
          await pool.query(
            `
            INSERT INTO attendance (
              employee_id,
              date,
              check_in_time,
              check_out_time,
              total_work_hours,
              overtime_hours,
              status,
              check_in_ip,
              check_out_ip
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (employee_id, date) DO NOTHING
          `,
            [
              id,
              dateStr,
              checkInTime,
              checkOutTime,
              total.toFixed(2),
              overtime.toFixed(2),
              status,
              '127.0.0.1',
              '127.0.0.1',
            ],
          )
          totalInserted++
        } catch (err) {
          console.error(`Error inserting data for ${name} on ${dateStr}:`, err)
        }
      }

      console.log(
        `✓ ${name}: ${employeeWorkDays}일 (지각: ${employeeLateDays}, 야근: ${employeeOvertimeDays})`,
      )
    }

    console.log(`\n=== 데이터 생성 완료 ===`)
    console.log(`총 ${employeesResult.rows.length}명의 직원`)
    console.log(`총 ${totalInserted}건의 출퇴근 기록 생성`)

    // 통계 확인
    const statsResult = await pool.query(`
      SELECT
        COUNT(DISTINCT employee_id) as total_employees,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN overtime_hours > 0 THEN 1 END) as overtime_count,
        ROUND(AVG(total_work_hours), 2) as avg_work_hours
      FROM attendance
    `)

    const stats = statsResult.rows[0]
    console.log(`\n=== 통계 ===`)
    console.log(`직원 수: ${stats.total_employees}명`)
    console.log(`총 출퇴근 기록: ${stats.total_records}건`)
    console.log(`지각 기록: ${stats.late_count}건`)
    console.log(`야근 기록: ${stats.overtime_count}건`)
    console.log(`평균 근무시간: ${stats.avg_work_hours}시간`)
  } catch (error) {
    console.error('Error generating attendance data:', error)
  } finally {
    await pool.end()
  }
}

generateAllAttendanceData()
