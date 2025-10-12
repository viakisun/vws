import { verifyToken } from '$lib/auth/middleware'
import {
  processBankAccount,
  processBusinessRegistration,
  type BankAccountData,
  type BusinessRegistrationData,
} from '$lib/services/ocr'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * OCR 처리 API
 * POST: 파일 업로드하여 OCR 실행
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // 인증 확인
    const token = cookies.get('token')
    if (!token) {
      return json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

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
      result = await processBusinessRegistration(fileBuffer, file.type)
    } else {
      result = await processBankAccount(fileBuffer, file.type)
    }

    return json({
      success: true,
      documentType,
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
