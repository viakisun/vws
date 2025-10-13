import {
    calculateBudgetAllocation,
    calculateMonthlyFromAnnual,
    calculateMonthlySalary,
    normalizeSalaryAmount,
} from '$lib/utils/salary-calculator'
import { describe, expect, it } from 'vitest'

describe('Salary Calculator Utils', () => {
  describe('calculateMonthlySalary', () => {
    it('정상적인 연봉과 참여율로 월급을 계산해야 함', () => {
      const result = calculateMonthlySalary(60000000, 100)
      // 60,000,000 * 100% / 12 = 5,000,000
      expect(result).toBe(5000000)
    })

    it('참여율이 100% 미만일 때 올바르게 계산해야 함', () => {
      const result = calculateMonthlySalary(60000000, 50)
      // 60,000,000 * 50% / 12 = 2,500,000
      expect(result).toBe(2500000)
    })

    it('참여율이 100% 초과일 때도 올바르게 계산해야 함', () => {
      const result = calculateMonthlySalary(60000000, 150)
      // 60,000,000 * 150% / 12 = 7,500,000
      expect(result).toBe(7500000)
    })

    it('소수점이 발생하는 경우 버림 처리해야 함', () => {
      const result = calculateMonthlySalary(50000000, 100)
      // 50,000,000 * 100% / 12 = 4,166,666.666...
      expect(result).toBe(4166666)
    })

    it('0 연봉을 올바르게 처리해야 함', () => {
      const result = calculateMonthlySalary(0, 100)
      expect(result).toBe(0)
    })

    it('0 참여율을 올바르게 처리해야 함', () => {
      const result = calculateMonthlySalary(60000000, 0)
      expect(result).toBe(0)
    })

    it('음수 연봉을 올바르게 처리해야 함', () => {
      const result = calculateMonthlySalary(-60000000, 100)
      expect(result).toBe(-5000000) // 실제 구현에서는 음수를 그대로 계산
    })

    it('음수 참여율을 올바르게 처리해야 함', () => {
      const result = calculateMonthlySalary(60000000, -50)
      expect(result).toBe(-2500000) // 실제 구현에서는 음수를 그대로 계산
    })

    it('NaN 값을 올바르게 처리해야 함', () => {
      const result1 = calculateMonthlySalary(NaN, 100)
      const result2 = calculateMonthlySalary(60000000, NaN)
      const result3 = calculateMonthlySalary(NaN, NaN)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
      expect(result3).toBe(0)
    })

    it('null 값을 올바르게 처리해야 함', () => {
      const result1 = calculateMonthlySalary(null as any, 100)
      const result2 = calculateMonthlySalary(60000000, null as any)
      const result3 = calculateMonthlySalary(null as any, null as any)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
      expect(result3).toBe(0)
    })

    it('undefined 값을 올바르게 처리해야 함', () => {
      const result1 = calculateMonthlySalary(undefined as any, 100)
      const result2 = calculateMonthlySalary(60000000, undefined as any)
      const result3 = calculateMonthlySalary(undefined as any, undefined as any)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
      expect(result3).toBe(0)
    })

    it('매우 큰 수치를 올바르게 처리해야 함', () => {
      const result = calculateMonthlySalary(1000000000, 100)
      // 1,000,000,000 * 100% / 12 = 83,333,333.333...
      expect(result).toBe(83333333)
    })

    it('매우 작은 수치를 올바르게 처리해야 함', () => {
      const result = calculateMonthlySalary(100, 1)
      // 100 * 1% / 12 = 0.083...
      expect(result).toBe(0)
    })
  })

  describe('calculateMonthlyFromAnnual', () => {
    it('정상적인 연봉으로 월급을 계산해야 함', () => {
      const result = calculateMonthlyFromAnnual(60000000)
      // 60,000,000 / 12 = 5,000,000
      expect(result).toBe(5000000)
    })

    it('소수점이 발생하는 경우 버림 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(50000000)
      // 50,000,000 / 12 = 4,166,666.666...
      expect(result).toBe(4166666)
    })

    it('0 연봉을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(0)
      expect(result).toBe(0)
    })

    it('음수 연봉을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(-60000000)
      expect(result).toBe(-5000000) // 실제 구현에서는 음수를 그대로 계산
    })

    it('NaN 값을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(NaN)
      expect(result).toBe(0)
    })

    it('null 값을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(null as any)
      expect(result).toBe(0)
    })

    it('undefined 값을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(undefined as any)
      expect(result).toBe(0)
    })

    it('매우 큰 연봉을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(1000000000)
      // 1,000,000,000 / 12 = 83,333,333.333...
      expect(result).toBe(83333333)
    })

    it('매우 작은 연봉을 올바르게 처리해야 함', () => {
      const result = calculateMonthlyFromAnnual(100)
      // 100 / 12 = 8.333...
      expect(result).toBe(8)
    })
  })

  describe('calculateBudgetAllocation', () => {
    it('정상적인 예산과 비율로 배분을 계산해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 30)
      // 100,000,000 * 30% = 30,000,000
      expect(result).toBe(30000000)
    })

    it('100% 배분을 올바르게 계산해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 100)
      // 100,000,000 * 100% = 100,000,000
      expect(result).toBe(100000000)
    })

    it('0% 배분을 올바르게 계산해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 0)
      expect(result).toBe(0)
    })

    it('소수점이 발생하는 경우 버림 처리해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 33.333)
      // 100,000,000 * 33.333% = 33,333,000
      expect(result).toBe(33333000)
    })

    it('0 예산을 올바르게 처리해야 함', () => {
      const result = calculateBudgetAllocation(0, 50)
      expect(result).toBe(0)
    })

    it('음수 예산을 올바르게 처리해야 함', () => {
      const result = calculateBudgetAllocation(-100000000, 50)
      expect(result).toBe(-50000000) // 실제 구현에서는 음수를 그대로 계산
    })

    it('음수 비율을 올바르게 처리해야 함', () => {
      const result = calculateBudgetAllocation(100000000, -30)
      expect(result).toBe(-30000000) // 실제 구현에서는 음수를 그대로 계산
    })

    it('100% 초과 비율을 올바르게 처리해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 150)
      // 100,000,000 * 150% = 150,000,000
      expect(result).toBe(150000000)
    })

    it('NaN 값을 올바르게 처리해야 함', () => {
      const result1 = calculateBudgetAllocation(NaN, 50)
      const result2 = calculateBudgetAllocation(100000000, NaN)
      const result3 = calculateBudgetAllocation(NaN, NaN)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
      expect(result3).toBe(0)
    })

    it('null 값을 올바르게 처리해야 함', () => {
      const result1 = calculateBudgetAllocation(null as any, 50)
      const result2 = calculateBudgetAllocation(100000000, null as any)
      const result3 = calculateBudgetAllocation(null as any, null as any)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
      expect(result3).toBe(0)
    })

    it('undefined 값을 올바르게 처리해야 함', () => {
      const result1 = calculateBudgetAllocation(undefined as any, 50)
      const result2 = calculateBudgetAllocation(100000000, undefined as any)
      const result3 = calculateBudgetAllocation(undefined as any, undefined as any)
      
      expect(result1).toBe(0)
      expect(result2).toBe(0)
      expect(result3).toBe(0)
    })

    it('매우 작은 비율을 올바르게 처리해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 0.1)
      // 100,000,000 * 0.1% = 100,000
      expect(result).toBe(100000)
    })

    it('매우 큰 비율을 올바르게 처리해야 함', () => {
      const result = calculateBudgetAllocation(100000000, 999999)
      // 100,000,000 * 999,999% = 999,999,000,000
      expect(result).toBe(999999000000)
    })
  })

  describe('normalizeSalaryAmount', () => {
    it('정상적인 금액을 정수로 변환해야 함', () => {
      const result = normalizeSalaryAmount(1234567.89)
      expect(result).toBe(1234567)
    })

    it('정수 금액을 그대로 반환해야 함', () => {
      const result = normalizeSalaryAmount(1234567)
      expect(result).toBe(1234567)
    })

    it('0을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(0)
      expect(result).toBe(0)
    })

    it('음수를 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(-1234567.89)
      expect(result).toBe(-1234568) // 실제 구현에서는 음수를 그대로 버림 처리
    })

    it('NaN 값을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(NaN)
      expect(result).toBe(0)
    })

    it('null 값을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(null as any)
      expect(result).toBe(0)
    })

    it('undefined 값을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(undefined as any)
      expect(result).toBe(0)
    })

    it('매우 큰 금액을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(999999999999.99)
      expect(result).toBe(999999999999)
    })

    it('매우 작은 금액을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(0.99)
      expect(result).toBe(0)
    })

    it('무한대 값을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(Infinity)
      expect(result).toBe(Infinity)
    })

    it('음의 무한대 값을 올바르게 처리해야 함', () => {
      const result = normalizeSalaryAmount(-Infinity)
      expect(result).toBe(-Infinity) // 실제 구현에서는 -Infinity를 그대로 반환
    })
  })

  describe('Integration tests', () => {
    it('급여 계산 전체 워크플로우가 올바르게 작동해야 함', () => {
      // 1. 연봉 6천만원, 참여율 80%인 직원의 월급 계산
      const annualSalary = 60000000
      const participationRate = 80
      
      const monthlySalary = calculateMonthlySalary(annualSalary, participationRate)
      expect(monthlySalary).toBe(4000000) // 60,000,000 * 80% / 12 = 4,000,000
      
      // 2. 정규화 확인
      const normalizedSalary = normalizeSalaryAmount(monthlySalary)
      expect(normalizedSalary).toBe(4000000)
      
      // 3. 전체 연봉 기준 월급과 비교
      const fullTimeMonthly = calculateMonthlyFromAnnual(annualSalary)
      expect(fullTimeMonthly).toBe(5000000) // 60,000,000 / 12 = 5,000,000
    })

    it('예산 배분과 급여 계산이 일관되게 작동해야 함', () => {
      const totalBudget = 120000000 // 1억 2천만원
      
      // 인건비 60% 배분
      const personnelBudget = calculateBudgetAllocation(totalBudget, 60)
      expect(personnelBudget).toBe(72000000)
      
      // 인건비를 2명의 직원에게 50:50 배분
      const employee1Salary = calculateBudgetAllocation(personnelBudget, 50)
      const employee2Salary = calculateBudgetAllocation(personnelBudget, 50)
      
      expect(employee1Salary).toBe(36000000)
      expect(employee2Salary).toBe(36000000)
      
      // 각 직원의 월급 계산 (참여율 100%)
      const employee1Monthly = calculateMonthlySalary(employee1Salary, 100)
      const employee2Monthly = calculateMonthlySalary(employee2Salary, 100)
      
      expect(employee1Monthly).toBe(3000000) // 36,000,000 / 12 = 3,000,000
      expect(employee2Monthly).toBe(3000000)
    })

    it('복잡한 시나리오를 올바르게 처리해야 함', () => {
      // 프로젝트 예산 5억원
      const projectBudget = 500000000
      
      // 인건비 40%, 재료비 30%, 기타 30% 배분
      const personnelBudget = calculateBudgetAllocation(projectBudget, 40)
      const materialBudget = calculateBudgetAllocation(projectBudget, 30)
      const otherBudget = calculateBudgetAllocation(projectBudget, 30)
      
      expect(personnelBudget).toBe(200000000) // 5억 * 40% = 2억
      expect(materialBudget).toBe(150000000) // 5억 * 30% = 1.5억
      expect(otherBudget).toBe(150000000)    // 5억 * 30% = 1.5억
      
      // 인건비를 3명의 직원에게 40%, 35%, 25% 배분
      const salary1 = calculateBudgetAllocation(personnelBudget, 40)
      const salary2 = calculateBudgetAllocation(personnelBudget, 35)
      const salary3 = calculateBudgetAllocation(personnelBudget, 25)
      
      expect(salary1).toBe(80000000)  // 2억 * 40% = 8천만
      expect(salary2).toBe(70000000)  // 2억 * 35% = 7천만
      expect(salary3).toBe(50000000)  // 2억 * 25% = 5천만
      
      // 각 직원의 월급 계산 (참여율 100%)
      const monthly1 = calculateMonthlySalary(salary1, 100)
      const monthly2 = calculateMonthlySalary(salary2, 100)
      const monthly3 = calculateMonthlySalary(salary3, 100)
      
      expect(monthly1).toBe(6666666) // 80,000,000 / 12 = 6,666,666.666... → 6,666,666
      expect(monthly2).toBe(5833333) // 70,000,000 / 12 = 5,833,333.333... → 5,833,333
      expect(monthly3).toBe(4166666) // 50,000,000 / 12 = 4,166,666.666... → 4,166,666
    })

    it('엣지 케이스들이 올바르게 처리되어야 함', () => {
      // 매우 작은 금액들
      expect(calculateMonthlySalary(1000, 1)).toBe(0) // 1000 * 1% / 12 = 0.083... → 0
      expect(calculateBudgetAllocation(1000, 0.1)).toBe(1) // 1000 * 0.1% = 1
      
      // 매우 큰 금액들
      expect(calculateMonthlySalary(10000000000, 100)).toBe(833333333) // 100억 / 12
      expect(calculateBudgetAllocation(10000000000, 50)).toBe(5000000000) // 100억 * 50%
      
      // 소수점이 많이 발생하는 경우
      expect(calculateMonthlySalary(1000000, 33.333333)).toBe(27777) // 1,000,000 * 33.333333% / 12 = 27,777.777... → 27,777
      expect(calculateBudgetAllocation(1000000, 33.333333)).toBe(333333) // 1,000,000 * 33.333333% = 333,333.333... → 333,333
    })
  })
})
