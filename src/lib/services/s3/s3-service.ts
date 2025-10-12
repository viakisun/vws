/**
 * S3 서비스 유틸리티
 * Presigned URL 생성, 파일 삭제, S3 키 생성 등
 */

import { sanitizeFilename } from '$lib/utils/file-validation'
import { logger } from '$lib/utils/logger'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3BucketName, getS3Client } from './s3-client'

/**
 * S3 키 생성 규칙
 * 형식: {companyCode}/projects/{projectCode}/evidence/{evidenceId}/{timestamp}_{filename}
 */
export function generateS3Key(
  companyCode: string,
  projectCode: string,
  evidenceId: string,
  filename: string,
): string {
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(filename)
  return `${companyCode}/projects/${projectCode}/evidence/${evidenceId}/${timestamp}_${sanitized}`
}

/**
 * 업로드용 Presigned URL 생성
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900, // 15분
): Promise<string> {
  try {
    const client = getS3Client()
    const bucketName = getS3BucketName()

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(client, command, { expiresIn })
    logger.log('Presigned upload URL generated', { key, expiresIn })

    return url
  } catch (error) {
    logger.error('Failed to generate presigned upload URL', error)
    throw error
  }
}

/**
 * 다운로드용 Presigned URL 생성
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 300, // 5분
): Promise<string> {
  try {
    const client = getS3Client()
    const bucketName = getS3BucketName()

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    const url = await getSignedUrl(client, command, { expiresIn })
    logger.log('Presigned download URL generated', { key, expiresIn })

    return url
  } catch (error) {
    logger.error('Failed to generate presigned download URL', error)
    throw error
  }
}

/**
 * S3 파일 삭제
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const client = getS3Client()
    const bucketName = getS3BucketName()

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await client.send(command)
    logger.log('File deleted from S3', { key })
  } catch (error) {
    logger.error('Failed to delete file from S3', error)
    throw error
  }
}

/**
 * S3 키에서 파일명 추출
 */
export function extractFilenameFromKey(key: string): string {
  const parts = key.split('/')
  const filenameWithTimestamp = parts[parts.length - 1]
  // timestamp_ 제거
  const match = filenameWithTimestamp.match(/^\d+_(.+)$/)
  return match ? match[1] : filenameWithTimestamp
}
