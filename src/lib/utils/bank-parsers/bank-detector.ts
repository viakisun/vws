import { BankCodeUtils } from '$lib/types/bank-codes'
import type { BankDetectionResult } from './types'

/**
 * 파일명에서 은행 정보를 감지
 */
export function detectBankFromFileName(fileName: string): BankDetectionResult {
  const bankCode = BankCodeUtils.estimateBankCodeFromFileName(fileName)

  if (bankCode) {
    return {
      bankCode,
      bankName: BankCodeUtils.getBankName(bankCode),
      confidence: 'high',
    }
  }

  // 알 수 없는 은행
  return {
    bankCode: null,
    bankName: '알 수 없음',
    confidence: 'low',
  }
}

/**
 * 계좌번호에서 은행 코드 추출
 */
export function detectBankFromAccountNumber(accountNumber: string): BankDetectionResult {
  const bankCode = BankCodeUtils.estimateBankCodeFromAccountNumber(accountNumber)

  if (bankCode) {
    return {
      bankCode,
      bankName: BankCodeUtils.getBankName(bankCode),
      confidence: 'high',
    }
  }

  return {
    bankCode: null,
    bankName: '알 수 없음',
    confidence: 'low',
  }
}
