/**
 * 대한민국 연차부여 시스템에 따른 연차 계산 유틸리티
 *
 * 규정:
 * - 입사 1년 미만: 입사 후 1개월마다 1개씩 연차 부여
 * - 입사 1년 이상: 매년 15개 연차 부여
 * - 입사 3년 이상: 매년 16개 연차 부여
 * - 입사 5년 이상: 매년 17개 연차 부여
 * - 입사 7년 이상: 매년 18개 연차 부여
 * - 입사 10년 이상: 매년 19개 연차 부여
 * - 입사 15년 이상: 매년 20개 연차 부여
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
    const workDuration = this.calculateWorkDuration(hireDate, calculationDate)

    // 입사 1년 미만인 경우
    if (workDuration.years < 1) {
      return workDuration.months
    }

    // 입사 1년 이상인 경우
    return this.getAnnualLeaveByWorkYears(workDuration.years)
  }

  /**
   * 근속년수에 따른 연차 개수 반환
   * @param workYears 근속년수
   * @returns 연차 개수
   */
  private static getAnnualLeaveByWorkYears(workYears: number): number {
    if (workYears < 1) return 0
    if (workYears < 3) return 15
    if (workYears < 5) return 16
    if (workYears < 7) return 17
    if (workYears < 10) return 18
    if (workYears < 15) return 19
    return 20
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
   * 연차 부여 예정일 계산 (입사 1년 미만인 경우)
   * @param hireDate 입사일
   * @param calculationDate 계산 기준일
   * @returns 다음 연차 부여 예정일
   */
  public static getNextLeaveGrantDate(
    hireDate: Date,
    calculationDate: Date = new Date(),
  ): Date | null {
    const workDuration = this.calculateWorkDuration(hireDate, calculationDate)

    // 입사 1년 이상인 경우는 매년 1월 1일에 연차 부여
    if (workDuration.years >= 1) {
      const nextYear = new Date(calculationDate)
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      nextYear.setMonth(0, 1) // 1월 1일
      return nextYear
    }

    // 입사 1년 미만인 경우는 다음 달 입사일
    const nextMonth = new Date(hireDate)
    nextMonth.setMonth(nextMonth.getMonth() + workDuration.months + 1)
    return nextMonth
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
      // 입사 1년 이상인 경우 - 매년 연차 부여
      for (let year = 1; year <= workDuration.years; year++) {
        const grantDate = new Date(hireDate)
        grantDate.setFullYear(grantDate.getFullYear() + year)
        const annualLeave = this.getAnnualLeaveByWorkYears(year)
        history.push({
          date: grantDate,
          grantedLeave: annualLeave,
          reason: `입사 ${year}년차 연차 부여`,
        })
      }
    }

    return history
  }
}
