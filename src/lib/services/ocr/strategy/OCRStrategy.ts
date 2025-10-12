import type { BankAccountData } from '../bank-account-parser'
import type { BusinessRegistrationData } from '../business-registration-parser'

/**
 * OCR 엔진 전략 인터페이스
 * 다양한 OCR 엔진(Textract, OpenAI Vision, Naver CLOVA 등)을 동일한 인터페이스로 추상화
 */
export interface OCRStrategy {
  /**
   * 사업자등록증에서 정보 추출
   * @param fileBuffer 파일 버퍼
   * @param mimeType 파일 MIME 타입
   * @returns 추출된 사업자등록증 데이터
   */
  extractBusinessRegistration(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<BusinessRegistrationData>

  /**
   * 통장사본에서 계좌 정보 추출
   * @param fileBuffer 파일 버퍼
   * @param mimeType 파일 MIME 타입
   * @returns 추출된 계좌 정보
   */
  extractBankAccount(fileBuffer: Buffer, mimeType: string): Promise<BankAccountData>
}

/**
 * 지원되는 OCR 엔진 타입
 */
export type OCREngine = 'openai' | 'textract'

/**
 * OCR 엔진 이름
 */
export const OCR_ENGINE_NAMES: Record<OCREngine, string> = {
  openai: 'OpenAI GPT-4 Vision',
  textract: 'AWS Textract',
}
