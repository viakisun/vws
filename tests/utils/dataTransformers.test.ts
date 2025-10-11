import { describe, expect, it } from 'vitest'
import {
  extractCashAmount,
  extractInKindAmount,
  safeNumberToString,
  safeStringToNumber,
  calculateMemberContribution,
  distributeMemberAmount,
  transformBudgetToCategories,
  filterNonZeroCategories,
  extractApiData,
  extractApiArrayData,
  extractNestedData,
  groupIssuesByMember,
  type BudgetCategory,
  type ApiResponse,
  type ValidationIssue,
} from '$lib/components/research-development/utils/dataTransformers'

describe('Data Transformers', () => {
  describe('extractCashAmount', () => {
    it('should extract snake_case field', () => {
      expect(extractCashAmount({ cash_amount: 1000000 })).toBe('1000000')
    })

    it('should extract camelCase field', () => {
      expect(extractCashAmount({ cashAmount: 500000 })).toBe('500000')
    })

    it('should prefer snake_case over camelCase', () => {
      expect(extractCashAmount({ cash_amount: 1000000, cashAmount: 500000 })).toBe('1000000')
    })

    it('should return "0" for empty object', () => {
      expect(extractCashAmount({})).toBe('0')
    })

    it('should return "0" for undefined values', () => {
      expect(extractCashAmount({ cash_amount: undefined })).toBe('0')
    })
  })

  describe('extractInKindAmount', () => {
    it('should extract snake_case field', () => {
      expect(extractInKindAmount({ in_kind_amount: 500000 })).toBe('500000')
    })

    it('should extract camelCase field', () => {
      expect(extractInKindAmount({ inKindAmount: 300000 })).toBe('300000')
    })

    it('should prefer snake_case over camelCase', () => {
      expect(extractInKindAmount({ in_kind_amount: 500000, inKindAmount: 300000 })).toBe('500000')
    })

    it('should return "0" for empty object', () => {
      expect(extractInKindAmount({})).toBe('0')
    })
  })

  describe('safeNumberToString', () => {
    it('should convert number to string', () => {
      expect(safeNumberToString(1000000)).toBe('1000000')
      expect(safeNumberToString(0)).toBe('0')
      expect(safeNumberToString(-500)).toBe('-500')
    })

    it('should convert numeric string to string', () => {
      expect(safeNumberToString('500000')).toBe('500000')
    })

    it('should return default for undefined', () => {
      expect(safeNumberToString(undefined)).toBe('0')
      expect(safeNumberToString(undefined, 'N/A')).toBe('N/A')
    })

    it('should return default for null', () => {
      expect(safeNumberToString(null)).toBe('0')
      expect(safeNumberToString(null, 'N/A')).toBe('N/A')
    })

    it('should return default for NaN', () => {
      expect(safeNumberToString(NaN)).toBe('0')
      expect(safeNumberToString('invalid', 'error')).toBe('error')
    })

    it('should handle floating point numbers', () => {
      expect(safeNumberToString(123.45)).toBe('123.45')
      expect(safeNumberToString('123.45')).toBe('123.45')
    })
  })

  describe('safeStringToNumber', () => {
    it('should convert string to number', () => {
      expect(safeStringToNumber('1000000')).toBe(1000000)
      expect(safeStringToNumber('0')).toBe(0)
      expect(safeStringToNumber('-500')).toBe(-500)
    })

    it('should return number as is', () => {
      expect(safeStringToNumber(500000)).toBe(500000)
    })

    it('should return default for undefined', () => {
      expect(safeStringToNumber(undefined)).toBe(0)
      expect(safeStringToNumber(undefined, 100)).toBe(100)
    })

    it('should return default for null', () => {
      expect(safeStringToNumber(null)).toBe(0)
      expect(safeStringToNumber(null, -1)).toBe(-1)
    })

    it('should return default for invalid string', () => {
      expect(safeStringToNumber('invalid')).toBe(0)
      expect(safeStringToNumber('abc', 999)).toBe(999)
    })

    it('should handle floating point strings', () => {
      expect(safeStringToNumber('123.45')).toBe(123.45)
    })
  })

  describe('calculateMemberContribution', () => {
    it('should calculate contribution correctly', () => {
      // 월급여 5,000,000원, 참여율 30%, 12개월 = 18,000,000원
      expect(calculateMemberContribution(5000000, 30, 12)).toBe(18000000)
    })

    it('should handle string inputs', () => {
      expect(calculateMemberContribution('5000000', '30', '12')).toBe(18000000)
    })

    it('should handle mixed inputs', () => {
      expect(calculateMemberContribution(5000000, '30', 12)).toBe(18000000)
    })

    it('should round to nearest integer', () => {
      // 월급여 5,555,555원, 참여율 33%, 10개월
      const result = calculateMemberContribution(5555555, 33, 10)
      expect(result).toBe(Math.round((5555555 * 33 * 10) / 100))
    })

    it('should return 0 for zero salary', () => {
      expect(calculateMemberContribution(0, 30, 12)).toBe(0)
    })

    it('should return 0 for zero rate', () => {
      expect(calculateMemberContribution(5000000, 0, 12)).toBe(0)
    })

    it('should return 0 for zero months', () => {
      expect(calculateMemberContribution(5000000, 30, 0)).toBe(0)
    })

    it('should return 0 for invalid inputs', () => {
      expect(calculateMemberContribution('invalid', 30, 12)).toBe(0)
      expect(calculateMemberContribution(5000000, 'invalid', 12)).toBe(0)
      expect(calculateMemberContribution(5000000, 30, 'invalid')).toBe(0)
    })

    it('should handle realistic scenarios', () => {
      // 연구원: 월급여 4,000,000원, 참여율 25%, 24개월
      expect(calculateMemberContribution(4000000, 25, 24)).toBe(24000000)

      // 책임연구원: 월급여 6,000,000원, 참여율 50%, 18개월
      expect(calculateMemberContribution(6000000, 50, 18)).toBe(54000000)

      // 연구보조원: 월급여 2,500,000원, 참여율 15%, 12개월
      expect(calculateMemberContribution(2500000, 15, 12)).toBe(4500000)
    })
  })

  describe('distributeMemberAmount', () => {
    it('should assign to cash when cash exists', () => {
      const result = distributeMemberAmount(10000000, 5000000, 0)
      expect(result).toEqual({
        cashAmount: '10000000',
        inKindAmount: '0',
      })
    })

    it('should assign to in-kind when in-kind exists', () => {
      const result = distributeMemberAmount(10000000, 0, 5000000)
      expect(result).toEqual({
        cashAmount: '0',
        inKindAmount: '10000000',
      })
    })

    it('should prefer cash when both exist', () => {
      const result = distributeMemberAmount(10000000, 5000000, 3000000)
      expect(result).toEqual({
        cashAmount: '10000000',
        inKindAmount: '0',
      })
    })

    it('should default to cash when both are zero', () => {
      const result = distributeMemberAmount(10000000, 0, 0)
      expect(result).toEqual({
        cashAmount: '10000000',
        inKindAmount: '0',
      })
    })

    it('should handle string inputs', () => {
      const result = distributeMemberAmount(10000000, '5000000', '0')
      expect(result).toEqual({
        cashAmount: '10000000',
        inKindAmount: '0',
      })
    })

    it('should handle mixed inputs', () => {
      const result = distributeMemberAmount(10000000, 0, '3000000')
      expect(result).toEqual({
        cashAmount: '0',
        inKindAmount: '10000000',
      })
    })
  })

  describe('transformBudgetToCategories', () => {
    it('should transform budget object to categories array', () => {
      const budget = {
        personnel_cost: 50000000,
        personnel_cost_in_kind: 10000000,
        research_material_cost: 20000000,
        research_material_cost_in_kind: 5000000,
        research_activity_cost: 15000000,
        research_activity_cost_in_kind: 0,
        research_stipend: 10000000,
        research_stipend_in_kind: 0,
        indirect_cost: 5000000,
        indirect_cost_in_kind: 0,
      }

      const categories = transformBudgetToCategories(budget)

      expect(categories).toHaveLength(5)
      expect(categories[0]).toEqual({
        id: 'personnel',
        type: 'personnel',
        name: '인건비',
        cash: 50000000,
        inKind: 10000000,
      })
      expect(categories[1]).toEqual({
        id: 'material',
        type: 'material',
        name: '연구재료비',
        cash: 20000000,
        inKind: 5000000,
      })
    })

    it('should handle missing fields with defaults', () => {
      const budget = {}
      const categories = transformBudgetToCategories(budget)

      expect(categories).toHaveLength(5)
      categories.forEach((category) => {
        expect(category.cash).toBe(0)
        expect(category.inKind).toBe(0)
      })
    })
  })

  describe('filterNonZeroCategories', () => {
    it('should filter out zero categories', () => {
      const categories: BudgetCategory[] = [
        { id: 'personnel', type: 'personnel', name: '인건비', cash: 50000000, inKind: 10000000 },
        { id: 'material', type: 'material', name: '연구재료비', cash: 0, inKind: 0 },
        { id: 'activity', type: 'activity', name: '연구활동비', cash: 15000000, inKind: 0 },
      ]

      const filtered = filterNonZeroCategories(categories)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('personnel')
      expect(filtered[1].id).toBe('activity')
    })

    it('should keep categories with only cash', () => {
      const categories: BudgetCategory[] = [
        { id: 'personnel', type: 'personnel', name: '인건비', cash: 50000000, inKind: 0 },
      ]

      const filtered = filterNonZeroCategories(categories)
      expect(filtered).toHaveLength(1)
    })

    it('should keep categories with only in-kind', () => {
      const categories: BudgetCategory[] = [
        { id: 'material', type: 'material', name: '연구재료비', cash: 0, inKind: 5000000 },
      ]

      const filtered = filterNonZeroCategories(categories)
      expect(filtered).toHaveLength(1)
    })

    it('should return empty array for all-zero categories', () => {
      const categories: BudgetCategory[] = [
        { id: 'personnel', type: 'personnel', name: '인건비', cash: 0, inKind: 0 },
        { id: 'material', type: 'material', name: '연구재료비', cash: 0, inKind: 0 },
      ]

      const filtered = filterNonZeroCategories(categories)
      expect(filtered).toHaveLength(0)
    })
  })

  describe('extractApiData', () => {
    it('should extract data from successful response', () => {
      const response: ApiResponse<{ id: number; name: string }> = {
        success: true,
        data: { id: 1, name: 'Test' },
      }

      const result = extractApiData(response, { id: 0, name: '' })
      expect(result).toEqual({ id: 1, name: 'Test' })
    })

    it('should return default for failed response', () => {
      const response: ApiResponse<{ id: number; name: string }> = {
        success: false,
        error: 'Error occurred',
      }

      const result = extractApiData(response, { id: 0, name: 'default' })
      expect(result).toEqual({ id: 0, name: 'default' })
    })

    it('should return default when data is missing', () => {
      const response: ApiResponse<{ id: number }> = {
        success: true,
      }

      const result = extractApiData(response, { id: 999 })
      expect(result).toEqual({ id: 999 })
    })
  })

  describe('extractApiArrayData', () => {
    it('should extract array from successful response', () => {
      const response: ApiResponse<string[]> = {
        success: true,
        data: ['item1', 'item2', 'item3'],
      }

      const result = extractApiArrayData(response)
      expect(result).toEqual(['item1', 'item2', 'item3'])
    })

    it('should return empty array for failed response', () => {
      const response: ApiResponse<string[]> = {
        success: false,
        error: 'Error occurred',
      }

      const result = extractApiArrayData(response)
      expect(result).toEqual([])
    })
  })

  describe('extractNestedData', () => {
    it('should extract nested data', () => {
      const obj = {
        data: {
          validation: {
            issues: ['issue1', 'issue2'],
          },
        },
      }

      const result = extractNestedData(obj, ['data', 'validation', 'issues'], [])
      expect(result).toEqual(['issue1', 'issue2'])
    })

    it('should return default for missing path', () => {
      const obj = {
        data: {
          validation: {},
        },
      }

      const result = extractNestedData(obj, ['data', 'validation', 'issues'], ['default'])
      expect(result).toEqual(['default'])
    })

    it('should handle empty path', () => {
      const obj = { value: 123 }
      const result = extractNestedData(obj, [], { value: 0 })
      expect(result).toEqual({ value: 123 })
    })
  })

  describe('groupIssuesByMember', () => {
    it('should group issues by member', () => {
      const issues: ValidationIssue[] = [
        { memberId: 'm1', field: 'salary', severity: 'error', message: 'Invalid salary' },
        { memberId: 'm1', field: 'rate', severity: 'warning', message: 'Low rate' },
        { memberId: 'm2', field: 'months', severity: 'error', message: 'Invalid months' },
      ]

      const members = [
        { id: 'm1', employee_name: 'Member 1' },
        { id: 'm2', employee_name: 'Member 2' },
        { id: 'm3', employee_name: 'Member 3' },
      ]

      const result = groupIssuesByMember(issues, members)

      expect(result).toHaveLength(3)

      expect(result[0]).toEqual({
        memberId: 'm1',
        name: 'Member 1',
        errorCount: 1,
        warningCount: 1,
        status: 'error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        issues: expect.arrayContaining([
          expect.objectContaining({ field: 'salary' }),
          expect.objectContaining({ field: 'rate' }),
        ]),
      })

      expect(result[1]).toEqual({
        memberId: 'm2',
        name: 'Member 2',
        errorCount: 1,
        warningCount: 0,
        status: 'error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        issues: expect.arrayContaining([expect.objectContaining({ field: 'months' })]),
      })

      expect(result[2]).toEqual({
        memberId: 'm3',
        name: 'Member 3',
        errorCount: 0,
        warningCount: 0,
        status: 'valid',
        issues: [],
      })
    })

    it('should handle members with no issues', () => {
      const issues: ValidationIssue[] = []
      const members = [{ id: 'm1', name: 'Member 1' }]

      const result = groupIssuesByMember(issues, members)

      expect(result[0]).toEqual({
        memberId: 'm1',
        name: 'Member 1',
        errorCount: 0,
        warningCount: 0,
        status: 'valid',
        issues: [],
      })
    })

    it('should prefer employee_name over name', () => {
      const issues: ValidationIssue[] = []
      const members = [{ id: 'm1', employee_name: 'Emp Name', name: 'Other Name' }]

      const result = groupIssuesByMember(issues, members)
      expect(result[0].name).toBe('Emp Name')
    })
  })
})
