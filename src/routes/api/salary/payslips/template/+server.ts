import { query } from '$lib/database/connection'
import { toUTC } from '$lib/utils/date-handler'
import { formatEmployeeName } from '$lib/utils/format'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import * as XLSX from 'xlsx'
import type { RequestHandler } from './$types'

interface EmployeeData {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  department: string
  position: string
  hire_date: string
  annual_salary: string | null
  [key: string]: unknown
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const year = url.searchParams.get('year') || new Date().getFullYear().toString()
    const month = url.searchParams.get('month') || (new Date().getMonth() + 1).toString()

    // 모든 직원 정보 조회
    const result = await query<EmployeeData>(
      `
			SELECT 
				e.id,
				e.employee_id,
				e.first_name,
				e.last_name,
				e.department,
				e.position,
				e.hire_date,
				sc.annual_salary
			FROM employees e
			LEFT JOIN salary_contracts sc ON e.id = sc.employee_id AND sc.status = 'active'
			WHERE e.status = 'active'
			ORDER BY e.department, e.employee_id
			`,
    )

    const employees = result.rows

    // 헤더 설정
    const headers = [
      '사번',
      '성명',
      '부서',
      '직위',
      '입사일',
      '기본급',
      '직책수당',
      '상여금',
      '식대',
      '차량유지',
      '연차수당',
      '연말정산',
      '건강보험',
      '장기요양보험',
      '국민연금',
      '고용보험',
      '갑근세',
      '주민세',
      '기타',
      '지급총액',
      '공제총액',
      '실지급액',
    ]

    // 데이터 행 생성
    const dataRows: any[][] = [headers]

    employees.forEach((employee) => {
      const baseSalary = employee.annual_salary
        ? Math.round(parseFloat(employee.annual_salary) / 12)
        : 3000000
      const hireDate = employee.hire_date ? toUTC(new Date(employee.hire_date)).split('T')[0] : ''

      const row = [
        employee.employee_id,
        formatEmployeeName(employee),
        employee.department || '부서없음',
        employee.position || '연구원',
        hireDate,
        baseSalary, // 기본급
        0, // 직책수당
        0, // 상여금
        300000, // 식대
        200000, // 차량유지
        0, // 연차수당
        0, // 연말정산
        0, // 건강보험
        0, // 장기요양보험
        0, // 국민연금
        0, // 고용보험
        0, // 갑근세
        0, // 주민세
        0, // 기타
        '=SUM(F2:L2)', // 지급총액 (각 행마다 해당하는 행 번호로 계산)
        '=SUM(M2:S2)', // 공제총액
        '=T2-U2', // 실지급액
      ]

      dataRows.push(row)
    })

    // 워크북 생성
    const workbook = XLSX.utils.book_new()

    // 메인 시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet(dataRows)

    // 열 너비 설정
    const columnWidths = [
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ]
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, '급여명세서')

    // 설명 시트 생성
    const instructionData = [
      ['급여명세서 엑셀 업로드 가이드'],
      [''],
      ['1. 기본 정보'],
      ['- 사번, 성명, 부서, 직위, 입사일은 수정하지 마세요'],
      ['- 기본급은 연봉/12로 자동 계산됩니다'],
      [''],
      ['2. 지급사항 (F~L열)'],
      ['- 기본급: 기본 급여 (자동 계산)'],
      ['- 직책수당: 직책에 따른 수당'],
      ['- 상여금: 성과급, 보너스 등'],
      ['- 식대: 식비 지원 (비과세)'],
      ['- 차량유지: 차량 관련 비용 (비과세)'],
      ['- 연차수당: 연차 사용 시 지급'],
      ['- 연말정산: 연말정산 관련 지급'],
      [''],
      ['3. 공제사항 (M~S열)'],
      ['- 건강보험: 건강보험료 (3.4%)'],
      ['- 장기요양보험: 장기요양보험료 (0.34%)'],
      ['- 국민연금: 국민연금 (4.5%)'],
      ['- 고용보험: 고용보험료 (0.8%)'],
      ['- 갑근세: 소득세 (13%)'],
      ['- 주민세: 지방소득세 (1.3%)'],
      ['- 기타: 기타 공제사항'],
      [''],
      ['4. 자동 계산'],
      ['- 지급총액: 지급사항 합계 (자동 계산)'],
      ['- 공제총액: 공제사항 합계 (자동 계산)'],
      ['- 실지급액: 지급총액 - 공제총액 (자동 계산)'],
      [''],
      ['5. 주의사항'],
      ['- 숫자만 입력하세요 (콤마, 원화 표시 제외)'],
      ['- 빈 셀은 0으로 처리됩니다'],
      ['- 파일을 저장한 후 업로드하세요'],
    ]

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructionData)
    XLSX.utils.book_append_sheet(workbook, instructionSheet, '작성 가이드')

    // 엑셀 파일 생성
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 한글 파일명을 URL 인코딩

    const fileName = `급여명세서_${year}년${month}월_템플릿.xlsx`
    const encodedFileName = encodeURIComponent(fileName)

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
      },
    })
  } catch (error: unknown) {
    logger.error('Error generating payslip template:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : '엑셀 템플릿 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
