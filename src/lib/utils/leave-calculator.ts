/**
 * 대한민국 연차부여 시스템에 따른 연차 계산 유틸리티
 *
 * 규정:
 * - 입사 1년 미만: 입사 후 매월 1일마다 1개씩 연차 부여 (월차)
 * - 입사 1년차: 기존 월차 12개 + 15개의 월할 계산 (입사월부터 연말까지)
 *   예) 5월 1일 입사 → 2020년: 12개(월차) + 15×(8/12)=10개 = 22개
 * - 입사 1년 이후: 매년 1월 1일에 연차 리셋 및 증가
 *   - 기본 15개 + 매년 0.5개씩 추가
 *   - 미사용 연차는 매년 말 소멸
 *   예) 2019년 5월 1일 입사
 *       2020년: 22개
 *       2021년: 15.5개 (리셋)
 *       2022년: 16개 (리셋)
 *       2023년: 16.5개 (리셋)
 *       2024년: 17개 (리셋)
 *       2025년: 17.5개 (리셋)
 */

export interface LeaveCalculationResult {
  totalAnnualLeave: number
  usedAnnualLeave: number
  remainingAnnualLeave: number
  calculationDate: Date
  workYears: number
  workMonths: number
}

export class LeaveCalculator {
  /**
   * 입사일을 기준으로 연차 개수 계산
   * @param hireDate 입사일
   * @param calculationDate 계산 기준일 (기본값: 오늘)
   * @returns 연차 개수
   */
  public static calculateAnnualLeave(hireDate: Date, calculationDate: Date = new Date()): number {
    const hire = new Date(hireDate)
    const calc = new Date(calculationDate)
    const workDuration = this.calculateWorkDuration(hire, calc)

    // 입사 1년 미만인 경우: 월차만 계산
    if (workDuration.years < 1) {
      return workDuration.months
    }

    // 입사 1년 이상인 경우: 연도별 연차 계산
    const hireYear = hire.getFullYear()
    const hireMonth = hire.getMonth() // 0-11
    const calcYear = calc.getFullYear()

    // 1년차 입사기념일
    const oneYearAnniversary = new Date(hireYear + 1, hireMonth, 1)
    const oneYearAnnivYear = oneYearAnniversary.getFullYear()

    // 현재 연도가 1년차 연도인 경우: 월차 12개 + 15개의 월할
    if (calcYear === oneYearAnnivYear) {
      const remainingMonths = 12 - hireMonth
      const proratedLeave = (15 * remainingMonths) / 12
      return 12 + proratedLeave
    }

    // 1년차 이후: 15 + (현재 연도 - 1년차 연도) * 0.5
    const yearsSinceOneYear = calcYear - oneYearAnnivYear
    return 15 + yearsSinceOneYear * 0.5
  }

  /**
   * 입사일부터 계산일까지의 근무 기간 계산
   * @param hireDate 입사일
   * @param calculationDate 계산 기준일
   * @returns 근무 기간 (년, 월)
   */
  public static calculateWorkDuration(
    hireDate: Date,
    calculationDate: Date = new Date(),
  ): { years: number; months: number } {
    const hire = new Date(hireDate)
    const calc = new Date(calculationDate)

    let years = calc.getFullYear() - hire.getFullYear()
    let months = calc.getMonth() - hire.getMonth()

    // 일 단위 조정
    if (calc.getDate() < hire.getDate()) {
      months--
    }

    // 월 단위 조정
    if (months < 0) {
      years--
      months += 12
    }

    return { years, months }
  }

  /**
   * 연차 잔여일수 계산
   * @param hireDate 입사일
   * @param usedLeave 사용한 연차 일수
   * @param calculationDate 계산 기준일
   * @returns 연차 계산 결과
   */
  public static calculateLeaveBalance(
    hireDate: Date,
    usedLeave: number = 0,
    calculationDate: Date = new Date(),
  ): LeaveCalculationResult {
    const workDuration = this.calculateWorkDuration(hireDate, calculationDate)
    const totalAnnualLeave = this.calculateAnnualLeave(hireDate, calculationDate)

    return {
      totalAnnualLeave,
      usedAnnualLeave: usedLeave,
      remainingAnnualLeave: Math.max(0, totalAnnualLeave - usedLeave),
      calculationDate,
      workYears: workDuration.years,
      workMonths: workDuration.months,
    }
  }

  /**
   * 연차 사용 가능 여부 확인
   * @param hireDate 입사일
   * @param usedLeave 사용한 연차 일수
   * @param requestedDays 신청하려는 연차 일수
   * @param calculationDate 계산 기준일
   * @returns 사용 가능 여부
   */
  public static canUseLeave(
    hireDate: Date,
    usedLeave: number,
    requestedDays: number,
    calculationDate: Date = new Date(),
  ): boolean {
    const balance = this.calculateLeaveBalance(hireDate, usedLeave, calculationDate)
    return balance.remainingAnnualLeave >= requestedDays
  }

  /**
   * 연차 부여 예정일 계산
   * @param hireDate 입사일
   * @param calculationDate 계산 기준일
   * @returns 다음 연차 부여 예정일
   */
  public static getNextLeaveGrantDate(
    hireDate: Date,
    calculationDate: Date = new Date(),
  ): Date | null {
    const hire = new Date(hireDate)
    const calc = new Date(calculationDate)
    const workDuration = this.calculateWorkDuration(hire, calc)

    // 입사 1년 미만인 경우는 다음 달 1일
    if (workDuration.years < 1) {
      const nextMonth = new Date(hire)
      nextMonth.setMonth(nextMonth.getMonth() + workDuration.months + 1)
      nextMonth.setDate(1)
      return nextMonth
    }

    // 입사 1년 이상인 경우: 다가오는 1월 1일 또는 입사기념일(X월 1일) 중 가까운 날짜
    const hireMonth = hire.getMonth()
    const calcYear = calc.getFullYear()
    const calcMonth = calc.getMonth()
    const calcDay = calc.getDate()

    // 이번 연도의 1월 1일
    const thisYearJan1 = new Date(calcYear, 0, 1)
    // 이번 연도의 입사기념일
    const thisYearAnniversary = new Date(calcYear, hireMonth, 1)
    // 다음 연도의 1월 1일
    const nextYearJan1 = new Date(calcYear + 1, 0, 1)

    // 현재 날짜 이후의 가장 가까운 부여 예정일 찾기
    if (thisYearJan1 > calc) {
      return thisYearJan1
    } else if (thisYearAnniversary > calc) {
      return thisYearAnniversary
    } else {
      return nextYearJan1
    }
  }

  /**
   * 연차 부여 이력 생성 (입사일부터 현재까지)
   * @param hireDate 입사일
   * @param calculationDate 계산 기준일
   * @returns 연차 부여 이력
   */
  public static generateLeaveGrantHistory(
    hireDate: Date,
    calculationDate: Date = new Date(),
  ): Array<{
    date: Date
    grantedLeave: number
    reason: string
  }> {
    const history: Array<{ date: Date; grantedLeave: number; reason: string }> = []
    const workDuration = this.calculateWorkDuration(hireDate, calculationDate)

    // 입사 1년 미만인 경우 - 매월 연차 부여
    if (workDuration.years < 1) {
      for (let month = 1; month <= workDuration.months; month++) {
        const grantDate = new Date(hireDate)
        grantDate.setMonth(grantDate.getMonth() + month)
        history.push({
          date: grantDate,
          grantedLeave: 1,
          reason: `입사 ${month}개월차 연차 부여`,
        })
      }
    } else {
      // 입사 1년 이상인 경우 - 새로운 방식
      const hire = new Date(hireDate)
      const calc = new Date(calculationDate)
      const hireYear = hire.getFullYear()
      const hireMonth = hire.getMonth()
      const calcYear = calc.getFullYear()
      const calcMonth = calc.getMonth()
      const calcDay = calc.getDate()

      // 1년차 입사기념일: 기존 월차 12개 + 15개의 월할 계산
      const oneYearAnniversary = new Date(hireYear + 1, hireMonth, 1)
      const oneYearAnnivYear = oneYearAnniversary.getFullYear()
      const remainingMonths = 12 - hireMonth
      const proratedLeave = (15 * remainingMonths) / 12

      history.push({
        date: oneYearAnniversary,
        grantedLeave: 12 + proratedLeave,
        reason: `${oneYearAnnivYear}년 연차: 월차 12개 + 연차 월할(${remainingMonths}개월) ${proratedLeave.toFixed(1)}개 = ${(12 + proratedLeave).toFixed(1)}개`,
      })

      // 1년차 다음 해부터 매년 1월 1일에 새로운 연차 부여
      for (let year = oneYearAnnivYear + 1; year <= calcYear; year++) {
        const jan1 = new Date(year, 0, 1)
        if (jan1 <= calc) {
          const yearsSinceOneYear = year - oneYearAnnivYear
          const yearlyLeave = 15 + yearsSinceOneYear * 0.5
          history.push({
            date: jan1,
            grantedLeave: yearlyLeave,
            reason: `${year}년 연차: 15 + ${yearsSinceOneYear} × 0.5 = ${yearlyLeave}개`,
          })
        }
      }
    }

    return history
  }
}
