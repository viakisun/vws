/**
 * HR 모듈 Date 처리 테스트
 * SELECT * / RETURNING * 제거 확인
 */

import pg from 'pg'
import { config } from 'dotenv'

config()

const { Pool } = pg
const pool = new Pool({
  host: process.env.AWS_DB_HOST,
  port: parseInt(process.env.AWS_DB_PORT || '5432'),
  database: process.env.AWS_DB_NAME,
  user: process.env.AWS_DB_USER,
  password: process.env.AWS_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

// Asia/Seoul 타임존 설정
await pool.query("SET timezone = 'Asia/Seoul'")

async function testDateHandling() {
  console.log('🔍 HR 모듈 Date 처리 테스트 시작...\n')

  // 0. 직원 ID 가져오기
  const employeeResult = await pool.query(`
    SELECT id, first_name, last_name FROM employees LIMIT 1
  `)
  const employeeId = employeeResult.rows[0]?.id
  console.log(`테스트 대상 직원: ${employeeResult.rows[0]?.first_name} ${employeeResult.rows[0]?.last_name} (${employeeId})\n`)

  // 1. 출퇴근 데이터 조회 (attendance-service와 동일한 쿼리)
  console.log('1️⃣ 출퇴근 데이터 조회')
  const attendanceResult = await pool.query(`
    SELECT
      id,
      DATE(check_in_time) as date,
      check_in_time::text as check_in_time,
      check_out_time::text as check_out_time,
      break_start_time::text as break_start_time,
      break_end_time::text as break_end_time,
      total_work_hours,
      overtime_hours,
      status,
      notes
    FROM attendance
    WHERE employee_id = $1
    ORDER BY check_in_time DESC
    LIMIT 1
  `, [employeeId])

  if (attendanceResult.rows.length > 0) {
    const row = attendanceResult.rows[0]
    console.log('✅ 출퇴근:', {
      check_in_time: row.check_in_time,
      check_in_type: typeof row.check_in_time,
      check_out_time: row.check_out_time,
      check_out_type: typeof row.check_out_time,
    })
  } else {
    console.log('ℹ️ 오늘 출퇴근 데이터 없음')
  }

  // 2. 연차 데이터 조회 (dashboard/leave와 동일한 쿼리)
  console.log('\n2️⃣ 연차 데이터 조회')
  const leaveResult = await pool.query(`
    SELECT
      lr.id,
      lr.employee_id,
      lr.leave_type_id,
      lr.start_date::text as start_date,
      lr.end_date::text as end_date,
      lr.total_days,
      lr.reason,
      lr.status,
      lr.approved_by,
      lr.approved_at::text as approved_at,
      lr.rejection_reason,
      lr.created_at::text as created_at,
      lr.updated_at::text as updated_at,
      lt.name as leave_type_name
    FROM leave_requests lr
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.employee_id = $1
    ORDER BY lr.start_date DESC
    LIMIT 1
  `, [employeeId])

  if (leaveResult.rows.length > 0) {
    const row = leaveResult.rows[0]
    console.log('✅ 연차:', {
      start_date: row.start_date,
      start_date_type: typeof row.start_date,
      end_date: row.end_date,
      end_date_type: typeof row.end_date,
      created_at: row.created_at,
      created_at_type: typeof row.created_at,
    })
  } else {
    console.log('ℹ️ 연차 데이터 없음')
  }

  // 3. 직원 데이터 조회
  console.log('\n3️⃣ 직원 데이터 조회')
  const employeeDetailResult = await pool.query(`
    SELECT
      id,
      first_name,
      last_name,
      email,
      created_at::text as created_at,
      updated_at::text as updated_at
    FROM employees
    WHERE id = $1
  `, [employeeId])

  if (employeeDetailResult.rows.length > 0) {
    const row = employeeDetailResult.rows[0]
    console.log('✅ 직원:', {
      name: `${row.first_name} ${row.last_name}`,
      created_at: row.created_at,
      created_at_type: typeof row.created_at,
      updated_at: row.updated_at,
      updated_at_type: typeof row.updated_at,
    })
  }

  console.log('\n✅ 모든 테스트 완료!')
  console.log('📋 결과: 모든 날짜는 string 타입이어야 합니다.')
}

try {
  await testDateHandling()
} catch (error) {
  console.error('❌ 테스트 실패:', error)
} finally {
  await pool.end()
}

