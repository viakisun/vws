import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 출퇴근 설정 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)

    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      return json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    // 회사 ID 조회
    const companyResult = await query(`SELECT company_id FROM employees WHERE id = $1`, [
      user.employee_id,
    ])

    if (companyResult.rows.length === 0) {
      return json({ success: false, message: '회사 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const companyId = companyResult.rows[0].company_id

    // 출퇴근 설정 조회
    const result = await query(
      `
      SELECT
        id,
        company_id,
        work_start_time,
        work_end_time,
        late_threshold_minutes,
        early_leave_threshold_minutes,
        allowed_ips,
        require_ip_check,
        created_at,
        updated_at
      FROM attendance_settings
      WHERE company_id = $1
    `,
      [companyId],
    )

    if (result.rows.length === 0) {
      // 설정이 없으면 기본값 생성
      const insertResult = await query(
        `
        INSERT INTO attendance_settings (company_id)
        VALUES ($1)
        RETURNING 
          id,
          company_id,
          work_start_time,
          work_end_time,
          late_threshold_minutes,
          early_leave_threshold_minutes,
          allowed_ips,
          require_ip_check,
          created_at::text,
          updated_at::text
      `,
        [companyId],
      )

      return json({
        success: true,
        data: insertResult.rows[0],
      })
    }

    return json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    logger.error('Error fetching attendance settings:', error)
    return json({ success: false, message: '출퇴근 설정 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 출퇴근 설정 업데이트
export const PUT: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)

    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      return json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const {
      work_start_time,
      work_end_time,
      late_threshold_minutes,
      early_leave_threshold_minutes,
      allowed_ips,
      require_ip_check,
    } = await event.request.json()

    // 회사 ID 조회
    const companyResult = await query(`SELECT company_id FROM employees WHERE id = $1`, [
      user.employee_id,
    ])

    if (companyResult.rows.length === 0) {
      return json({ success: false, message: '회사 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const companyId = companyResult.rows[0].company_id

    // 출퇴근 설정 업데이트
    const result = await query(
      `
      UPDATE attendance_settings
      SET
        work_start_time = COALESCE($2, work_start_time),
        work_end_time = COALESCE($3, work_end_time),
        late_threshold_minutes = COALESCE($4, late_threshold_minutes),
        early_leave_threshold_minutes = COALESCE($5, early_leave_threshold_minutes),
        allowed_ips = COALESCE($6, allowed_ips),
        require_ip_check = COALESCE($7, require_ip_check),
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = $1
      RETURNING 
        id,
        company_id,
        work_start_time,
        work_end_time,
        late_threshold_minutes,
        early_leave_threshold_minutes,
        allowed_ips,
        require_ip_check,
        created_at::text,
        updated_at::text
    `,
      [
        companyId,
        work_start_time,
        work_end_time,
        late_threshold_minutes,
        early_leave_threshold_minutes,
        allowed_ips,
        require_ip_check,
      ],
    )

    if (result.rows.length === 0) {
      return json({ success: false, message: '출퇴근 설정을 찾을 수 없습니다.' }, { status: 404 })
    }

    return json({
      success: true,
      message: '출퇴근 설정이 업데이트되었습니다.',
      data: result.rows[0],
    })
  } catch (error) {
    logger.error('Error updating attendance settings:', error)
    return json(
      { success: false, message: '출퇴근 설정 업데이트에 실패했습니다.' },
      { status: 500 },
    )
  }
}
