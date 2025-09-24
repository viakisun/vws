import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { query } from '$lib/database/connection'
import { logger } from '$lib/utils/logger'
import { formatEmployeeName } from '$lib/utils/format'

// 조직도 다운로드 (CSV 형식)
export const GET: RequestHandler = async () => {
  try {
    // 모든 직원 데이터 조회
    const employeesResult = await query(`
			SELECT 
				first_name,
				last_name,
				email,
				department,
				position,
				salary,
				status
			FROM employees 
			WHERE status = 'active'
			ORDER BY department, position
		`)

    const employees = Array.isArray(employeesResult) ? employeesResult : employeesResult.rows || []

    // CSV 헤더
    const csvHeader = '이름,부서,직급,이메일,연봉,상태\n'

    // CSV 데이터 생성
    const csvData = employees
      .map((emp: any) => {
        return `"${formatEmployeeName(emp)}","${emp.department}","${emp.position}","${emp.email}","${emp.salary}","${emp.status}"`
      })
      .join('\n')

    const csvContent = csvHeader + csvData

    // CSV 파일로 응답
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="organization_chart.csv"',
      },
    })
  } catch (error: any) {
    logger.error('Error downloading organization chart:', error)
    return json(
      {
        success: false,
        error: error.message || '조직도 다운로드에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
