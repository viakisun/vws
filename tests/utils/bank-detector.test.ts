import { describe, it, expect } from 'vitest'
import { detectBankFromFileName } from '$lib/utils/bank-parsers/bank-detector'
import { BankCode } from '$lib/types/bank-codes'

describe('Bank Detector', () => {
  describe('detectBankFromFileName', () => {
    it('should detect Hana Bank from filename', () => {
      const testCases = [
        'hana_bank_statement.xlsx',
        'HANA_BANK_STATEMENT.xlsx',
        '하나은행_거래내역.xlsx',
        '하나은행_2024_01.xlsx',
        'hana_statement_2024.xlsx',
        '하나은행_계좌내역.xlsx',
      ]

      testCases.forEach((fileName) => {
        const result = detectBankFromFileName(fileName)
        expect(result.bankCode).toBe(BankCode.HANA)
        expect(result.bankName).toBe('하나은행')
      })
    })

    it('should detect Nonghyup Bank from filename', () => {
      const testCases = [
        'nonghyup_bank_statement.xlsx',
        'NONGHYUP_BANK_STATEMENT.xlsx',
        '농협은행_거래내역.xlsx',
        '농협은행_2024_01.xlsx',
        'nonghyup_statement_2024.xlsx',
        '농협_계좌내역.xlsx',
      ]

      testCases.forEach((fileName) => {
        const result = detectBankFromFileName(fileName)
        expect(result.bankCode).toBe(BankCode.NONGHYUP)
        expect(result.bankName).toBe('농협은행')
      })
    })

    it('should detect Jeonbuk Bank from filename', () => {
      const testCases = [
        'jeonbuk_bank_statement.xlsx',
        'JEONBUK_BANK_STATEMENT.xlsx',
        '전북은행_거래내역.xlsx',
        '전북은행_2024_01.xlsx',
        'jeonbuk_statement_2024.xlsx',
        '전북_계좌내역.xlsx',
      ]

      testCases.forEach((fileName) => {
        const result = detectBankFromFileName(fileName)
        expect(result.bankCode).toBe(BankCode.JEONBUK)
        expect(result.bankName).toBe('전북은행')
      })
    })

    it('should return null for unsupported banks', () => {
      const testCases = [
        'kb_bank_statement.xlsx',
        '신한은행_거래내역.xlsx',
        '우리은행_2024_01.xlsx',
        'unknown_bank.xlsx',
        'generic_statement.xlsx',
      ]

      testCases.forEach((fileName) => {
        const result = detectBankFromFileName(fileName)
        expect(result.bankCode).toBeNull()
        expect(result.bankName).toBe('알 수 없음')
      })
    })

    it('should handle empty or invalid filenames', () => {
      const testCases = ['', '   ', 'file_without_extension', '.xlsx', 'just_extension.xlsx']

      testCases.forEach((fileName) => {
        const result = detectBankFromFileName(fileName)
        expect(result.bankCode).toBeNull()
        expect(result.bankName).toBe('알 수 없음')
      })
    })

    it('should prioritize first matching bank in filename', () => {
      // If filename contains multiple bank names, should detect the first one
      const result = detectBankFromFileName('hana_nonghyup_statement.xlsx')
      expect(result.bankCode).toBe(BankCode.HANA)
      expect(result.bankName).toBe('하나은행')
    })

    it('should handle mixed case and special characters', () => {
      const testCases = [
        'Hana-Bank_Statement_2024.xlsx',
        '농협은행_거래내역(2024년).xlsx',
        '전북은행_계좌내역_01월.xlsx',
        'hana_bank_statement_2024_01_15.xlsx',
      ]

      const expectedBanks = [BankCode.HANA, BankCode.NONGHYUP, BankCode.JEONBUK, BankCode.HANA]

      testCases.forEach((fileName, index) => {
        const result = detectBankFromFileName(fileName)
        expect(result.bankCode).toBe(expectedBanks[index])
      })
    })
  })
})
