/**
 * PDF를 이미지로 변환하는 유틸리티
 * OpenAI Vision API는 PDF를 직접 지원하지 않으므로 PNG로 변환 필요
 */

/**
 * PDF 또는 이미지를 Base64로 인코딩
 * PDF인 경우 첫 페이지만 PNG로 변환
 *
 * @param fileBuffer 파일 버퍼
 * @param mimeType 파일 MIME 타입
 * @returns Base64 인코딩된 이미지 문자열과 MIME 타입
 */
export async function convertToBase64Image(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<{ base64: string; mimeType: string }> {
  // 이미 이미지인 경우 그대로 Base64 인코딩
  if (mimeType.startsWith('image/')) {
    return {
      base64: fileBuffer.toString('base64'),
      mimeType,
    }
  }

  // PDF인 경우 첫 페이지를 PNG로 변환
  if (mimeType === 'application/pdf') {
    const pngBuffer = await convertPdfToImage(fileBuffer)
    return {
      base64: pngBuffer.toString('base64'),
      mimeType: 'image/png',
    }
  }

  // 지원하지 않는 형식
  throw new Error(`지원하지 않는 파일 형식: ${mimeType}`)
}

/**
 * PDF 첫 페이지를 PNG 이미지로 변환
 * 시스템에 설치된 poppler의 pdftocairo를 사용
 *
 * @param pdfBuffer PDF 파일 버퍼
 * @returns PNG 이미지 버퍼
 */
async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')
    const { execFile } = await import('child_process')
    const { promisify } = await import('util')
    const execFileAsync = promisify(execFile)

    // 임시 파일 생성
    const tempDir = os.tmpdir()
    const tempPdfPath = path.join(tempDir, `ocr-${Date.now()}.pdf`)
    const tempPngPath = path.join(tempDir, `ocr-${Date.now()}.png`)

    // PDF 파일 저장
    fs.writeFileSync(tempPdfPath, pdfBuffer)

    try {
      // pdftocairo를 사용하여 PDF를 PNG로 변환 (첫 페이지만, 고해상도)
      await execFileAsync('pdftocairo', [
        '-png', // PNG 형식
        '-f',
        '1', // 첫 페이지부터
        '-l',
        '1', // 첫 페이지까지
        '-singlefile', // 단일 파일로 출력
        '-scale-to',
        '2048', // 고해상도 (2048px)
        tempPdfPath,
        tempPngPath.replace('.png', ''), // 확장자 제외 (pdftocairo가 자동으로 .png 추가)
      ])

      // 변환된 PNG 파일 읽기
      const pngBuffer = fs.readFileSync(tempPngPath)

      // 임시 파일 정리
      try {
        fs.unlinkSync(tempPdfPath)
        fs.unlinkSync(tempPngPath)
      } catch (cleanupError) {
        console.warn('[PDF to Image] Cleanup failed:', cleanupError)
      }

      console.log('[PDF to Image] Successfully converted PDF to PNG')
      return pngBuffer
    } catch (conversionError) {
      // 변환 실패 시 임시 파일 정리
      try {
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath)
        if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath)
      } catch (_cleanupError) {
        // Ignore cleanup errors
      }
      throw conversionError
    }
  } catch (error) {
    console.error('[PDF to Image] Conversion failed:', error)
    throw new Error(`PDF 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

/**
 * 파일 MIME 타입 검증
 *
 * @param mimeType MIME 타입
 * @returns 지원 여부
 */
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  return supportedTypes.includes(mimeType)
}
