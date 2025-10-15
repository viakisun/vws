import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the s3-core module
vi.mock('$lib/services/s3/s3-core', () => ({
  uploadToS3Core: vi.fn(),
  downloadFromS3Core: vi.fn(),
  deleteFromS3Core: vi.fn(),
}))

// Mock the file validation utility
vi.mock('$lib/utils/file-validation', () => ({
  sanitizeFilename: vi.fn((filename: string) => filename.replace(/[^a-zA-Z0-9.-]/g, '_')),
}))

// Mock the logger
vi.mock('$lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock CRM constants
vi.mock('$lib/constants/crm', () => ({
  DEFAULT_COMPANY_CODE: '1001',
}))

import { downloadFromS3Core, uploadToS3Core } from '$lib/services/s3/s3-core'
import {
  createProductReferenceUrl,
  deleteProductReference,
  downloadProductReference,
  formatFileSize,
  generateProductReferenceS3Key,
  getFileExtensionFromMimeType,
  getProductReferenceThumbnailUrl,
  isImageFile,
  isPdfFile,
  uploadProductReference,
} from '$lib/services/s3/s3-planner.service'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('s3-planner.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateProductReferenceS3Key', () => {
    it('should generate correct S3 key with default company code', () => {
      const productId = 'test-product-id'
      const filename = 'document.pdf'

      const key = generateProductReferenceS3Key(productId, filename)

      expect(key).toMatch(
        /^1001\/planner\/products\/test-product-id\/references\/\d+_document\.pdf$/,
      )
    })

    it('should generate correct S3 key with custom company code', () => {
      const productId = 'test-product-id'
      const filename = 'document.pdf'
      const companyCode = '2001'

      const key = generateProductReferenceS3Key(productId, filename, companyCode)

      expect(key).toMatch(
        /^2001\/planner\/products\/test-product-id\/references\/\d+_document\.pdf$/,
      )
    })

    it('should sanitize filename in S3 key', () => {
      const productId = 'test-product-id'
      const filename = 'file with spaces & special chars!.pdf'

      const key = generateProductReferenceS3Key(productId, filename)

      expect(key).toContain('file_with_spaces___special_chars___.pdf')
    })
  })

  describe('uploadProductReference', () => {
    const mockProductId = 'test-product-id'
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const mockTitle = 'Test Document'
    const mockDescription = 'Test description'

    beforeEach(() => {
      vi.mocked(uploadToS3Core).mockResolvedValue({
        success: true,
        s3Key: 'test-s3-key',
        finalUrl: 'https://example.com/file',
      })
    })

    it('should upload file and save metadata successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'test-reference-id' } }),
      })

      const result = await uploadProductReference(
        mockProductId,
        mockFile,
        mockTitle,
        mockDescription,
      )

      expect(uploadToS3Core).toHaveBeenCalledWith({
        file: mockFile,
        presignedUrlEndpoint: `/api/planner/products/${mockProductId}/references/upload-url`,
        presignedUrlParams: {
          fileName: 'test.pdf',
          fileSize: mockFile.size,
          contentType: 'application/pdf',
        },
        onProgress: expect.any(Function),
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/planner/products/${mockProductId}/references`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: mockTitle,
            description: mockDescription,
            type: 'file',
            s3_key: 'test-s3-key',
            file_name: 'test.pdf',
            file_size: mockFile.size,
            mime_type: 'application/pdf',
          }),
        }),
      )

      expect(result).toEqual({
        s3Key: 'test-s3-key',
        referenceId: 'test-reference-id',
      })
    })

    it('should handle metadata save failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database error' }),
      })

      await expect(uploadProductReference(mockProductId, mockFile, mockTitle)).rejects.toThrow(
        'Database error',
      )
    })

    it('should handle upload failure', async () => {
      vi.mocked(uploadToS3Core).mockRejectedValueOnce(new Error('S3 upload failed'))

      await expect(uploadProductReference(mockProductId, mockFile, mockTitle)).rejects.toThrow(
        'S3 upload failed',
      )
    })
  })

  describe('createProductReferenceUrl', () => {
    const mockProductId = 'test-product-id'
    const mockUrl = 'https://example.com/document'
    const mockTitle = 'Test Link'

    it('should create URL reference successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'test-reference-id' } }),
      })

      const result = await createProductReferenceUrl(
        mockProductId,
        mockUrl,
        mockTitle,
        'Test description',
        'figma',
      )

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/planner/products/${mockProductId}/references`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: mockTitle,
            description: 'Test description',
            type: 'figma',
            url: mockUrl,
          }),
        }),
      )

      expect(result).toEqual({
        referenceId: 'test-reference-id',
      })
    })

    it('should handle creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Validation error' }),
      })

      await expect(createProductReferenceUrl(mockProductId, mockUrl, mockTitle)).rejects.toThrow(
        'Validation error',
      )
    })
  })

  describe('downloadProductReference', () => {
    const mockProductId = 'test-product-id'
    const mockReferenceId = 'test-reference-id'

    it('should download file successfully', async () => {
      vi.mocked(downloadFromS3Core).mockResolvedValueOnce(undefined)

      await downloadProductReference(mockProductId, mockReferenceId, false)

      expect(downloadFromS3Core).toHaveBeenCalledWith({
        downloadUrlEndpoint: `/api/planner/products/${mockProductId}/references/${mockReferenceId}/download-url`,
        openInNewTab: false,
      })
    })
  })

  describe('getProductReferenceThumbnailUrl', () => {
    const mockProductId = 'test-product-id'
    const mockReferenceId = 'test-reference-id'

    it('should get thumbnail URL successfully', async () => {
      const mockThumbnailUrl = 'https://example.com/thumbnail.jpg'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { downloadUrl: mockThumbnailUrl } }),
      })

      const result = await getProductReferenceThumbnailUrl(mockProductId, mockReferenceId)

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/planner/products/${mockProductId}/references/${mockReferenceId}/download-url?thumbnail=true`,
        expect.objectContaining({
          credentials: 'include',
        }),
      )

      expect(result).toBe(mockThumbnailUrl)
    })

    it('should handle thumbnail URL failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      await expect(getProductReferenceThumbnailUrl(mockProductId, mockReferenceId)).rejects.toThrow(
        '썸네일 URL 생성 실패',
      )
    })
  })

  describe('deleteProductReference', () => {
    const mockProductId = 'test-product-id'
    const mockReferenceId = 'test-reference-id'

    it('should delete reference successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await deleteProductReference(mockProductId, mockReferenceId)

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/planner/products/${mockProductId}/references/${mockReferenceId}`,
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        }),
      )
    })

    it('should handle delete failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      })

      await expect(deleteProductReference(mockProductId, mockReferenceId)).rejects.toThrow(
        'Delete failed',
      )
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })

  describe('getFileExtensionFromMimeType', () => {
    it('should return correct extensions', () => {
      expect(getFileExtensionFromMimeType('application/pdf')).toBe('pdf')
      expect(getFileExtensionFromMimeType('image/jpeg')).toBe('jpg')
      expect(getFileExtensionFromMimeType('image/png')).toBe('png')
      expect(getFileExtensionFromMimeType('application/msword')).toBe('doc')
      expect(getFileExtensionFromMimeType('unknown/type')).toBe('unknown')
    })
  })

  describe('isImageFile', () => {
    it('should identify image files correctly', () => {
      expect(isImageFile('image/jpeg')).toBe(true)
      expect(isImageFile('image/png')).toBe(true)
      expect(isImageFile('application/pdf')).toBe(false)
      expect(isImageFile('text/plain')).toBe(false)
    })
  })

  describe('isPdfFile', () => {
    it('should identify PDF files correctly', () => {
      expect(isPdfFile('application/pdf')).toBe(true)
      expect(isPdfFile('application/pdf', 'document.pdf')).toBe(true)
      expect(isPdfFile('text/plain', 'document.pdf')).toBe(true)
      expect(isPdfFile('application/pdf', 'document.txt')).toBe(true)
      expect(isPdfFile('text/plain', 'document.txt')).toBe(false)
    })
  })
})
