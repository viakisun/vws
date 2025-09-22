import { query } from '$lib/database/connection'
import { json } from '@sveltejs/kit'
import ExcelJS from 'exceljs'

export async function POST({ request }) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const period = formData.get('period') as string // YYYY-MM 형식

    if (!file) {
      return json(
        {
          success: false,
          error: '파일이 선택되지 않았습니다.'
        },
        { status: 400 }
      )
    }

    if (!period) {
      return json(
        {
          success: false,
          error: '급여 기간이 지정되지 않았습니다.'
        },
        { status: 400 }
      )
    }

    // 파일 확장자 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return json(
        {
          success: false,
          error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'
        },
        { status: 400 }
      )
    }

    // 엑셀 파일 읽기
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet('급여명세서')
    if (!worksheet) {
      return json(
        {
          success: false,
          error: '급여명세서 시트를 찾을 수 없습니다.'
        },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    // 헤더 행 건너뛰고 데이터 행 처리
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)

      try {
        // 필수 데이터 추출
        const employeeId = row.getCell(1).value?.toString()
        const name = row.getCell(2).value?.toString()

        if (!employeeId || !name) {
          results.failed++
          results.errors.push(`행 ${rowNumber}: 사번 또는 성명이 없습니다.`)
          continue
        }

        // 직원 ID로 실제 직원 찾기
        const employeeResult = await query('SELECT id FROM employees WHERE employee_id = $1', [
          employeeId
        ])

        if (employeeResult.rows.length === 0) {
          results.failed++
          results.errors.push(
            `행 ${rowNumber}: 사번 ${employeeId}에 해당하는 직원을 찾을 수 없습니다.`
          )
          continue
        }

        const employeeDbId = employeeResult.rows[0].id

        // 지급사항 데이터 추출
        const allowances = [
          { id: 'basic_salary', name: '기본급', amount: Number(row.getCell(6).value) || 0 },
          { id: 'position_allowance', name: '직책수당', amount: Number(row.getCell(7).value) || 0 },
          { id: 'bonus', name: '상여금', amount: Number(row.getCell(8).value) || 0 },
          { id: 'meal_allowance', name: '식대', amount: Number(row.getCell(9).value) || 0 },
          {
            id: 'vehicle_maintenance',
            name: '차량유지',
            amount: Number(row.getCell(10).value) || 0
          },
          {
            id: 'annual_leave_allowance',
            name: '연차수당',
            amount: Number(row.getCell(11).value) || 0
          },
          {
            id: 'year_end_settlement',
            name: '연말정산',
            amount: Number(row.getCell(12).value) || 0
          }
        ]

        // 공제사항 데이터 추출
        const deductions = [
          { id: 'health_insurance', name: '건강보험', amount: Number(row.getCell(13).value) || 0 },
          {
            id: 'long_term_care',
            name: '장기요양보험',
            amount: Number(row.getCell(14).value) || 0
          },
          { id: 'national_pension', name: '국민연금', amount: Number(row.getCell(15).value) || 0 },
          {
            id: 'employment_insurance',
            name: '고용보험',
            amount: Number(row.getCell(16).value) || 0
          },
          { id: 'income_tax', name: '갑근세', amount: Number(row.getCell(17).value) || 0 },
          { id: 'local_tax', name: '주민세', amount: Number(row.getCell(18).value) || 0 },
          { id: 'other', name: '기타', amount: Number(row.getCell(19).value) || 0 }
        ]

        // 총액 계산
        const totalPayments = allowances.reduce((sum, item) => sum + item.amount, 0)
        const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0)
        const netSalary = totalPayments - totalDeductions
        const baseSalary = allowances.find(a => a.id === 'basic_salary')?.amount || 0

        // 지급일 설정 (해당 월의 마지막 날)
        const [year, month] = period.split('-')
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
        const payDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`

        // 기존 급여명세서 확인
        const existingPayslip = await query(
          'SELECT id FROM payslips WHERE employee_id = $1 AND period = $2',
          [employeeDbId, period]
        )

        if (existingPayslip.rows.length > 0) {
          // 기존 급여명세서 업데이트
          await query(
            `
						UPDATE payslips SET
							pay_date = $3,
							pay_period_start = $4,
							pay_period_end = $5,
							base_salary = $6,
							total_payments = $7,
							total_deductions = $8,
							net_salary = $9,
							total_amount = $10,
							payments = $11,
							deductions = $12,
							status = 'draft',
							is_generated = false,
							updated_at = CURRENT_TIMESTAMP
						WHERE employee_id = $1 AND period = $2
						`,
            [
              employeeDbId,
              period,
              payDate,
              `${year}-${month.padStart(2, '0')}-01`,
              `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`,
              baseSalary,
              totalPayments,
              totalDeductions,
              netSalary,
              totalPayments,
              JSON.stringify(allowances),
              JSON.stringify(deductions)
            ]
          )
        } else {
          // 새 급여명세서 생성
          await query(
            `
						INSERT INTO payslips (
							employee_id, period, pay_date, pay_period_start, pay_period_end,
							base_salary, total_payments, total_deductions, net_salary, total_amount,
							payments, deductions, status, is_generated
						) VALUES (
							$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', false
						)
						`,
            [
              employeeDbId,
              period,
              payDate,
              `${year}-${month.padStart(2, '0')}-01`,
              `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`,
              baseSalary,
              totalPayments,
              totalDeductions,
              netSalary,
              totalPayments,
              JSON.stringify(allowances),
              JSON.stringify(deductions)
            ]
          )
        }

        results.success++
        results.details.push({
          row: rowNumber,
          employeeId,
          name,
          status: 'success',
          totalPayments,
          netSalary
        })
      } catch (error) {
        results.failed++
        results.errors.push(
          `행 ${rowNumber}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        )
        results.details.push({
          row: rowNumber,
          employeeId: row.getCell(1).value?.toString() || 'N/A',
          name: row.getCell(2).value?.toString() || 'N/A',
          status: 'failed',
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }

    return json({
      success: true,
      message: `처리 완료: 성공 ${results.success}건, 실패 ${results.failed}건`,
      results
    })
  } catch (error) {
    return json(
      {
        success: false,
        error: '파일 업로드 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
