import { UserService } from '$lib/auth/user-service'
import {
  OCRService,
  type BankAccountData,
  type BusinessRegistrationData,
  type OCREngine,
} from '$lib/services/ocr'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * OCR 처리 API
 * POST: 파일 업로드하여 OCR 실행
 * Query parameters:
 *  - engine: OCR 엔진 선택 (openai | textract), 기본값: openai
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
  try {
    // 인증 확인
    const token = cookies.get('auth_token')
    console.log('[OCR API] Token exists:', !!token)

    if (!token) {
      console.log('[OCR API] No token found in cookies')
      return json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userService = UserService.getInstance()
    const payload = userService.verifyToken(token)
    const user = await userService.getUserById(payload.userId)
    console.log('[OCR API] User verified:', !!user, user?.id)

    if (!user) {
      console.log('[OCR API] Token verification failed')
      return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    // OCR 엔진 선택 (선택 사항)
    const engineParam = url.searchParams.get('engine')?.toLowerCase()
    const engine: OCREngine =
      engineParam === 'textract' || engineParam === 'openai' ? engineParam : 'openai'

    // OCR 서비스 인스턴스 생성 (선택한 엔진으로)
    const ocrService = new OCRService(engine)

    // FormData에서 파일 및 문서 타입 가져오기
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string

    if (!file) {
      return json({ error: '파일이 필요합니다' }, { status: 400 })
    }

    if (!documentType || !['business-registration', 'bank-account'].includes(documentType)) {
      return json({ error: '유효하지 않은 문서 타입입니다' }, { status: 400 })
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return json({ error: '파일 크기는 5MB 이하여야 합니다' }, { status: 400 })
    }

    // 파일 타입 검증
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return json(
        { error: '지원하지 않는 파일 형식입니다. PDF, JPG, PNG만 가능합니다.' },
        { status: 400 },
      )
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // 문서 타입에 따라 OCR 처리
    let result: BusinessRegistrationData | BankAccountData

    if (documentType === 'business-registration') {
      result = await ocrService.processBusinessRegistration(fileBuffer, file.type)
    } else {
      result = await ocrService.processBankAccount(fileBuffer, file.type)
    }

    return json({
      success: true,
      documentType,
      engine: ocrService.getCurrentEngine(),
      data: result,
    })
  } catch (error) {
    console.error('OCR API error:', error)
    return json(
      {
        error: 'OCR 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    )
  }
}
