import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { generatePresignedDownloadUrl } from '$lib/services/s3/s3-service'
import type { DocumentDownloadResponse } from '$lib/types/document.types'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * GET: 다운로드 URL 생성
 */
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event)
    const { id: evidenceId, docId } = event.params

    // 문서 조회
    const result = await query(
      `
      SELECT id, evidence_item_id, file_path, document_name as file_name
      FROM evidence_documents
      WHERE id = $1 AND evidence_item_id = $2
    `,
      [docId, evidenceId],
    )

    if (result.rows.length === 0) {
      return json(
        {
          success: false,
          error: '문서를 찾을 수 없습니다.',
        } as ApiResponse<never>,
        { status: 404 },
      )
    }

    const document = result.rows[0] as { file_path: string; file_name: string }

    // Presigned Download URL 생성
    const downloadUrl = await generatePresignedDownloadUrl(document.file_path, 300) // 5분

    logger.log('Download URL generated', {
      evidenceId,
      docId,
      fileName: document.file_name,
    })

    const response: ApiResponse<DocumentDownloadResponse> = {
      success: true,
      data: {
        downloadUrl,
        fileName: document.file_name,
        expiresIn: 300,
      },
    }

    return json(response)
  } catch (error) {
    logger.error('Failed to generate download URL:', error)
    return json(
      {
        success: false,
        error: '다운로드 URL 생성에 실패했습니다.',
      } as ApiResponse<never>,
      { status: 500 },
    )
  }
}
