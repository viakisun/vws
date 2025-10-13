/**
 * S3 클라이언트 중앙화 모듈
 * 싱글톤 패턴으로 S3Client 인스턴스 관리
 */

import { env } from '$env/dynamic/private'
import { logger } from '$lib/utils/logger'
import { S3Client } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

/**
 * S3 클라이언트 인스턴스 가져오기
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    const region = env.AWS_S3_REGION || env.AWS_REGION || 'ap-northeast-2'
    const accessKeyId = env.AWS_ACCESS_KEY_ID
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY

    if (!accessKeyId || !secretAccessKey) {
      logger.error('AWS credentials are not configured')
      throw new Error('AWS credentials are not configured')
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    logger.log('S3Client initialized', { region })
  }

  return s3Client
}

/**
 * S3 버킷 이름 가져오기
 */
export function getS3BucketName(): string {
  const bucketName = env.AWS_S3_BUCKET_NAME

  if (!bucketName) {
    logger.error('AWS_S3_BUCKET_NAME is not configured')
    throw new Error('AWS_S3_BUCKET_NAME is not configured')
  }

  return bucketName
}

/**
 * S3 클라이언트 종료 (테스트 또는 클린업용)
 */
export function destroyS3Client(): void {
  if (s3Client) {
    s3Client.destroy()
    s3Client = null
    logger.log('S3Client destroyed')
  }
}
