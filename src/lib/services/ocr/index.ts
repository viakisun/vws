import { PDFDocument } from 'pdf-lib'
import { parseBankAccount, type BankAccountData } from './bank-account-parser'
import {
  parseBusinessRegistration,
  type BusinessRegistrationData,
} from './business-registration-parser'
import { detectDocumentText, detectDocumentTextFromS3 } from './textract-client'

/**
 * 사업자등록증 처리
 */
export async function processBusinessRegistration(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<BusinessRegistrationData> {
  try {
    // PDF인 경우 첫 페이지만 추출
    let documentBytes = fileBuffer
    if (mimeType === 'application/pdf') {
      documentBytes = await extractFirstPageFromPDF(fileBuffer)
    }

    // Textract로 텍스트 추출
    const textractResult = await detectDocumentText(documentBytes)

    // 사업자등록증 파싱
    const businessData = parseBusinessRegistration(textractResult)

    return businessData
  } catch (error) {
    console.error('processBusinessRegistration error:', error)
    throw new Error(
      `사업자등록증 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * 통장사본 처리
 */
export async function processBankAccount(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<BankAccountData> {
  try {
    // PDF인 경우 첫 페이지만 추출
    let documentBytes = fileBuffer
    if (mimeType === 'application/pdf') {
      documentBytes = await extractFirstPageFromPDF(fileBuffer)
    }

    // Textract로 텍스트 추출
    const textractResult = await detectDocumentText(documentBytes)

    // 통장사본 파싱
    const bankData = parseBankAccount(textractResult)

    return bankData
  } catch (error) {
    console.error('processBankAccount error:', error)
    throw new Error(
      `통장사본 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * S3에서 직접 사업자등록증 처리
 */
export async function processBusinessRegistrationFromS3(
  bucket: string,
  key: string,
): Promise<BusinessRegistrationData> {
  try {
    const textractResult = await detectDocumentTextFromS3(bucket, key)
    const businessData = parseBusinessRegistration(textractResult)
    return businessData
  } catch (error) {
    console.error('processBusinessRegistrationFromS3 error:', error)
    throw new Error(
      `S3 사업자등록증 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * S3에서 직접 통장사본 처리
 */
export async function processBankAccountFromS3(
  bucket: string,
  key: string,
): Promise<BankAccountData> {
  try {
    const textractResult = await detectDocumentTextFromS3(bucket, key)
    const bankData = parseBankAccount(textractResult)
    return bankData
  } catch (error) {
    console.error('processBankAccountFromS3 error:', error)
    throw new Error(
      `S3 통장사본 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    )
  }
}

/**
 * PDF 첫 페이지만 추출 (Textract는 단일 페이지만 처리)
 */
async function extractFirstPageFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
  try {
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
    console.error('extractFirstPageFromPDF error:', error)
    // 실패 시 원본 반환
    return pdfBuffer
  }
}

// Re-export types
export type { BankAccountData, BusinessRegistrationData }
