import { requireAuth } from '$lib/auth/middleware'
import { query } from '$lib/database/connection'
import type { DocumentMetadataRequest, EvidenceDocument } from '$lib/types/document.types'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * GET: 문서 목록 조회
 */
export const GET: RequestHandler = async (event) => {
  try {
    await requireAuth(event)
    const { id: evidenceId } = event.params

    const result = await query(
      `
      SELECT
        ed.id,
        ed.evidence_item_id,
        ed.document_type,
        ed.document_name as file_name,
        ed.file_path,
        ed.file_size,
        ed.status,
        ed.upload_date::text,
        ed.review_date::text,
        ed.review_notes as review_comment,
        ed.created_at::text,
        ed.updated_at::text
      FROM evidence_documents ed
      WHERE ed.evidence_item_id = $1
      ORDER BY ed.upload_date DESC
    `,
      [evidenceId],
    )

    const response: ApiResponse<EvidenceDocument[]> = {
      success: true,
      data: result.rows as EvidenceDocument[],
    }

    return json(response)
  } catch (error) {
    logger.error('Failed to fetch documents:', error)
    return json<ApiResponse<never>>(
      {
        success: false,
        error: '문서 목록 조회에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}

/**
 * POST: 문서 메타데이터 저장
 */
export const POST: RequestHandler = async (event) => {
  try {
    const { user } = await requireAuth(event)
    const { id: evidenceId } = event.params

    const body: DocumentMetadataRequest = await event.request.json()
    const { documentType, fileName, s3Key, fileSize } = body

    // 증빙 항목 존재 확인
    const evidenceCheck = await query(`SELECT id FROM evidence_items WHERE id = $1`, [evidenceId])

    if (evidenceCheck.rows.length === 0) {
      return json<ApiResponse<never>>(
        {
          success: false,
          error: '증빙 항목을 찾을 수 없습니다.',
        },
        { status: 404 },
      )
    }

    // 문서 메타데이터 저장
    // Note: 업로더 정보는 추적하지 않음
    const result = await query(
      `
      INSERT INTO evidence_documents (
        evidence_item_id,
        document_type,
        document_name,
        file_path,
        file_size,
        status,
        upload_date
      ) VALUES ($1, $2, $3, $4, $5, 'uploaded', NOW())
      RETURNING
        id,
        evidence_item_id,
        document_type,
        document_name as file_name,
        file_path,
        file_size,
        status,
        upload_date::text,
        created_at::text,
        updated_at::text
    `,
      [evidenceId, documentType, fileName, s3Key, fileSize],
    )

    logger.log('Document metadata saved', {
      evidenceId,
      documentId: result.rows[0].id,
    })

    const response: ApiResponse<EvidenceDocument> = {
      success: true,
      data: result.rows[0] as EvidenceDocument,
    }

    return json(response)
  } catch (error) {
    logger.error('Failed to save document metadata:', error)
    return json<ApiResponse<never>>(
      {
        success: false,
        error: '문서 저장에 실패했습니다.',
      },
      { status: 500 },
    )
  }
}
