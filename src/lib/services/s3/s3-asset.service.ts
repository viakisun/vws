/**
 * S3 Asset Service
 * 자산 관련 파일 업로드 관리
 */

import { logger } from '$lib/utils/logger'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from './s3-client'

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'vws-assets'
const ASSET_FOLDER = 'assets'

export class S3AssetService {
  /**
   * 자산 관련 파일 업로드
   */
  async uploadAssetFile(
    file: File,
    assetId: string,
    fileType: 'purchase_receipt' | 'warranty' | 'manual' | 'image' | 'other',
    fileName?: string,
  ): Promise<{ s3Key: string; url: string }> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const timestamp = Date.now()
      const finalFileName = fileName || `${timestamp}.${fileExtension}`

      const s3Key = `${ASSET_FOLDER}/${assetId}/${fileType}/${finalFileName}`

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          assetId,
          fileType,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      await getS3Client().send(command)

      const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`

      logger.info(`Asset file uploaded: ${s3Key}`)
      return { s3Key, url }
    } catch (error) {
      logger.error('Failed to upload asset file:', error)
      throw error
    }
  }

  /**
   * 지식재산권 문서 업로드
   */
  async uploadIpDocument(
    file: File,
    ipId: string,
    documentType: 'application' | 'registration' | 'renewal' | 'other',
    fileName?: string,
  ): Promise<{ s3Key: string; url: string }> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const timestamp = Date.now()
      const finalFileName = fileName || `${timestamp}.${fileExtension}`

      const s3Key = `${ASSET_FOLDER}/ip/${ipId}/${documentType}/${finalFileName}`

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          ipId,
          documentType,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      await getS3Client().send(command)

      const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`

      logger.info(`IP document uploaded: ${s3Key}`)
      return { s3Key, url }
    } catch (error) {
      logger.error('Failed to upload IP document:', error)
      throw error
    }
  }

  /**
   * 인증서 문서 업로드
   */
  async uploadCertificationDocument(
    file: File,
    certificationId: string,
    documentType: 'certificate' | 'renewal' | 'other',
    fileName?: string,
  ): Promise<{ s3Key: string; url: string }> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const timestamp = Date.now()
      const finalFileName = fileName || `${timestamp}.${fileExtension}`

      const s3Key = `${ASSET_FOLDER}/certifications/${certificationId}/${documentType}/${finalFileName}`

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          certificationId,
          documentType,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      await getS3Client().send(command)

      const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`

      logger.info(`Certification document uploaded: ${s3Key}`)
      return { s3Key, url }
    } catch (error) {
      logger.error('Failed to upload certification document:', error)
      throw error
    }
  }

  /**
   * OCR 처리를 위한 인증서 업로드 (임시)
   */
  async uploadCertificationForOcr(
    file: File,
    companyId: string,
    fileName?: string,
  ): Promise<{ s3Key: string; url: string }> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const timestamp = Date.now()
      const finalFileName = fileName || `${timestamp}.${fileExtension}`

      const s3Key = `${ASSET_FOLDER}/ocr/certifications/${companyId}/${finalFileName}`

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          companyId,
          purpose: 'ocr',
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      await getS3Client().send(command)

      const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`

      logger.info(`Certification uploaded for OCR: ${s3Key}`)
      return { s3Key, url }
    } catch (error) {
      logger.error('Failed to upload certification for OCR:', error)
      throw error
    }
  }

  /**
   * 파일 다운로드 URL 생성 (서명된 URL)
   */
  async getSignedDownloadUrl(s3Key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })

      const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn })
      return signedUrl
    } catch (error) {
      logger.error('Failed to generate signed download URL:', error)
      throw error
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(s3Key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })

      await getS3Client().send(command)
      logger.info(`File deleted: ${s3Key}`)
    } catch (error) {
      logger.error('Failed to delete file:', error)
      throw error
    }
  }

  /**
   * 자산 관련 모든 파일 삭제
   */
  async deleteAssetFiles(assetId: string): Promise<void> {
    try {
      // TODO: S3에서 폴더 내 모든 파일 삭제 로직 구현
      // 현재는 개별 파일 삭제만 지원
      logger.info(`Asset files deletion requested for: ${assetId}`)
    } catch (error) {
      logger.error('Failed to delete asset files:', error)
      throw error
    }
  }

  /**
   * 파일 메타데이터 조회
   */
  async getFileMetadata(s3Key: string): Promise<{
    contentType?: string
    contentLength?: number
    lastModified?: Date
    metadata?: Record<string, string>
  }> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })

      const response = await getS3Client().send(command)

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      }
    } catch (error) {
      logger.error('Failed to get file metadata:', error)
      throw error
    }
  }

  /**
   * 파일 크기 검증
   */
  validateFileSize(file: File, maxSizeInMB = 10): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  /**
   * 파일 타입 검증
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  /**
   * 지원되는 파일 타입들
   */
  static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]
  static readonly ALLOWED_OCR_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
}

// 싱글톤 인스턴스 export
export const s3AssetService = new S3AssetService()
