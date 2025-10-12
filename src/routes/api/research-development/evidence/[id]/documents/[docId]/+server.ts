import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import { deleteFile } from '$lib/services/s3/s3-service'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * DELETE: 문서 삭제
 */
export const DELETE: RequestHandler = async (event) => {
  try {
    await requireAuth(event)
    const { id: evidenceId, docId } = event.params

    // 문서 조회
    const docResult = await query(
      `
      SELECT id, evidence_item_id, file_path, document_name as file_name
      FROM evidence_documents
      WHERE id = $1 AND evidence_item_id = $2
    `,
      [docId, evidenceId],
    )

    if (docResult.rows.length === 0) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: '문서를 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    const document = docResult.rows[0] as { file_path: string; file_name: string }

    // S3에서 파일 삭제
    try {
      await deleteFile(document.file_path)
    } catch (s3Error) {
      logger.error('Failed to delete file from S3, continuing with DB deletion:', s3Error)
      // S3 삭제 실패해도 DB 레코드는 삭제
    }

    // DB에서 문서 레코드 삭제
    await query(`DELETE FROM evidence_documents WHERE id = $1`, [docId])

    logger.log('Document deleted', {
      evidenceId,
      docId,
      fileName: document.file_name,
    })

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: docId },
    }

    return json(response)
  } catch (error) {
    logger.error('Failed to delete document:', error)
    return json<ApiResponse<never>>(
      {
        success: false,
        error: '문서 삭제에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
