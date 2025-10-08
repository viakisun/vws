import type { PayslipData, PayslipSaveRequest } from '../types'

/**
 * 특정 직원의 연도별 급여명세서 데이터 조회
 * @param employeeId - 직원 ID
 * @param year - 조회 연도
 * @param hireDate - 입사일 (선택사항, 입사 전 월 표시용)
 * @returns 12개월 급여명세서 데이터 배열
 * @throws API 호출 실패 시 에러
 */
export async function fetchPayslipData(
  employeeId: string,
  year: number,
  hireDate?: string,
): Promise<PayslipData[]> {
  if (!employeeId) {
    return []
  }

  const response = await fetch(`/api/salary/payslips?employeeId=${employeeId}&year=${year}`)
  const result = await response.json()

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const hireDateTime = hireDate ? new Date(hireDate) : null
  const hireYear = hireDateTime ? hireDateTime.getFullYear() : null
  const hireMonth = hireDateTime ? hireDateTime.getMonth() + 1 : null

  if (result.success && result.data) {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const period = `${year}-${String(month).padStart(2, '0')}`

      let payslip = null
      if (Array.isArray(result.data)) {
        payslip = result.data.find((p: PayslipData) => p.period === period)
      } else if (result.data.period === period) {
        payslip = result.data
      }

      const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth + 1)

      const isBeforeHire = Boolean(
        hireDateTime &&
          hireYear &&
          hireMonth &&
          (year < hireYear || (year === hireYear && month < hireMonth)),
      )

      return {
        month,
        period,
        label: `${month}월`,
        payslip: payslip || undefined,
        hasData: !!payslip,
        isBeforeHire,
        isLocked: isFutureMonth || isBeforeHire,
      }
    })
  }

  // API 호출 실패 시 빈 12개월 데이터 반환
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth + 1)

    const isBeforeHire = Boolean(
      hireDateTime &&
        hireYear &&
        hireMonth &&
        (year < hireYear || (year === hireYear && month < hireMonth)),
    )

    return {
      month,
      period: `${year}-${String(month).padStart(2, '0')}`,
      label: `${month}월`,
      payslip: undefined,
      hasData: false,
      isBeforeHire,
      isLocked: isFutureMonth || isBeforeHire,
    }
  })
}

/**
 * 급여명세서 저장
 * @param data - 저장할 급여명세서 데이터
 * @returns 저장 성공 여부 및 에러 메시지
 */
export async function savePayslip(data: PayslipSaveRequest): Promise<{
  success: boolean
  error?: string
}> {
  const response = await fetch('/api/salary/payslips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (result.success) {
    return { success: true }
  } else {
    return { success: false, error: result.error }
  }
}
