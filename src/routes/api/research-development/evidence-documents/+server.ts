// 증빙 서류 API
// Evidence Documents API

import { query } from '$lib/database/connection'
import type { ApiResponse } from '$lib/types/database'
import { logger } from '$lib/utils/logger'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface EvidenceDocument {
  id: string
  evidence_item_id: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  upload_date: string
  uploader_id: string
  reviewer_id?: string
  review_date?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  evidence_item_name?: string
  uploader_name?: string
  reviewer_name?: string
}

// 증빙 서류 목록 조회
export const GET: RequestHandler = async ({ url }) => {
  try {
    const evidenceItemId = url.searchParams.get('evidenceItemId')
    const documentType = url.searchParams.get('documentType')
    const status = url.searchParams.get('status')

    let queryText = `
			SELECT
				ed.*,
				ei.name as evidence_item_name,
				uploader.first_name || ' ' || uploader.last_name as uploader_name,
				reviewer.first_name || ' ' || reviewer.last_name as reviewer_name
			FROM evidence_documents ed
			JOIN evidence_items ei ON ed.evidence_item_id = ei.id
			LEFT JOIN employees uploader ON ed.uploader_id = uploader.id
			LEFT JOIN employees reviewer ON ed.reviewer_id = reviewer.id
			WHERE 1=1
		`
    const params: unknown[] = []
    let paramCount = 0

    if (evidenceItemId) {
      paramCount++
      queryText += ` AND ed.evidence_item_id = $${paramCount}`
      params.push(evidenceItemId)
    }

    if (documentType) {
      paramCount++
      queryText += ` AND ed.document_type = $${paramCount}`
      params.push(documentType)
    }

    if (status) {
      paramCount++
      queryText += ` AND ed.status = $${paramCount}`
      params.push(status)
    }

    queryText += ` ORDER BY ed.upload_date DESC`

    const result = await query(queryText, params)
    const documents = result.rows as EvidenceDocument[]

    const response: ApiResponse<EvidenceDocument[]> = {
      success: true,
      data: documents,
      count: documents.length,
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 서류 조회 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '증빙 서류 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}

// 증빙 서류 생성 (파일 업로드 정보 저장)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = (await request.json()) as Record<string, unknown>
    const { evidenceItemId, documentType, documentName, filePath, fileSize, mimeType, uploaderId } =
      data

    // 필수 필드 검증
    if (!evidenceItemId || !documentType || !documentName) {
      const response: ApiResponse<null> = {
        success: false,
        message: '필수 필드가 누락되었습니다.',
      }
      return json(response, { status: 400 })
    }

    // 증빙 항목 존재 확인
    const itemCheck = await query('SELECT id FROM evidence_items WHERE id = $1', [evidenceItemId])
    if (itemCheck.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: '증빙 항목을 찾을 수 없습니다.',
      }
      return json(response, { status: 404 })
    }

    // 증빙 서류 생성
    const result = await query(
      `
			INSERT INTO rd_evidence_documents (
				evidence_item_id, document_type, document_name, file_path,
				file_size, mime_type, uploader_id
			) VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, evidence_item_id, document_type, document_name, file_path, file_size,
			          mime_type, upload_date::text, uploader_id, status, reviewer_id,
			          review_date::text, review_notes, created_at::text, updated_at::text
		`,
      [evidenceItemId, documentType, documentName, filePath, fileSize, mimeType, uploaderId],
    )

    const newDocumentData = result.rows as EvidenceDocument[]
    const newDocument = newDocumentData[0]

    // 생성된 서류의 상세 정보 조회
    const detailResult = await query(
      `
			SELECT
				ed.*,
				ei.name as evidence_item_name,
				uploader.first_name || ' ' || uploader.last_name as uploader_name,
				reviewer.first_name || ' ' || reviewer.last_name as reviewer_name
			FROM evidence_documents ed
			JOIN evidence_items ei ON ed.evidence_item_id = ei.id
			LEFT JOIN employees uploader ON ed.uploader_id = uploader.id
			LEFT JOIN employees reviewer ON ed.reviewer_id = reviewer.id
			WHERE ed.id = $1
		`,
      [newDocument.id],
    )
    const documentDetail = detailResult.rows as EvidenceDocument[]

    const response: ApiResponse<EvidenceDocument> = {
      success: true,
      data: documentDetail[0],
      message: '증빙 서류가 성공적으로 등록되었습니다.',
    }
    return json(response)
  } catch (error: unknown) {
    logger.error('증빙 서류 생성 실패:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: '증빙 서류 생성에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
    return json(response, { status: 500 })
  }
}
