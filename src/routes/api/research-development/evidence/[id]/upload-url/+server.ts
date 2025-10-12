import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { generatePresignedUploadUrl, generateS3Key } from '$lib/services/s3/s3-service'
import type { FileUploadRequest, FileUploadResponse } from '$lib/types/document.types'
import { validateFileSize, validateFileType } from '$lib/utils/file-validation'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { id: evidenceId } = event.params

    // 요청 본문 파싱
    const body: FileUploadRequest = await event.request.json()
    const { fileName, fileSize, contentType } = body

    // 환경 변수에서 허용 파일 타입 및 최대 크기 가져오기
    const allowedTypes =
      process.env.ALLOWED_FILE_TYPES?.split(',') ||
      '.pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.hwp'.split(',')
    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10)

    // 파일 검증
    const typeError = validateFileType(fileName, allowedTypes)
    if (typeError) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: typeError.message,
        },
        { status: 400 },
      )
    }

    const sizeError = validateFileSize(fileSize, maxSizeMB)
    if (sizeError) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: sizeError.message,
        },
        { status: 400 },
      )
    }

    // 증빙 항목 존재 확인 및 프로젝트 정보 조회
    const evidenceResult = await query(
      `
      SELECT
        ei.id,
        ei.project_budget_id,
        pb.project_id,
        p.code as project_code
      FROM evidence_items ei
      INNER JOIN project_budgets pb ON ei.project_budget_id = pb.id
      INNER JOIN projects p ON pb.project_id = p.id
      WHERE ei.id = $1
    `,
      [evidenceId],
    )

    if (evidenceResult.rows.length === 0) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: '증빙 항목을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const evidence = evidenceResult.rows[0] as {
      project_code: string
    }

    // 회사 코드는 비아(주) 기본값 사용
    const companyCode = '1001'

    // S3 키 생성
    const s3Key = generateS3Key(companyCode, evidence.project_code, evidenceId, fileName)

    // Presigned URL 생성
    const uploadUrl = await generatePresignedUploadUrl(s3Key, contentType, 900) // 15분

    logger.log('Presigned upload URL generated', {
      evidenceId,
      fileName,
      s3Key,
      userId: user.id,
    })

    const response: ApiResponse<FileUploadResponse> = {
      success: true,
      data: {
        uploadUrl,
        s3Key,
        expiresIn: 900,
      },
    }

    return json(response)
  } catch (error) {
    logger.error('Failed to generate upload URL:', error)
    return json<ApiResponse<never>>(
      {
        success: false,
        error: '업로드 URL 생성에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
