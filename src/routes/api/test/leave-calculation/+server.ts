import { LeaveCalculator } from '$lib/utils/leave-calculator'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// 연차 계산 테스트 API
export const GET: RequestHandler = async (event) => {
  try {
    const { url } = event
    const hireDateStr = url.searchParams.get('hireDate')

    if (!hireDateStr) {
      return json({ success: false, message: 'hireDate 파라미터가 필요합니다.' }, { status: 400 })
    }

    const hireDate = new Date(hireDateStr)
    const calculationDate = new Date()

    // 연차 계산
    const leaveCalculation = LeaveCalculator.calculateLeaveBalance(hireDate, 0, calculationDate)

    // 연차 부여 이력
    const grantHistory = LeaveCalculator.generateLeaveGrantHistory(hireDate, calculationDate)

    // 다음 연차 부여 예정일
    const nextGrantDate = LeaveCalculator.getNextLeaveGrantDate(hireDate, calculationDate)

    return json({
      success: true,
      data: {
        hireDate: hireDate.toISOString().split('T')[0],
        calculationDate: calculationDate.toISOString().split('T')[0],
        workDuration: {
          years: leaveCalculation.workYears,
          months: leaveCalculation.workMonths,
        },
        leaveCalculation,
        grantHistory,
        nextGrantDate: nextGrantDate?.toISOString().split('T')[0] || null,
      },
    })
  } catch (error) {
    return json({ success: false, message: '연차 계산 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
