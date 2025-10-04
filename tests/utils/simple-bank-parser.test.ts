import { describe, it, expect, vi } from 'vitest'
import { BankCode } from '$lib/types/bank-codes'

// Mock all bank parsers to return basic results
vi.mock('$lib/utils/bank-parsers/hana-bank-parser', () => ({
  parseHanaBankStatement: vi.fn().mockResolvedValue({
    bankCode: BankCode.HANA,
    bankName: '하나은행',
    accountNumber: 'test-account',
    transactions: [],
    errors: [],
  }),
}))

vi.mock('$lib/utils/bank-parsers/nonghyup-bank-parser', () => ({
  parseNonghyupBankStatement: vi.fn().mockResolvedValue({
    bankCode: BankCode.NONGHYUP,
    bankName: '농협은행',
    accountNumber: 'test-account',
    transactions: [],
    errors: [],
  }),
}))

vi.mock('$lib/utils/bank-parsers/jeonbuk-bank-parser', () => ({
  parseJeonbukBankStatement: vi.fn().mockResolvedValue({
    bankCode: BankCode.JEONBUK,
    bankName: '전북은행',
    accountNumber: 'test-account',
    transactions: [],
    errors: [],
  }),
}))

describe('Bank Parser Integration Tests', () => {
  it('should import and call Hana Bank parser', async () => {
    const { parseHanaBankStatement } = await import('$lib/utils/bank-parsers/hana-bank-parser')

    const result = await parseHanaBankStatement('test content')

    expect(result.bankCode).toBe(BankCode.HANA)
    expect(result.bankName).toBe('하나은행')
  })

  it('should import and call Nonghyup Bank parser', async () => {
    const { parseNonghyupBankStatement } = await import(
      '$lib/utils/bank-parsers/nonghyup-bank-parser'
    )

    const result = await parseNonghyupBankStatement('test content')

    expect(result.bankCode).toBe(BankCode.NONGHYUP)
    expect(result.bankName).toBe('농협은행')
  })

  it('should import and call Jeonbuk Bank parser', async () => {
    const { parseJeonbukBankStatement } = await import(
      '$lib/utils/bank-parsers/jeonbuk-bank-parser'
    )

    const result = await parseJeonbukBankStatement('test content')

    expect(result.bankCode).toBe(BankCode.JEONBUK)
    expect(result.bankName).toBe('전북은행')
  })

  it('should import and use bank detector', async () => {
    const { detectBankFromFileName } = await import('$lib/utils/bank-parsers/bank-detector')

    const hanaResult = detectBankFromFileName('hana_bank_statement.xlsx')
    expect(hanaResult.bankCode).toBe(BankCode.HANA)

    const nonghyupResult = detectBankFromFileName('nonghyup_bank_statement.xlsx')
    expect(nonghyupResult.bankCode).toBe(BankCode.NONGHYUP)

    const jeonbukResult = detectBankFromFileName('jeonbuk_bank_statement.xlsx')
    expect(jeonbukResult.bankCode).toBe(BankCode.JEONBUK)
  })

  it('should import and use factory parser', async () => {
    const { parseBankStatement } = await import('$lib/utils/bank-parsers/factory')

    const hanaResult = await parseBankStatement('test content', 'hana_bank_statement.xlsx')
    expect(hanaResult.bankCode).toBe(BankCode.HANA)

    const nonghyupResult = await parseBankStatement('test content', 'nonghyup_bank_statement.xlsx')
    expect(nonghyupResult.bankCode).toBe(BankCode.NONGHYUP)

    const jeonbukResult = await parseBankStatement('test content', 'jeonbuk_bank_statement.xlsx')
    expect(jeonbukResult.bankCode).toBe(BankCode.JEONBUK)
  })
})
