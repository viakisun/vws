import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 급여명세서 PDF 다운로드
export const GET: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { params } = event

    const payslipId = params.id

    if (!payslipId) {
      throw error(400, '급여명세서 ID가 필요합니다.')
    }

    // 급여명세서 조회
    const payslipResult = await query(
      `
      SELECT 
        p.*,
        e.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.department,
        e.position
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.id = $1
    `,
      [payslipId],
    )

    if (payslipResult.rows.length === 0) {
      throw error(404, '급여명세서를 찾을 수 없습니다.')
    }

    const payslip = payslipResult.rows[0]

    // 권한 확인: 본인의 급여명세서만 다운로드 가능
    const employeeResult = await query(
      `
      SELECT id FROM employees WHERE email = $1
    `,
      [user.email],
    )

    if (employeeResult.rows.length === 0 || employeeResult.rows[0].id !== payslip.employee_id) {
      throw error(403, '해당 급여명세서에 대한 다운로드 권한이 없습니다.')
    }

    // PDF 생성 (실제 구현에서는 PDF 라이브러리 사용)
    // 여기서는 간단한 HTML을 반환
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>급여명세서 - ${payslip.employee_name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-box { width: 48%; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total-section { background-color: #f0f8ff; padding: 15px; border-radius: 5px; text-align: center; }
          .total-amount { font-size: 24px; font-weight: bold; color: #0066cc; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .amount { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>급여명세서</h1>
          <h2>${payslip.year}년 ${payslip.month}월</h2>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="section-title">직원 정보</div>
            <div class="info-row">
              <span>성명:</span>
              <span>${payslip.employee_name}</span>
            </div>
            <div class="info-row">
              <span>사번:</span>
              <span>${payslip.employee_id}</span>
            </div>
            <div class="info-row">
              <span>부서:</span>
              <span>${payslip.department}</span>
            </div>
            <div class="info-row">
              <span>직급:</span>
              <span>${payslip.position}</span>
            </div>
          </div>

          <div class="info-box">
            <div class="section-title">근무 정보</div>
            <div class="info-row">
              <span>근무일수:</span>
              <span>${payslip.working_days}일</span>
            </div>
            <div class="info-row">
              <span>연장근무:</span>
              <span>${payslip.overtime_hours}시간</span>
            </div>
            <div class="info-row">
              <span>급여지급일:</span>
              <span>${new Date(payslip.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="section-title">지급 내역</div>
            <table>
              <tr>
                <th>항목</th>
                <th class="amount">금액</th>
              </tr>
              <tr>
                <td>기본급</td>
                <td class="amount">${parseFloat(payslip.basic_salary || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>연장근무수당</td>
                <td class="amount">${parseFloat(payslip.overtime_pay || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>상여금</td>
                <td class="amount">${parseFloat(payslip.bonus || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>제수당</td>
                <td class="amount">${parseFloat(payslip.allowances || 0).toLocaleString()}원</td>
              </tr>
              <tr style="font-weight: bold; background-color: #f9f9f9;">
                <td>지급총액</td>
                <td class="amount">${parseFloat(payslip.gross_pay || 0).toLocaleString()}원</td>
              </tr>
            </table>
          </div>

          <div class="info-box">
            <div class="section-title">공제 내역</div>
            <table>
              <tr>
                <th>항목</th>
                <th class="amount">금액</th>
              </tr>
              <tr>
                <td>소득세</td>
                <td class="amount">${parseFloat(payslip.income_tax || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>국민연금</td>
                <td class="amount">${parseFloat(payslip.national_pension || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>건강보험</td>
                <td class="amount">${parseFloat(payslip.health_insurance || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>고용보험</td>
                <td class="amount">${parseFloat(payslip.employment_insurance || 0).toLocaleString()}원</td>
              </tr>
              <tr>
                <td>장기요양보험</td>
                <td class="amount">${parseFloat(payslip.long_term_care_insurance || 0).toLocaleString()}원</td>
              </tr>
              <tr style="font-weight: bold; background-color: #f9f9f9;">
                <td>공제총액</td>
                <td class="amount">${parseFloat(payslip.total_deductions || 0).toLocaleString()}원</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="total-section">
          <div class="section-title">실지급액</div>
          <div class="total-amount">${parseFloat(payslip.net_pay || 0).toLocaleString()}원</div>
        </div>
      </body>
      </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="급여명세서_${payslip.employee_name}_${payslip.year}년${payslip.month}월.html"`,
      },
    })
  } catch (err) {
    logger.error('Error downloading payslip:', err)
    if (err instanceof Error && 'status' in err) {
      throw err
    }
    throw error(500, '급여명세서 다운로드에 실패했습니다.')
  }
}
