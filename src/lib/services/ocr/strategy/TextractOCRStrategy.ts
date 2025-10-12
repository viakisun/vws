import { parseBankAccount, type BankAccountData } from '../bank-account-parser'
import {
  parseBusinessRegistration,
  type BusinessRegistrationData,
} from '../business-registration-parser'
import { detectDocumentText } from '../textract-client'
import type { OCRStrategy } from './OCRStrategy'

/**
 * AWS Textract를 사용하는 OCR Strategy
 * 기존 Textract 기반 구현을 Strategy 패턴으로 래핑
 */
export class TextractOCRStrategy implements OCRStrategy {
  /**
   * 사업자등록증에서 정보 추출
   */
  async extractBusinessRegistration(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<BusinessRegistrationData> {
    try {
      // PDF인 경우 첫 페이지만 추출
      let documentBytes = fileBuffer
      if (mimeType === 'application/pdf') {
        documentBytes = await this.extractFirstPageFromPDF(fileBuffer)
      }

      // Textract로 텍스트 추출
      const textractResult = await detectDocumentText(documentBytes)

      // 사업자등록증 파싱
      const businessData = parseBusinessRegistration(textractResult)

      console.log('[TextractOCRStrategy] Business registration extracted:', {
        companyName: businessData.companyName,
        businessNumber: businessData.businessNumber,
        confidence: businessData.confidence,
      })

      return businessData
    } catch (error) {
      console.error('[TextractOCRStrategy] Business registration extraction failed:', error)
      throw new Error(
        `Textract 사업자등록증 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  /**
   * 통장사본에서 계좌 정보 추출
   */
  async extractBankAccount(fileBuffer: Buffer, mimeType: string): Promise<BankAccountData> {
    try {
      // PDF인 경우 첫 페이지만 추출
      let documentBytes = fileBuffer
      if (mimeType === 'application/pdf') {
        documentBytes = await this.extractFirstPageFromPDF(fileBuffer)
      }

      // Textract로 텍스트 추출
      const textractResult = await detectDocumentText(documentBytes)

      // 통장사본 파싱
      const bankData = parseBankAccount(textractResult)

      console.log('[TextractOCRStrategy] Bank account extracted:', {
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        confidence: bankData.confidence,
      })

      return bankData
    } catch (error) {
      console.error('[TextractOCRStrategy] Bank account extraction failed:', error)
      throw new Error(
        `Textract 통장사본 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      )
    }
  }

  /**
   * PDF 첫 페이지만 추출 (Textract는 단일 페이지만 처리)
   */
  private async extractFirstPageFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pageCount = pdfDoc.getPageCount()

      if (pageCount === 1) {
        return pdfBuffer
      }

      // 첫 페이지만 추출
      const newPdfDoc = await PDFDocument.create()
      const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0])
      newPdfDoc.addPage(firstPage)

      const newPdfBytes = await newPdfDoc.save()
      return Buffer.from(newPdfBytes)
    } catch (error) {
      console.error('[TextractOCRStrategy] PDF extraction failed:', error)
      // 실패 시 원본 반환
      return pdfBuffer
    }
  }
}
