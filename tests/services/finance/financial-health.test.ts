import { FinancialHealthAnalyzer } from '$lib/finance/services/analysis/financial-health'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DBHelper } from '../../helpers/db-helper'
import { mockLogger } from '../../helpers/mock-helper'

describe('Financial Health Analyzer', () => {
  let analyzer: FinancialHealthAnalyzer

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger()
    DBHelper.reset()
    analyzer = new FinancialHealthAnalyzer()
  })

  describe('analyzeFinancialHealth', () => {
    it('전체 재무 건강도를 성공적으로 분석해야 함', async () => {
      // Mock database responses
      DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
        rows: [{ total: '5000000' }],
      })

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
        {
          rows: [{ total: '2000000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
        {
          rows: [{ total: '1500000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
        {
          rows: [{ count: '3' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
        {
          rows: [{ count: '100' }],
        },
      )

      DBHelper.mockQueryResponse(
        'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
        {
          rows: [{ total_budgets: '5', compliance_rate: '0.85' }],
        },
      )

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
        rows: [{ count: '1' }],
      })

      // Mock trend analysis
      DBHelper.mockQueryResponse(
        "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
        {
          rows: [{ income: '1800000', expense: '1200000', transaction_count: '80' }],
        },
      )

      const result = await analyzer.analyzeFinancialHealth()

      expect(result.overallScore).toBeGreaterThan(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.categories.liquidity).toBeGreaterThan(0)
      expect(result.categories.profitability).toBeGreaterThan(0)
      expect(result.categories.stability).toBeGreaterThan(0)
      expect(result.categories.growth).toBeGreaterThan(0)
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.riskFactors).toBeInstanceOf(Array)
      expect(result.trends).toBeDefined()
      expect(result.trends.direction).toMatch(/^(improving|stable|declining)$/)
    })

    it('빈 데이터로 재무 건강도를 분석해야 함', async () => {
      // Mock empty database responses
      DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
        rows: [{ total: '0' }],
      })

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
        {
          rows: [{ total: '0' }],
        },
      )

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
        {
          rows: [{ total: '0' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
        {
          rows: [{ count: '0' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
        {
          rows: [{ count: '0' }],
        },
      )

      DBHelper.mockQueryResponse(
        'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
        {
          rows: [{ total_budgets: '0', compliance_rate: '0' }],
        },
      )

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
        rows: [{ count: '0' }],
      })

      // Mock trend analysis
      DBHelper.mockQueryResponse(
        "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
        {
          rows: [{ income: '0', expense: '0', transaction_count: '0' }],
        },
      )

      const result = await analyzer.analyzeFinancialHealth()

      expect(result.overallScore).toBe(0)
      expect(result.categories.liquidity).toBe(0)
      expect(result.categories.profitability).toBe(0)
      expect(result.categories.stability).toBe(0)
      expect(result.categories.growth).toBe(0)
      expect(result.recommendations).toContain('데이터 분석에 실패했습니다.')
      expect(result.riskFactors).toContain('시스템 오류가 발생했습니다.')
    })

    it('데이터베이스 오류 시 기본값을 반환해야 함', async () => {
      DBHelper.mockError(new Error('Database connection failed'))

      const result = await analyzer.analyzeFinancialHealth()

      expect(result.overallScore).toBe(0)
      expect(result.categories.liquidity).toBe(0)
      expect(result.categories.profitability).toBe(0)
      expect(result.categories.stability).toBe(0)
      expect(result.categories.growth).toBe(0)
      expect(result.recommendations).toContain('데이터 분석에 실패했습니다.')
      expect(result.riskFactors).toContain('시스템 오류가 발생했습니다.')
      expect(result.trends.direction).toBe('stable')
      expect(result.trends.period).toBe('N/A')
    })

    it('높은 유동성을 가진 재무 상태를 올바르게 분석해야 함', async () => {
      // Mock high liquidity data
      DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
        rows: [{ total: '20000000' }], // 2천만원
      })

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
        {
          rows: [{ total: '5000000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
        {
          rows: [{ total: '1000000' }], // 월 지출 100만원
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
        {
          rows: [{ count: '5' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
        {
          rows: [{ count: '200' }],
        },
      )

      DBHelper.mockQueryResponse(
        'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
        {
          rows: [{ total_budgets: '10', compliance_rate: '0.95' }],
        },
      )

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
        rows: [{ count: '0' }],
      })

      // Mock trend analysis
      DBHelper.mockQueryResponse(
        "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
        {
          rows: [{ income: '4500000', expense: '900000', transaction_count: '150' }],
        },
      )

      const result = await analyzer.analyzeFinancialHealth()

      expect(result.categories.liquidity).toBe(100) // 20개월 분 지출
      expect(result.categories.profitability).toBe(100) // 80% 수익률
      expect(result.categories.stability).toBeGreaterThan(80) // 높은 안정성
      expect(result.categories.growth).toBeGreaterThan(80) // 높은 성장성
      expect(result.overallScore).toBeGreaterThan(80)
      expect(result.recommendations).toContain(
        '우수한 유동성 상태입니다. 투자 기회를 고려해보세요.',
      )
      expect(result.recommendations).toContain('수익성이 우수합니다. 사업 확장을 검토해보세요.')
    })

    it('낮은 유동성을 가진 재무 상태를 올바르게 분석해야 함', async () => {
      // Mock low liquidity data
      DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
        rows: [{ total: '500000' }], // 50만원
      })

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
        {
          rows: [{ total: '2000000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
        {
          rows: [{ total: '2500000' }], // 월 지출 250만원 (수입보다 많음)
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
        {
          rows: [{ count: '1' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
        {
          rows: [{ count: '10' }],
        },
      )

      DBHelper.mockQueryResponse(
        'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
        {
          rows: [{ total_budgets: '1', compliance_rate: '0.3' }],
        },
      )

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
        rows: [{ count: '3' }],
      })

      // Mock trend analysis
      DBHelper.mockQueryResponse(
        "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
        {
          rows: [{ income: '1800000', expense: '2200000', transaction_count: '5' }],
        },
      )

      const result = await analyzer.analyzeFinancialHealth()

      expect(result.categories.liquidity).toBe(20) // 0.2개월 분 지출
      expect(result.categories.profitability).toBe(20) // -25% 수익률
      expect(result.categories.stability).toBeLessThan(40) // 낮은 안정성
      expect(result.categories.growth).toBeLessThan(40) // 낮은 성장성
      expect(result.overallScore).toBeLessThan(40)
      expect(result.recommendations).toContain('비상 자금을 확보하여 유동성을 개선하세요.')
      expect(result.recommendations).toContain('수입 증대 또는 지출 절감 방안을 검토하세요.')
      expect(result.recommendations).toContain('예산 관리 시스템을 강화하고 계좌를 다양화하세요.')
      expect(result.recommendations).toContain('사업 확장이나 투자 기회를 검토하세요.')
      expect(result.riskFactors).toContain('유동성 부족 위험')
      expect(result.riskFactors).toContain('수익성 저하 위험')
      expect(result.riskFactors).toContain('현금 부족 위험')
      expect(result.riskFactors).toContain('지속적 손실 위험')
    })

    it('중간 수준의 재무 상태를 올바르게 분석해야 함', async () => {
      // Mock medium-level data
      DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
        rows: [{ total: '3000000' }], // 300만원
      })

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
        {
          rows: [{ total: '2000000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
        {
          rows: [{ total: '1800000' }], // 월 지출 180만원
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
        {
          rows: [{ count: '3' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
        {
          rows: [{ count: '50' }],
        },
      )

      DBHelper.mockQueryResponse(
        'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
        {
          rows: [{ total_budgets: '5', compliance_rate: '0.75' }],
        },
      )

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
        rows: [{ count: '1' }],
      })

      // Mock trend analysis
      DBHelper.mockQueryResponse(
        "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
        {
          rows: [{ income: '1900000', expense: '1700000', transaction_count: '40' }],
        },
      )

      const result = await analyzer.analyzeFinancialHealth()

      expect(result.categories.liquidity).toBe(60) // 1.67개월 분 지출
      expect(result.categories.profitability).toBe(60) // 10% 수익률
      expect(result.categories.stability).toBeGreaterThan(50) // 중간 안정성
      expect(result.categories.growth).toBeGreaterThan(50) // 중간 성장성
      expect(result.overallScore).toBeGreaterThan(50)
      expect(result.overallScore).toBeLessThan(80)
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.riskFactors).toBeInstanceOf(Array)
    })
  })

  describe('Integration tests', () => {
    it('전체 재무 건강도 분석 워크플로우가 올바르게 작동해야 함', async () => {
      // Mock comprehensive data
      DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
        rows: [{ total: '8000000' }],
      })

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
        {
          rows: [{ total: '3000000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
        {
          rows: [{ total: '2000000' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
        {
          rows: [{ count: '4' }],
        },
      )

      DBHelper.mockQueryResponse(
        "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
        {
          rows: [{ count: '150' }],
        },
      )

      DBHelper.mockQueryResponse(
        'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
        {
          rows: [{ total_budgets: '8', compliance_rate: '0.88' }],
        },
      )

      DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
        rows: [{ count: '1' }],
      })

      // Mock trend analysis
      DBHelper.mockQueryResponse(
        "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
        {
          rows: [{ income: '2800000', expense: '1900000', transaction_count: '120' }],
        },
      )

      const result = await analyzer.analyzeFinancialHealth()

      // Verify overall structure
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('categories')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('riskFactors')
      expect(result).toHaveProperty('trends')

      // Verify categories structure
      expect(result.categories).toHaveProperty('liquidity')
      expect(result.categories).toHaveProperty('profitability')
      expect(result.categories).toHaveProperty('stability')
      expect(result.categories).toHaveProperty('growth')

      // Verify trends structure
      expect(result.trends).toHaveProperty('score')
      expect(result.trends).toHaveProperty('direction')
      expect(result.trends).toHaveProperty('period')

      // Verify data types
      expect(typeof result.overallScore).toBe('number')
      expect(typeof result.categories.liquidity).toBe('number')
      expect(typeof result.categories.profitability).toBe('number')
      expect(typeof result.categories.stability).toBe('number')
      expect(typeof result.categories.growth).toBe('number')
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(Array.isArray(result.riskFactors)).toBe(true)
      expect(typeof result.trends.score).toBe('number')
      expect(typeof result.trends.direction).toBe('string')
      expect(typeof result.trends.period).toBe('string')

      // Verify score ranges
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.categories.liquidity).toBeGreaterThanOrEqual(0)
      expect(result.categories.liquidity).toBeLessThanOrEqual(100)
      expect(result.categories.profitability).toBeGreaterThanOrEqual(0)
      expect(result.categories.profitability).toBeLessThanOrEqual(100)
      expect(result.categories.stability).toBeGreaterThanOrEqual(0)
      expect(result.categories.stability).toBeLessThanOrEqual(100)
      expect(result.categories.growth).toBeGreaterThanOrEqual(0)
      expect(result.categories.growth).toBeLessThanOrEqual(100)
    })

    it('다양한 재무 시나리오를 올바르게 분석해야 함', async () => {
      const scenarios = [
        {
          name: '신생 기업',
          balance: 1000000,
          income: 500000,
          expense: 800000,
          accounts: 1,
          transactions: 20,
          budgets: 2,
          compliance: 0.4,
          loans: 2,
          expectedLiquidity: 20,
          expectedProfitability: 20,
        },
        {
          name: '성장 기업',
          balance: 5000000,
          income: 2000000,
          expense: 1500000,
          accounts: 3,
          transactions: 80,
          budgets: 6,
          compliance: 0.8,
          loans: 1,
          expectedLiquidity: 80,
          expectedProfitability: 80,
        },
        {
          name: '대기업',
          balance: 50000000,
          income: 10000000,
          expense: 8000000,
          accounts: 8,
          transactions: 500,
          budgets: 15,
          compliance: 0.95,
          loans: 0,
          expectedLiquidity: 100,
          expectedProfitability: 100,
        },
      ]

      for (const scenario of scenarios) {
        DBHelper.reset()

        DBHelper.mockQueryResponse('SUM(balance) as total FROM finance_accounts', {
          rows: [{ total: scenario.balance.toString() }],
        })

        DBHelper.mockQueryResponse(
          "SUM(amount) as total FROM finance_transactions WHERE type = 'income'",
          {
            rows: [{ total: scenario.income.toString() }],
          },
        )

        DBHelper.mockQueryResponse(
          "SUM(amount) as total FROM finance_transactions WHERE type = 'expense'",
          {
            rows: [{ total: scenario.expense.toString() }],
          },
        )

        DBHelper.mockQueryResponse(
          "COUNT(*) as count FROM finance_accounts WHERE status = 'active'",
          {
            rows: [{ count: scenario.accounts.toString() }],
          },
        )

        DBHelper.mockQueryResponse(
          "COUNT(*) as count FROM finance_transactions WHERE status = 'completed'",
          {
            rows: [{ count: scenario.transactions.toString() }],
          },
        )

        DBHelper.mockQueryResponse(
          'COUNT(*) as total_budgets, AVG(CASE WHEN actual_amount <= planned_amount THEN 1.0 ELSE 0.0 END) as compliance_rate FROM finance_budgets',
          {
            rows: [
              {
                total_budgets: scenario.budgets.toString(),
                compliance_rate: scenario.compliance.toString(),
              },
            ],
          },
        )

        DBHelper.mockQueryResponse('SELECT COUNT(*) as count FROM finance_loans', {
          rows: [{ count: scenario.loans.toString() }],
        })

        // Mock trend analysis
        DBHelper.mockQueryResponse(
          "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense, COUNT(*) as transaction_count FROM finance_transactions",
          {
            rows: [
              {
                income: (scenario.income * 0.9).toString(),
                expense: (scenario.expense * 0.9).toString(),
                transaction_count: (scenario.transactions * 0.8).toString(),
              },
            ],
          },
        )

        const result = await analyzer.analyzeFinancialHealth()

        expect(result.categories.liquidity).toBe(scenario.expectedLiquidity)
        expect(result.categories.profitability).toBe(scenario.expectedProfitability)
        expect(result.overallScore).toBeGreaterThan(0)
        expect(result.recommendations.length).toBeGreaterThan(0)
        expect(result.riskFactors.length).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
