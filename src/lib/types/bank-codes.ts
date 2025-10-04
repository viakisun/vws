// 은행 코드 enum
export enum BankCode {
  HANA = '1001',
  NONGHYUP = '1002',
  JEONBUK = '1003',
}

// 은행 정보 인터페이스
export interface BankInfo {
  id: string
  name: string
  bankCode: BankCode
  createdAt: string
  updatedAt: string
}

// 은행 코드 유틸리티 함수들
export class BankCodeUtils {
  // 은행 코드로 은행명 조회
  static getBankName(bankCode: BankCode): string {
    const names: Record<BankCode, string> = {
      [BankCode.HANA]: '하나은행',
      [BankCode.NONGHYUP]: '농협은행',
      [BankCode.JEONBUK]: '전북은행',
    }
    return names[bankCode] || '알 수 없음'
  }

  // 은행명으로 은행 코드 조회
  static getBankCode(bankName: string): BankCode | null {
    const codes: Record<string, BankCode> = {
      하나은행: BankCode.HANA,
      농협은행: BankCode.NONGHYUP,
      전북은행: BankCode.JEONBUK,
    }
    return codes[bankName] || null
  }

  // 계좌번호로 은행 코드 추정
  static estimateBankCodeFromAccountNumber(accountNumber: string): BankCode | null {
    const cleanAccountNumber = accountNumber.replace(/-/g, '')

    if (cleanAccountNumber.startsWith('711')) {
      return BankCode.HANA
    }

    if (cleanAccountNumber.startsWith('301')) {
      return BankCode.NONGHYUP
    }

    if (cleanAccountNumber.startsWith('037')) {
      return BankCode.JEONBUK
    }

    return null
  }

  // 파일명으로 은행 코드 추정
  static estimateBankCodeFromFileName(fileName: string): BankCode | null {
    const fileNameLower = fileName.toLowerCase()
    const cleanFileName = fileName.replace(/\s+/g, '').toLowerCase()

    // 파일명 정규화 (Unicode decomposition 처리)
    let normalizedFileName = fileName
    try {
      normalizedFileName = decodeURIComponent(encodeURIComponent(fileName))
      normalizedFileName = normalizedFileName.normalize('NFC')
      normalizedFileName = normalizedFileName.replace(/[\u1100-\u11FF\u3130-\u318F]/g, '')
    } catch (e) {
      // 정규화 실패 시 원본 파일명 사용
    }

    // 하나은행 감지
    if (
      fileNameLower.includes('hana') ||
      fileNameLower.includes('하나') ||
      normalizedFileName.includes('하나') ||
      cleanFileName.includes('hana') ||
      fileName.includes('711-')
    ) {
      return BankCode.HANA
    }

    // 농협 감지
    if (
      fileNameLower.includes('nonghyup') ||
      fileNameLower.includes('농협') ||
      normalizedFileName.includes('농협') ||
      cleanFileName.includes('nonghyup') ||
      fileName.includes('301-')
    ) {
      return BankCode.NONGHYUP
    }

    // 전북은행 감지
    if (
      fileNameLower.includes('jeonbuk') ||
      fileNameLower.includes('전북') ||
      normalizedFileName.includes('전북') ||
      cleanFileName.includes('jeonbuk') ||
      fileName.includes('037-')
    ) {
      return BankCode.JEONBUK
    }

    return null
  }

  // 모든 은행 코드 목록
  static getAllBankCodes(): BankCode[] {
    return Object.values(BankCode)
  }

  // 은행 코드 유효성 검증
  static isValidBankCode(code: string): code is BankCode {
    return Object.values(BankCode).includes(code as BankCode)
  }
}
