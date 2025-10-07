import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 재직증명서 발급 요청 내역 조회
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { url } = event

    const status = url.searchParams.get('status')

    let whereClause = 'WHERE cr.employee_id = $1'
    const params = [user.id]

    if (status) {
      whereClause += ' AND cr.status = $2'
      params.push(status)
    }

    // 재직증명서 발급 요청 내역 조회
    const requestsResult = await query(
      `
      SELECT 
        cr.*,
        approver.first_name || ' ' || approver.last_name as approver_name
      FROM certificate_requests cr
      LEFT JOIN employees approver ON cr.approved_by = approver.id
      ${whereClause}
      ORDER BY cr.created_at DESC
    `,
      params,
    )

    // 사용자 정보 조회 (재직증명서용)
    const userInfoResult = await query(
      `
      SELECT 
        e.*,
        d.name as department_name,
        p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.id = $1
    `,
      [user.id],
    )

    const userInfo = userInfoResult.rows[0]

    // 이번 해 발급 통계
    const currentYear = new Date().getFullYear()
    const statsResult = await query(
      `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_requests
      FROM certificate_requests 
      WHERE employee_id = $1 
        AND EXTRACT(YEAR FROM created_at) = $2
    `,
      [user.id, currentYear],
    )

    const stats = statsResult.rows[0]

    return json({
      success: true,
      data: {
        requests: requestsResult.rows,
        userInfo: {
          name: userInfo.first_name + ' ' + userInfo.last_name,
          employeeId: userInfo.employee_id,
          department: userInfo.department_name,
          position: userInfo.position_name,
          hireDate: userInfo.hire_date,
          email: userInfo.email,
          phone: userInfo.phone,
        },
        stats: {
          totalRequests: parseInt(stats.total_requests),
          pendingRequests: parseInt(stats.pending_requests),
          approvedRequests: parseInt(stats.approved_requests),
          issuedRequests: parseInt(stats.issued_requests),
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching certificate requests:', error)
    return json(
      { success: false, message: '재직증명서 발급 요청 조회에 실패했습니다.' },
      { status: 500 },
    )
  }
}

// 재직증명서 발급 요청
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { certificateType, purpose } = await event.request.json()

    // 필수 필드 검증
    if (!certificateType || !purpose) {
      return json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 유효한 증명서 타입 검증
    const validTypes = ['employment', 'income', 'career', 'other']
    if (!validTypes.includes(certificateType)) {
      return json({ success: false, message: '유효하지 않은 증명서 타입입니다.' }, { status: 400 })
    }

    // 발급 요청 등록
    const result = await query(
      `
      INSERT INTO certificate_requests (
        employee_id, 
        certificate_type, 
        purpose, 
        status
      )
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `,
      [user.id, certificateType, purpose],
    )

    // 승인자에게 알림 생성 (관리자)
    await query(
      `
      INSERT INTO notifications (
        employee_id,
        title,
        message,
        type,
        category,
        action_url,
        action_data
      )
      SELECT 
        e.id,
        '재직증명서 발급 요청 알림',
        $1 || '님이 ' || $2 || ' 재직증명서 발급을 요청했습니다.',
        'approval_request',
        'certificate',
        '/hr/certificate-approval',
        $3::jsonb
      FROM employees e
      WHERE e.role IN ('ADMIN', 'MANAGER')
    `,
      [
        user.name || user.email,
        certificateType === 'employment'
          ? '재직'
          : certificateType === 'income'
            ? '소득'
            : certificateType === 'career'
              ? '경력'
              : '기타',
        JSON.stringify({ requestId: result.rows[0].id, employeeId: user.id }),
      ],
    )

    return json({
      success: true,
      message: '재직증명서 발급 요청이 완료되었습니다.',
      data: result.rows[0],
    })
  } catch (error) {
    logger.error('Error creating certificate request:', error)
    return json(
      { success: false, message: '재직증명서 발급 요청에 실패했습니다.' },
      { status: 500 },
    )
  }
}
