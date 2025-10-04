import { describe, it, expect, vi } from 'vitest'
import { BankCode } from '$lib/types/bank-codes'

// Mock bank parsers
const mockHanaResult = {
  bankCode: BankCode.HANA,
  bankName: '하나은행',
  accountNumber: '123456789',
  transactions: [
    {
      id: '1',
      description: 'Test transaction',
      deposits: 1000,
      withdrawals: 0,
      balance: 1000,
      transactionDate: '2024-01-01T00:00:00Z',
      counterparty: 'Test Counterparty',
      categoryId: null,
      accountId: 'account-1',
    },
  ],
  errors: [],
}

const mockNonghyupResult = {
  bankCode: BankCode.NONGHYUP,
  bankName: '농협은행',
  accountNumber: '987654321',
  transactions: [
    {
      id: '2',
      description: 'Test Nonghyup transaction',
      deposits: 2000,
      withdrawals: 0,
      balance: 2000,
      transactionDate: '2024-01-02T00:00:00Z',
      counterparty: 'Test Nonghyup Counterparty',
      categoryId: null,
      accountId: 'account-2',
    },
  ],
  errors: [],
}

const mockJeonbukResult = {
  bankCode: BankCode.JEONBUK,
  bankName: '전북은행',
  accountNumber: '555666777',
  transactions: [
    {
      id: '3',
      description: 'Test Jeonbuk transaction',
      deposits: 3000,
      withdrawals: 0,
      balance: 3000,
      transactionDate: '2024-01-03T00:00:00Z',
      counterparty: 'Test Jeonbuk Counterparty',
      categoryId: null,
      accountId: 'account-3',
    },
  ],
  errors: [],
}

vi.mock('$lib/utils/bank-parsers/hana-bank-parser', () => ({
  parseHanaBankStatement: vi.fn().mockResolvedValue(mockHanaResult),
}))

vi.mock('$lib/utils/bank-parsers/nonghyup-bank-parser', () => ({
  parseNonghyupBankStatement: vi.fn().mockResolvedValue(mockNonghyupResult),
}))

vi.mock('$lib/utils/bank-parsers/jeonbuk-bank-parser', () => ({
  parseJeonbukBankStatement: vi.fn().mockResolvedValue(mockJeonbukResult),
}))

describe('Bank Parser Factory', () => {
  it('should parse Hana Bank file correctly', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')
    const content = 'mock hana bank content'
    const fileName = 'hana_bank_statement.xlsx'

    const result = await parseBankStatement(content, fileName)

    expect(result.bankCode).toBe(BankCode.HANA)
    expect(result.bankName).toBe('하나은행')
    expect(result.accountNumber).toBe('123456789')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].description).toBe('Test transaction')
  })

  it('should parse Nonghyup Bank file correctly', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')
    const content = 'mock nonghyup bank content'
    const fileName = 'nonghyup_bank_statement.xlsx'

    const result = await parseBankStatement(content, fileName)

    expect(result.bankCode).toBe(BankCode.NONGHYUP)
    expect(result.bankName).toBe('농협은행')
    expect(result.accountNumber).toBe('987654321')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].description).toBe('Test Nonghyup transaction')
  })

  it('should parse Jeonbuk Bank file correctly', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')
    const content = 'mock jeonbuk bank content'
    const fileName = 'jeonbuk_bank_statement.xlsx'

    const result = await parseBankStatement(content, fileName)

    expect(result.bankCode).toBe(BankCode.JEONBUK)
    expect(result.bankName).toBe('전북은행')
    expect(result.accountNumber).toBe('555666777')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].description).toBe('Test Jeonbuk transaction')
  })

  it('should handle unsupported bank files', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')
    const content = 'mock unsupported bank content'
    const fileName = 'unsupported_bank_statement.xlsx'

    const result = await parseBankStatement(content, fileName)

    expect(result.bankCode).toBe(BankCode.HANA) // Default fallback
    expect(result.bankName).toBe('알 수 없음')
    expect(result.accountNumber).toBe('unknown')
    expect(result.transactions).toHaveLength(0)
    expect(result.errors).toContain(
      '지원하지 않는 은행 파일 형식입니다. 파일명에 "하나", "농협", "전북"이 포함되어야 합니다.',
    )
  })

  it('should handle files with bank names in different cases', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')
    const content = 'mock hana bank content'
    const fileName = 'HANA_BANK_STATEMENT.xlsx' // Uppercase

    const result = await parseBankStatement(content, fileName)

    expect(result.bankCode).toBe(BankCode.HANA)
    expect(result.bankName).toBe('하나은행')
  })

  it('should handle files with partial bank names', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')
    const content = 'mock nonghyup bank content'
    const fileName = 'nonghyup_statement_2024.xlsx' // Contains 'nonghyup'

    const result = await parseBankStatement(content, fileName)

    expect(result.bankCode).toBe(BankCode.NONGHYUP)
    expect(result.bankName).toBe('농협은행')
  })
})
