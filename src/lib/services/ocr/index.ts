import { env } from '$env/dynamic/private'
import type { BankAccountData } from './bank-account-parser'
import type { BusinessRegistrationData } from './business-registration-parser'
import { OCR_ENGINE_NAMES, type OCREngine, type OCRStrategy } from './strategy/OCRStrategy'
import { OpenAIVisionOCRStrategy } from './strategy/OpenAIVisionOCRStrategy'
import { TextractOCRStrategy } from './strategy/TextractOCRStrategy'

/**
 * OCR 서비스 Context
 * Strategy Pattern을 사용하여 여러 OCR 엔진을 동일한 인터페이스로 추상화
 */
class OCRService {
  private strategy: OCRStrategy
  private currentEngine: OCREngine

  constructor(engine?: OCREngine) {
    this.currentEngine = engine || this.getDefaultEngine()
    this.strategy = this.createStrategy(this.currentEngine)
    console.log(`[OCRService] Initialized with engine: ${OCR_ENGINE_NAMES[this.currentEngine]}`)
  }

  /**
   * 환경 변수에서 기본 OCR 엔진 가져오기
   */
  private getDefaultEngine(): OCREngine {
    const engineFromEnv = env.OCR_ENGINE?.toLowerCase()
    if (engineFromEnv === 'textract') {
      return 'textract'
    }
    // 기본값: OpenAI Vision
    return 'openai'
  }

  /**
   * OCR 엔진에 맞는 Strategy 인스턴스 생성
   */
  private createStrategy(engine: OCREngine): OCRStrategy {
    switch (engine) {
      case 'openai':
        return new OpenAIVisionOCRStrategy()
      case 'textract':
        return new TextractOCRStrategy()
      default:
        console.warn(`[OCRService] Unknown engine: ${engine}, defaulting to OpenAI Vision`)
        return new OpenAIVisionOCRStrategy()
    }
  }

  /**
   * OCR 엔진 변경 (런타임에 전환 가능)
   */
  setStrategy(engine: OCREngine): void {
    if (this.currentEngine === engine) {
      return
    }
    this.currentEngine = engine
    this.strategy = this.createStrategy(engine)
    console.log(`[OCRService] Engine switched to: ${OCR_ENGINE_NAMES[engine]}`)
  }

  /**
   * 현재 사용 중인 OCR 엔진 반환
   */
  getCurrentEngine(): OCREngine {
    return this.currentEngine
  }

  /**
   * 사업자등록증 처리
   */
  async processBusinessRegistration(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<BusinessRegistrationData> {
    console.log(
      `[OCRService] Processing business registration with ${OCR_ENGINE_NAMES[this.currentEngine]}`,
    )
    return this.strategy.extractBusinessRegistration(fileBuffer, mimeType)
  }

  /**
   * 통장사본 처리
   */
  async processBankAccount(fileBuffer: Buffer, mimeType: string): Promise<BankAccountData> {
    console.log(`[OCRService] Processing bank account with ${OCR_ENGINE_NAMES[this.currentEngine]}`)
    return this.strategy.extractBankAccount(fileBuffer, mimeType)
  }
}

// Singleton instance with default engine from env
const defaultOcrService = new OCRService()

// Export singleton instance
export const ocrService = defaultOcrService

// Export class for testing or manual engine selection
export { OCRService, type OCREngine }

// Backward compatible function exports
/**
 * 사업자등록증 처리 (기본 엔진 사용)
 */
export const processBusinessRegistration = (
  fileBuffer: Buffer,
  mimeType: string,
): Promise<BusinessRegistrationData> => {
  return defaultOcrService.processBusinessRegistration(fileBuffer, mimeType)
}

/**
 * 통장사본 처리 (기본 엔진 사용)
 */
export const processBankAccount = (
  fileBuffer: Buffer,
  mimeType: string,
): Promise<BankAccountData> => {
  return defaultOcrService.processBankAccount(fileBuffer, mimeType)
}

// Re-export types
export { OCR_ENGINE_NAMES }
export type { BankAccountData, BusinessRegistrationData }
