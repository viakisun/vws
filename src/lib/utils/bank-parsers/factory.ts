import { BankCode } from '$lib/types/bank-codes'
import { detectBankFromFileName } from './bank-detector'
import { parseHanaBankStatement } from './hana-bank-parser'
import { parseJeonbukBankStatement } from './jeonbuk-bank-parser'
import { parseNonghyupBankStatement } from './nonghyup-bank-parser'
import type { BankStatementParseResult } from './types'

/**
 * 은행 파일 파싱 팩토리
 * 파일명을 기반으로 적절한 파서를 선택하여 파싱 수행
 */
export function parseBankStatement(content: string, fileName: string): BankStatementParseResult {
  const detection = detectBankFromFileName(fileName)

  if (!detection.bankCode) {
    return {
      bankCode: BankCode.HANA, // 기본값
      bankName: '알 수 없음',
      accountNumber: 'unknown',
      transactions: [],
      errors: [
        '지원하지 않는 은행 파일 형식입니다. 파일명에 "하나", "농협", "전북"이 포함되어야 합니다.',
      ],
    }
  }

  switch (detection.bankCode) {
    case BankCode.HANA:
      return parseHanaBankStatement(content)

    case BankCode.NONGHYUP:
      return parseNonghyupBankStatement(content)

    case BankCode.JEONBUK:
      return parseJeonbukBankStatement(content)

    default:
      return {
        bankCode: BankCode.HANA, // 기본값
        bankName: '알 수 없음',
        accountNumber: 'unknown',
        transactions: [],
        errors: ['지원하지 않는 은행 코드입니다.'],
      }
  }
}
