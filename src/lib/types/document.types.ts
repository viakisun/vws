/**
 * 증빙 서류 관련 타입 정의
 */

import type { DocumentType } from '$lib/constants/document-types'

export interface EvidenceDocument {
  id: string
  evidence_item_id: string
  document_type: DocumentType
  file_name: string
  file_path: string // S3 key
  file_size: number
  status: 'pending' | 'approved' | 'rejected'
  upload_date: string
  review_date?: string
  review_comment?: string
  created_at: string
  updated_at: string
}

export interface FileUploadRequest {
  fileName: string
  fileSize: number
  contentType: string
  documentType: DocumentType
}

export interface FileUploadResponse {
  uploadUrl: string
  s3Key: string
  expiresIn: number
}

export interface DocumentMetadataRequest {
  documentType: DocumentType
  fileName: string
  s3Key: string
  fileSize: number
}

export interface DocumentDownloadResponse {
  downloadUrl: string
  fileName: string
  expiresIn: number
}
