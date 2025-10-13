/**
 * Finance 관련 테스트 데이터 Fixtures
 */

export const FINANCE_FIXTURES = {
  /**
   * 계좌 테스트 데이터
   */
  accounts: {
    checking: {
      id: 'account-checking-123',
      name: '기업주계좌',
      account_number: '123-456-789012',
      bank_name: '국민은행',
      bank_code: '004',
      branch_name: '강남지점',
      account_type: 'checking',
      balance: 50000000,
      currency: 'KRW',
      is_active: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    savings: {
      id: 'account-savings-123',
      name: '예금계좌',
      account_number: '987-654-321098',
      bank_name: '신한은행',
      bank_code: '088',
      branch_name: '서초지점',
      account_type: 'savings',
      balance: 100000000,
      currency: 'KRW',
      is_active: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    inactive: {
      id: 'account-inactive-123',
      name: '비활성계좌',
      account_number: '555-666-777888',
      bank_name: '우리은행',
      bank_code: '020',
      branch_name: '역삼지점',
      account_type: 'checking',
      balance: 0,
      currency: 'KRW',
      is_active: false,
      company_code: 'DEFAULT',
      created_at: '2024-12-01T00:00:00.000Z',
      updated_at: '2024-12-01T00:00:00.000Z',
    },
    foreign: {
      id: 'account-foreign-123',
      name: '외화계좌',
      account_number: 'USD-123456789',
      bank_name: '하나은행',
      bank_code: '081',
      branch_name: '여의도지점',
      account_type: 'checking',
      balance: 100000,
      currency: 'USD',
      is_active: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
  },

  /**
   * 거래 테스트 데이터
   */
  transactions: {
    income: {
      id: 'transaction-income-123',
      account_id: 'account-checking-123',
      amount: 10000000,
      type: 'income',
      category: 'sales',
      subcategory: 'product_sales',
      description: '제품 판매 수익',
      reference_number: 'INV-2025-001',
      transaction_date: '2025-01-15',
      balance_after: 60000000,
      is_reconciled: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-15T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    expense: {
      id: 'transaction-expense-123',
      account_id: 'account-checking-123',
      amount: -5000000,
      type: 'expense',
      category: 'operating',
      subcategory: 'office_rent',
      description: '사무실 임대료',
      reference_number: 'RENT-2025-01',
      transaction_date: '2025-01-14',
      balance_after: 55000000,
      is_reconciled: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-14T00:00:00.000Z',
      updated_at: '2025-01-14T00:00:00.000Z',
    },
    transfer: {
      id: 'transaction-transfer-123',
      account_id: 'account-checking-123',
      amount: -20000000,
      type: 'transfer',
      category: 'internal_transfer',
      subcategory: 'account_transfer',
      description: '예금계좌로 이체',
      reference_number: 'TRF-2025-001',
      transaction_date: '2025-01-13',
      balance_after: 35000000,
      is_reconciled: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-13T00:00:00.000Z',
      updated_at: '2025-01-13T00:00:00.000Z',
    },
    pending: {
      id: 'transaction-pending-123',
      account_id: 'account-checking-123',
      amount: 15000000,
      type: 'income',
      category: 'sales',
      subcategory: 'service_sales',
      description: '서비스 매출 (미확인)',
      reference_number: 'SVC-2025-001',
      transaction_date: '2025-01-16',
      balance_after: null,
      is_reconciled: false,
      company_code: 'DEFAULT',
      created_at: '2025-01-16T00:00:00.000Z',
      updated_at: '2025-01-16T00:00:00.000Z',
    },
    large: {
      id: 'transaction-large-123',
      account_id: 'account-savings-123',
      amount: 50000000,
      type: 'income',
      category: 'investment',
      subcategory: 'dividend',
      description: '투자 배당금',
      reference_number: 'DIV-2025-001',
      transaction_date: '2025-01-10',
      balance_after: 150000000,
      is_reconciled: true,
      company_code: 'DEFAULT',
      created_at: '2025-01-10T00:00:00.000Z',
      updated_at: '2025-01-10T00:00:00.000Z',
    },
  },

  /**
   * 카테고리 테스트 데이터
   */
  categories: {
    income: [
      { value: 'sales', label: '매출', subcategories: ['product_sales', 'service_sales'] },
      { value: 'investment', label: '투자수익', subcategories: ['dividend', 'interest'] },
      { value: 'other_income', label: '기타수익', subcategories: ['refund', 'misc'] },
    ],
    expense: [
      { value: 'operating', label: '운영비', subcategories: ['office_rent', 'utilities', 'supplies'] },
      { value: 'personnel', label: '인건비', subcategories: ['salary', 'benefits', 'training'] },
      { value: 'marketing', label: '마케팅비', subcategories: ['advertising', 'events', 'promotion'] },
      { value: 'equipment', label: '장비비', subcategories: ['hardware', 'software', 'maintenance'] },
    ],
    transfer: [
      { value: 'internal_transfer', label: '내부이체', subcategories: ['account_transfer', 'department_transfer'] },
      { value: 'external_transfer', label: '외부이체', subcategories: ['vendor_payment', 'loan_payment'] },
    ],
  },

  /**
   * 대시보드 테스트 데이터
   */
  dashboard: {
    summary: {
      total_balance: 150000000,
      monthly_income: 25000000,
      monthly_expense: 15000000,
      net_cash_flow: 10000000,
      accounts_count: 3,
      transactions_count: 45,
      reconciled_transactions: 42,
      unreconciled_transactions: 3,
    },
    trends: {
      daily: [
        { date: '2025-01-01', income: 1000000, expense: 500000, balance: 50000000 },
        { date: '2025-01-02', income: 2000000, expense: 800000, balance: 52000000 },
        { date: '2025-01-03', income: 1500000, expense: 1200000, balance: 52300000 },
        { date: '2025-01-04', income: 3000000, expense: 900000, balance: 54400000 },
        { date: '2025-01-05', income: 2500000, expense: 1100000, balance: 55800000 },
      ],
      monthly: [
        { month: '2024-10', income: 80000000, expense: 45000000, balance: 120000000 },
        { month: '2024-11', income: 75000000, expense: 50000000, balance: 145000000 },
        { month: '2024-12', income: 90000000, expense: 55000000, balance: 180000000 },
        { month: '2025-01', income: 25000000, expense: 15000000, balance: 190000000 },
      ],
    },
    alerts: [
      {
        id: 'alert-low-balance-123',
        type: 'low_balance',
        severity: 'warning',
        message: '기업주계좌 잔액이 1,000만원 이하입니다',
        account_id: 'account-checking-123',
        threshold: 10000000,
        current_value: 35000000,
        created_at: '2025-01-15T00:00:00.000Z',
      },
      {
        id: 'alert-unreconciled-123',
        type: 'unreconciled_transactions',
        severity: 'info',
        message: '미확인 거래 3건이 있습니다',
        account_id: null,
        threshold: 5,
        current_value: 3,
        created_at: '2025-01-16T00:00:00.000Z',
      },
    ],
  },

  /**
   * 재무 건전성 분석 테스트 데이터
   */
  financialHealth: {
    liquidity: {
      current_ratio: 2.5,
      quick_ratio: 1.8,
      cash_ratio: 1.2,
      working_capital: 45000000,
      interpretation: '양호',
    },
    profitability: {
      gross_profit_margin: 0.35,
      net_profit_margin: 0.15,
      return_on_assets: 0.08,
      return_on_equity: 0.12,
      interpretation: '보통',
    },
    efficiency: {
      asset_turnover: 1.5,
      inventory_turnover: 8.2,
      receivables_turnover: 6.5,
      payables_turnover: 4.8,
      interpretation: '양호',
    },
    leverage: {
      debt_to_equity: 0.3,
      debt_to_assets: 0.23,
      interest_coverage: 5.2,
      debt_service_coverage: 3.8,
      interpretation: '안전',
    },
  },

  /**
   * 자산 예측 테스트 데이터
   */
  assetForecast: {
    scenarios: {
      optimistic: {
        name: '낙관적 시나리오',
        probability: 0.25,
        forecast: [
          { month: '2025-02', predicted_balance: 200000000 },
          { month: '2025-03', predicted_balance: 220000000 },
          { month: '2025-04', predicted_balance: 250000000 },
          { month: '2025-05', predicted_balance: 280000000 },
          { month: '2025-06', predicted_balance: 320000000 },
        ],
      },
      realistic: {
        name: '현실적 시나리오',
        probability: 0.5,
        forecast: [
          { month: '2025-02', predicted_balance: 180000000 },
          { month: '2025-03', predicted_balance: 195000000 },
          { month: '2025-04', predicted_balance: 210000000 },
          { month: '2025-05', predicted_balance: 225000000 },
          { month: '2025-06', predicted_balance: 240000000 },
        ],
      },
      pessimistic: {
        name: '비관적 시나리오',
        probability: 0.25,
        forecast: [
          { month: '2025-02', predicted_balance: 160000000 },
          { month: '2025-03', predicted_balance: 170000000 },
          { month: '2025-04', predicted_balance: 175000000 },
          { month: '2025-05', predicted_balance: 180000000 },
          { month: '2025-06', predicted_balance: 185000000 },
        ],
      },
    },
    confidence_interval: {
      lower_bound: 0.15,
      upper_bound: 0.85,
    },
  },

  /**
   * 보고서 테스트 데이터
   */
  reports: {
    cashFlow: {
      period: '2025-01',
      operating_activities: {
        net_income: 10000000,
        depreciation: 2000000,
        accounts_receivable_change: -3000000,
        accounts_payable_change: 1500000,
        net_operating_cash_flow: 10500000,
      },
      investing_activities: {
        equipment_purchase: -5000000,
        investment_sale: 8000000,
        net_investing_cash_flow: 3000000,
      },
      financing_activities: {
        loan_proceeds: 10000000,
        loan_repayment: -2000000,
        dividend_payment: -1000000,
        net_financing_cash_flow: 7000000,
      },
      net_cash_change: 20500000,
      beginning_cash: 150000000,
      ending_cash: 170500000,
    },
    profitLoss: {
      period: '2025-01',
      revenue: 50000000,
      cost_of_goods_sold: 20000000,
      gross_profit: 30000000,
      operating_expenses: 15000000,
      operating_income: 15000000,
      other_income: 2000000,
      other_expenses: 1000000,
      income_before_tax: 16000000,
      income_tax: 4000000,
      net_income: 12000000,
    },
    balanceSheet: {
      period: '2025-01-31',
      assets: {
        current_assets: {
          cash: 170500000,
          accounts_receivable: 25000000,
          inventory: 15000000,
          other_current_assets: 5000000,
          total_current_assets: 215500000,
        },
        fixed_assets: {
          equipment: 50000000,
          accumulated_depreciation: -10000000,
          net_fixed_assets: 40000000,
        },
        total_assets: 255500000,
      },
      liabilities: {
        current_liabilities: {
          accounts_payable: 15000000,
          accrued_expenses: 8000000,
          short_term_debt: 20000000,
          total_current_liabilities: 43000000,
        },
        long_term_debt: 30000000,
        total_liabilities: 73000000,
      },
      equity: {
        paid_in_capital: 100000000,
        retained_earnings: 82550000,
        total_equity: 182550000,
      },
    },
  },

  /**
   * 에러 시나리오 테스트 데이터
   */
  errors: {
    validation: {
      missingRequired: {
        account_id: '',
        amount: null,
        type: '',
        description: '',
      },
      invalidAmount: {
        amount: 'invalid-amount',
        amount: -1000000, // 음수 금액 (수입 거래인데)
      },
      invalidDate: {
        transaction_date: 'invalid-date',
        transaction_date: '2026-01-01', // 미래 날짜
      },
    },
    businessLogic: {
      insufficientFunds: {
        account_id: 'account-checking-123',
        amount: -200000000, // 잔액보다 큰 출금
        type: 'expense',
      },
      duplicateTransaction: {
        reference_number: 'INV-2025-001', // 중복 참조번호
      },
    },
    notFound: {
      accountId: 'non-existent-account',
      transactionId: 'non-existent-transaction',
    },
  },

  /**
   * 검색 및 필터링 테스트 데이터
   */
  search: {
    queries: {
      description: '임대료',
      referenceNumber: 'INV-2025-001',
      accountName: '기업주계좌',
      category: 'operating',
    },
    filters: {
      dateRange: {
        start: '2025-01-01',
        end: '2025-01-31',
      },
      amountRange: {
        min: 1000000,
        max: 10000000,
      },
      type: ['income', 'expense'],
      category: ['operating', 'personnel'],
      account: ['account-checking-123', 'account-savings-123'],
      reconciled: true,
    },
    sortOptions: {
      transaction_date: 'desc',
      amount: 'desc',
      created_at: 'desc',
      description: 'asc',
    },
  },
} as const

/**
 * 테스트용 배열 데이터 생성 헬퍼
 */
export const createFinanceTestArrays = {
  accounts: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...FINANCE_FIXTURES.accounts.checking,
      id: `account-${i + 1}`,
      name: `테스트 계좌 ${i + 1}`,
      account_number: `123-456-78901${i}`,
      balance: 10000000 * (i + 1),
    })),

  transactions: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...FINANCE_FIXTURES.transactions.income,
      id: `transaction-${i + 1}`,
      amount: 1000000 * (i + 1),
      description: `테스트 거래 ${i + 1}`,
      reference_number: `TXN-2025-${String(i + 1).padStart(3, '0')}`,
      transaction_date: `2025-01-${String(i + 1).padStart(2, '0')}`,
    })),

  alerts: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...FINANCE_FIXTURES.dashboard.alerts[0],
      id: `alert-${i + 1}`,
      message: `테스트 알림 ${i + 1}`,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    })),
}
