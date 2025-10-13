import { env } from '$env/dynamic/private'
import type { BankAccountData } from '../bank-account-parser'
import type { BusinessRegistrationData } from '../business-registration-parser'
import { convertToBase64Image } from '../utils/pdf-to-image'
import type { OCRStrategy } from './OCRStrategy'

/**
 * OpenAI GPT-4 Vision을 사용하는 OCR Strategy
 * JSON Schema strict mode를 사용하여 구조화된 데이터 추출
 */
export class OpenAIVisionOCRStrategy implements OCRStrategy {
  private openai: any

  constructor() {
    // Don't initialize OpenAI in constructor to avoid build-time errors
    // Lazy initialization will happen when methods are called
  }

  private async initializeOpenAI() {
    if (!this.openai) {
      const { default: OpenAI } = await import('openai')
      const apiKey = env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
      }
      this.openai = new OpenAI({
        apiKey,
      })
    }
  }

  /**
   * 사업자등록증에서 정보 추출
   */
  async extractBusinessRegistration(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<BusinessRegistrationData> {
    await this.initializeOpenAI()

    try {
      // 파일을 Base64로 인코딩
      const { base64, mimeType: imageMimeType } = await convertToBase64Image(fileBuffer, mimeType)

      // OpenAI Vision API 호출
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              '너는 한국어 사업자등록증에서 항목을 추출하는 전문가다. 스키마에 맞는 JSON만 출력한다.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '다음 사업자등록증 이미지에서 항목을 추출해. 불확실하면 null로 표시. 숫자/날짜는 포맷 엄수. confidence는 전체 추출의 확신도(0-1)를 나타냄.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'BusinessRegistration',
            schema: this.getBusinessRegistrationSchema(),
            strict: true,
          },
        },
        temperature: 0,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('OpenAI Vision API 응답이 비어있습니다')
      }

      const extracted = JSON.parse(content)

      console.log('[OpenAIVisionOCRStrategy] Business registration extracted:', {
        companyName: extracted.company_name,
        businessNumber: extracted.business_registration_number,
        confidence: extracted.confidence,
      })

      // 기존 인터페이스에 맞게 변환
      return this.mapToBusinessRegistrationData(extracted)
    } catch (error) {
      console.error('[OpenAIVisionOCRStrategy] Business registration extraction failed:', error)
      throw new Error(
        `OpenAI Vision 사업자등록증 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  /**
   * 통장사본에서 계좌 정보 추출
   */
  async extractBankAccount(fileBuffer: Buffer, mimeType: string): Promise<BankAccountData> {
    await this.initializeOpenAI()

    try {
      // 파일을 Base64로 인코딩
      const { base64, mimeType: imageMimeType } = await convertToBase64Image(fileBuffer, mimeType)

      // OpenAI Vision API 호출
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              '너는 한국어 통장사본에서 계좌 정보를 추출하는 전문가다. 스키마에 맞는 JSON만 출력한다.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '다음 통장사본 이미지에서 은행명, 계좌번호, 예금주를 추출해. 불확실하면 null. confidence는 전체 추출의 확신도(0-1)를 나타냄.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'BankAccount',
            schema: this.getBankAccountSchema(),
            strict: true,
          },
        },
        temperature: 0,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('OpenAI Vision API 응답이 비어있습니다')
      }

      const extracted = JSON.parse(content)

      console.log('[OpenAIVisionOCRStrategy] Bank account extracted:', {
        bankName: extracted.bank_name,
        accountNumber: extracted.account_number,
        confidence: extracted.confidence,
      })

      // 기존 인터페이스에 맞게 변환
      return this.mapToBankAccountData(extracted)
    } catch (error) {
      console.error('[OpenAIVisionOCRStrategy] Bank account extraction failed:', error)
      throw new Error(
        `OpenAI Vision 통장사본 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  /**
   * 사업자등록증 JSON Schema 정의
   * OpenAI Structured Outputs strict mode 호환
   */
  private getBusinessRegistrationSchema() {
    return {
      type: 'object',
      properties: {
        business_registration_number: {
          type: 'string',
          description: '사업자등록번호 (000-00-00000 형식, 없으면 빈 문자열)',
        },
        company_name: {
          type: 'string',
          description: '상호/법인명 (없으면 빈 문자열)',
        },
        representative: {
          type: 'string',
          description: '대표자명 (없으면 빈 문자열)',
        },
        opening_date: {
          type: 'string',
          description: '개업일자 (YYYY-MM-DD 형식, 없으면 빈 문자열)',
        },
        address: {
          type: 'string',
          description: '사업장 소재지 (없으면 빈 문자열)',
        },
        business_type: {
          type: 'string',
          description: '업태 (없으면 빈 문자열)',
        },
        business_item: {
          type: 'string',
          description: '종목 (없으면 빈 문자열)',
        },
        corporation_status: {
          type: 'boolean',
          description: '법인 여부 (불확실하면 false)',
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: '추출 확신도 (0-1)',
        },
      },
      required: [
        'business_registration_number',
        'company_name',
        'representative',
        'opening_date',
        'address',
        'business_type',
        'business_item',
        'corporation_status',
        'confidence',
      ],
      additionalProperties: false,
    }
  }

  /**
   * 통장사본 JSON Schema 정의
   * OpenAI Structured Outputs strict mode 호환
   */
  private getBankAccountSchema() {
    return {
      type: 'object',
      properties: {
        bank_name: {
          type: 'string',
          description: '은행명 (없으면 빈 문자열)',
        },
        account_number: {
          type: 'string',
          description: '계좌번호 (없으면 빈 문자열)',
        },
        account_holder: {
          type: 'string',
          description: '예금주명 (없으면 빈 문자열)',
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: '추출 확신도 (0-1)',
        },
      },
      required: ['bank_name', 'account_number', 'account_holder', 'confidence'],
      additionalProperties: false,
    }
  }

  /**
   * OpenAI 응답을 BusinessRegistrationData로 변환
   * 빈 문자열은 null로 변환
   */
  private mapToBusinessRegistrationData(data: any): BusinessRegistrationData {
    const emptyToNull = (value: string | undefined | null) => {
      if (!value || value.trim() === '') return null
      return value
    }

    return {
      companyName: emptyToNull(data.company_name),
      businessNumber: emptyToNull(data.business_registration_number),
      representativeName: emptyToNull(data.representative),
      businessAddress: emptyToNull(data.address),
      businessType: emptyToNull(data.business_type),
      businessCategory: emptyToNull(data.business_item),
      establishmentDate: emptyToNull(data.opening_date),
      isCorporation: data.corporation_status ?? false,
      confidence: (data.confidence ?? 0) * 100, // 0-1 -> 0-100
      rawText: JSON.stringify(data),
    }
  }

  /**
   * OpenAI 응답을 BankAccountData로 변환
   * 빈 문자열은 null로 변환
   */
  private mapToBankAccountData(data: any): BankAccountData {
    const emptyToNull = (value: string | undefined | null) => {
      if (!value || value.trim() === '') return null
      return value
    }

    return {
      bankName: emptyToNull(data.bank_name),
      accountNumber: emptyToNull(data.account_number),
      accountHolder: emptyToNull(data.account_holder),
      confidence: (data.confidence ?? 0) * 100, // 0-1 -> 0-100
      rawText: JSON.stringify(data),
    }
  }
}
