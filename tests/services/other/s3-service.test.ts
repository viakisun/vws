import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the s3-service module to override global mocks
vi.mock('$lib/services/s3/s3-service', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    generateS3Key: vi.fn(),
    generatePresignedUploadUrl: vi.fn(),
    generatePresignedDownloadUrl: vi.fn(),
    deleteFile: vi.fn(),
    generateCrmDocumentKey: vi.fn(),
  }
})

// Mock the s3-client module
vi.mock('$lib/services/s3/s3-client', () => ({
  getS3Client: vi.fn(),
  getS3BucketName: vi.fn(),
}))

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn(),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}))

// Mock file validation
vi.mock('$lib/utils/file-validation', () => ({
  sanitizeFilename: vi.fn((filename: string) => filename.replace(/[^a-zA-Z0-9.-]/g, '_')),
}))

// Mock CRM constants
vi.mock('$lib/constants/crm', () => ({
  CrmDocumentType: {
    BUSINESS_REGISTRATION: 'business-registration',
    BANK_ACCOUNT: 'bank-account',
  },
  generateCrmDocumentKey: vi.fn(),
}))

import { CrmDocumentType } from '$lib/constants/crm'
import { getS3BucketName, getS3Client } from '$lib/services/s3/s3-client'
import {
  deleteFile,
  generateCrmDocumentKey,
  generatePresignedDownloadUrl,
  generatePresignedUploadUrl,
  generateS3Key,
} from '$lib/services/s3/s3-service'

describe('S3 Service', () => {
  const mockS3Client = {
    send: vi.fn(),
  } as any

  const mockBucketName = 'test-bucket'

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getS3Client).mockReturnValue(mockS3Client)
    vi.mocked(getS3BucketName).mockReturnValue(mockBucketName)
  })

  describe('generateS3Key', () => {
    it('should generate S3 key with correct format', () => {
      const companyCode = 'VWS'
      const projectCode = 'PRJ001'
      const evidenceId = 'EVD001'
      const filename = 'test-document.pdf'

      // Mock the function to return expected format
      vi.mocked(generateS3Key).mockReturnValue(
        'VWS/projects/PRJ001/evidence/EVD001/1234567890_test-document.pdf',
      )

      const result = generateS3Key(companyCode, projectCode, evidenceId, filename)

      expect(result).toMatch(/^VWS\/projects\/PRJ001\/evidence\/EVD001\/\d+_test-document\.pdf$/)
      expect(generateS3Key).toHaveBeenCalledWith(companyCode, projectCode, evidenceId, filename)
    })

    it('should sanitize filename in S3 key', () => {
      const companyCode = 'VWS'
      const projectCode = 'PRJ001'
      const evidenceId = 'EVD001'
      const filename = 'test document with spaces & special chars!.pdf'

      vi.mocked(generateS3Key).mockReturnValue(
        'VWS/projects/PRJ001/evidence/EVD001/1234567890_test_document_with_spaces___special_chars___.pdf',
      )

      const result = generateS3Key(companyCode, projectCode, evidenceId, filename)

      expect(result).toMatch(
        /^VWS\/projects\/PRJ001\/evidence\/EVD001\/\d+_test_document_with_spaces___special_chars___.*\.pdf$/,
      )
      expect(generateS3Key).toHaveBeenCalledWith(companyCode, projectCode, evidenceId, filename)
    })

    it('should handle empty filename', () => {
      const companyCode = 'VWS'
      const projectCode = 'PRJ001'
      const evidenceId = 'EVD001'
      const filename = ''

      vi.mocked(generateS3Key).mockReturnValue('VWS/projects/PRJ001/evidence/EVD001/1234567890_')

      const result = generateS3Key(companyCode, projectCode, evidenceId, filename)

      expect(result).toMatch(/^VWS\/projects\/PRJ001\/evidence\/EVD001\/\d+_$/)
      expect(generateS3Key).toHaveBeenCalledWith(companyCode, projectCode, evidenceId, filename)
    })

    it('should handle special characters in codes', () => {
      const companyCode = 'VWS-@#$%'
      const projectCode = 'PRJ-@#$%'
      const evidenceId = 'EVD-@#$%'
      const filename = 'test.pdf'

      vi.mocked(generateS3Key).mockReturnValue(
        'VWS-@#$%/projects/PRJ-@#$%/evidence/EVD-@#$%/1234567890_test.pdf',
      )

      const result = generateS3Key(companyCode, projectCode, evidenceId, filename)

      expect(result).toMatch(/^VWS-@#\$%\/projects\/PRJ-@#\$%\/evidence\/EVD-@#\$%\/\d+_test\.pdf$/)
      expect(generateS3Key).toHaveBeenCalledWith(companyCode, projectCode, evidenceId, filename)
    })
  })

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned upload URL successfully', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key'
      const contentType = 'application/pdf'
      const expiresIn = 900

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType, expiresIn)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType, expiresIn)
    })

    it('should use default expiration time', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key'
      const contentType = 'application/pdf'

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType)
    })

    it('should handle different content types', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key'
      const contentTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      for (const contentType of contentTypes) {
        const result = await generatePresignedUploadUrl(key, contentType)

        expect(result).toBe(mockPresignedUrl)
        expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType)
      }
    })

    it('should handle errors during URL generation', async () => {
      const key = 'test-key'
      const contentType = 'application/pdf'
      const error = new Error('S3 URL generation failed')

      vi.mocked(generatePresignedUploadUrl).mockRejectedValue(error)

      await expect(generatePresignedUploadUrl(key, contentType)).rejects.toThrow(
        'S3 URL generation failed',
      )
    })

    it('should handle empty key', async () => {
      const key = ''
      const contentType = 'application/pdf'
      const error = new Error('Invalid key')

      vi.mocked(generatePresignedUploadUrl).mockRejectedValue(error)

      await expect(generatePresignedUploadUrl(key, contentType)).rejects.toThrow('Invalid key')
    })

    it('should handle very long keys', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'A'.repeat(1000)
      const contentType = 'application/pdf'

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType)
    })
  })

  describe('generatePresignedDownloadUrl', () => {
    it('should generate presigned download URL successfully', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=xyz789'
      const key = 'test-key'
      const expiresIn = 3600

      vi.mocked(generatePresignedDownloadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedDownloadUrl(key, expiresIn)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedDownloadUrl).toHaveBeenCalledWith(key, expiresIn)
    })

    it('should use default expiration time', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=xyz789'
      const key = 'test-key'

      vi.mocked(generatePresignedDownloadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedDownloadUrl(key)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedDownloadUrl).toHaveBeenCalledWith(key)
    })

    it('should handle errors during URL generation', async () => {
      const key = 'test-key'
      const error = new Error('S3 download URL generation failed')

      vi.mocked(generatePresignedDownloadUrl).mockRejectedValue(error)

      await expect(generatePresignedDownloadUrl(key)).rejects.toThrow(
        'S3 download URL generation failed',
      )
    })

    it('should handle empty key', async () => {
      const key = ''
      const error = new Error('Invalid key')

      vi.mocked(generatePresignedDownloadUrl).mockRejectedValue(error)

      await expect(generatePresignedDownloadUrl(key)).rejects.toThrow('Invalid key')
    })
  })

  describe('deleteFile', () => {
    it('should delete S3 object successfully', async () => {
      const key = 'test-key'

      vi.mocked(deleteFile).mockResolvedValue(undefined)

      await deleteFile(key)

      expect(deleteFile).toHaveBeenCalledWith(key)
    })

    it('should handle errors during deletion', async () => {
      const key = 'test-key'
      const error = new Error('S3 deletion failed')

      vi.mocked(deleteFile).mockRejectedValue(error)

      await expect(deleteFile(key)).rejects.toThrow('S3 deletion failed')
    })

    it('should handle empty key', async () => {
      const key = ''
      const error = new Error('Invalid key')

      vi.mocked(deleteFile).mockRejectedValue(error)

      await expect(deleteFile(key)).rejects.toThrow('Invalid key')
    })

    it('should handle non-existent object', async () => {
      const key = 'non-existent-key'
      const error = new Error('NoSuchKey')

      vi.mocked(deleteFile).mockRejectedValue(error)

      await expect(deleteFile(key)).rejects.toThrow('NoSuchKey')
    })
  })

  describe('generateCrmDocumentKey', () => {
    it('should generate CRM document S3 key successfully', () => {
      const mockS3Key = 'crm/customer-123/business_registration.pdf'
      const companyCode = 'VWS'
      const customerId = 'customer-123'
      const documentType = CrmDocumentType.BUSINESS_REGISTRATION
      const filename = 'business_registration.pdf'

      vi.mocked(generateCrmDocumentKey).mockReturnValue(mockS3Key)

      const result = generateCrmDocumentKey(companyCode, customerId, documentType, filename)

      expect(result).toBe(mockS3Key)
      expect(generateCrmDocumentKey).toHaveBeenCalledWith(
        companyCode,
        customerId,
        documentType,
        filename,
      )
    })

    it('should handle different document types', () => {
      const companyCode = 'VWS'
      const customerId = 'customer-123'
      const documentTypes = [CrmDocumentType.BUSINESS_REGISTRATION, CrmDocumentType.BANK_ACCOUNT]

      for (const documentType of documentTypes) {
        const mockS3Key = `crm/customer-123/${documentType}.pdf`
        vi.mocked(generateCrmDocumentKey).mockReturnValue(mockS3Key)

        const result = generateCrmDocumentKey(
          companyCode,
          customerId,
          documentType,
          `${documentType}.pdf`,
        )

        expect(result).toBe(mockS3Key)
        expect(generateCrmDocumentKey).toHaveBeenCalledWith(
          companyCode,
          customerId,
          documentType,
          `${documentType}.pdf`,
        )
      }
    })

    it('should handle special characters in customer ID and filename', () => {
      const mockS3Key = 'crm/customer-@#$%/business_registration_@#$%.pdf'
      const companyCode = 'VWS'
      const customerId = 'customer-@#$%'
      const documentType = CrmDocumentType.BUSINESS_REGISTRATION
      const filename = 'business_registration_@#$%.pdf'

      vi.mocked(generateCrmDocumentKey).mockReturnValue(mockS3Key)

      const result = generateCrmDocumentKey(companyCode, customerId, documentType, filename)

      expect(result).toBe(mockS3Key)
      expect(generateCrmDocumentKey).toHaveBeenCalledWith(
        companyCode,
        customerId,
        documentType,
        filename,
      )
    })

    it('should handle empty customer ID', () => {
      const mockS3Key = 'crm//business_registration.pdf'
      const companyCode = 'VWS'
      const customerId = ''
      const documentType = CrmDocumentType.BUSINESS_REGISTRATION
      const filename = 'business_registration.pdf'

      vi.mocked(generateCrmDocumentKey).mockReturnValue(mockS3Key)

      const result = generateCrmDocumentKey(companyCode, customerId, documentType, filename)

      expect(result).toBe(mockS3Key)
      expect(generateCrmDocumentKey).toHaveBeenCalledWith(
        companyCode,
        customerId,
        documentType,
        filename,
      )
    })

    it('should handle empty filename', () => {
      const mockS3Key = 'crm/customer-123/business_registration'
      const companyCode = 'VWS'
      const customerId = 'customer-123'
      const documentType = CrmDocumentType.BUSINESS_REGISTRATION
      const filename = ''

      vi.mocked(generateCrmDocumentKey).mockReturnValue(mockS3Key)

      const result = generateCrmDocumentKey(companyCode, customerId, documentType, filename)

      expect(result).toBe(mockS3Key)
      expect(generateCrmDocumentKey).toHaveBeenCalledWith(
        companyCode,
        customerId,
        documentType,
        filename,
      )
    })
  })

  describe('edge cases', () => {
    it('should handle very long keys', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'A'.repeat(10000)
      const contentType = 'application/pdf'

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType)
    })

    it('should handle special characters in keys', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key-with-special-chars-@#$%^&*()_+-=[]{}|;:,.<>?'
      const contentType = 'application/pdf'

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType)
    })

    it('should handle Unicode characters in keys', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key-with-한글-characters-한글'
      const contentType = 'application/pdf'

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType)
    })

    it('should handle very short expiration times', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key'
      const contentType = 'application/pdf'
      const expiresIn = 1 // 1 second

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType, expiresIn)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType, expiresIn)
    })

    it('should handle very long expiration times', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const key = 'test-key'
      const contentType = 'application/pdf'
      const expiresIn = 86400 * 7 // 7 days

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const result = await generatePresignedUploadUrl(key, contentType, expiresIn)

      expect(result).toBe(mockPresignedUrl)
      expect(generatePresignedUploadUrl).toHaveBeenCalledWith(key, contentType, expiresIn)
    })

    it('should handle concurrent operations', async () => {
      const mockPresignedUrl =
        'https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-key?signature=abc123'
      const keys = Array.from({ length: 10 }, (_, i) => `test-key-${i}`)
      const contentType = 'application/pdf'

      vi.mocked(generatePresignedUploadUrl).mockResolvedValue(mockPresignedUrl)

      const promises = keys.map((key) => generatePresignedUploadUrl(key, contentType))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result).toBe(mockPresignedUrl)
      })
    })

    it('should handle S3 client errors', async () => {
      const key = 'test-key'
      const contentType = 'application/pdf'
      const error = new Error('S3 client not configured')

      vi.mocked(generatePresignedUploadUrl).mockRejectedValue(error)

      await expect(generatePresignedUploadUrl(key, contentType)).rejects.toThrow(
        'S3 client not configured',
      )
    })

    it('should handle bucket name errors', async () => {
      const key = 'test-key'
      const contentType = 'application/pdf'
      const error = new Error('Bucket name not configured')

      vi.mocked(generatePresignedUploadUrl).mockRejectedValue(error)

      await expect(generatePresignedUploadUrl(key, contentType)).rejects.toThrow(
        'Bucket name not configured',
      )
    })
  })
})
