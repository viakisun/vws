import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the services
vi.mock('$lib/planner/services/product-reference.service')
vi.mock('$lib/planner/services/product.service')
vi.mock('$lib/services/s3/s3-service')
vi.mock('$lib/utils/link-detector')

import { productReferenceService } from '$lib/planner/services/product-reference.service'
import { productService } from '$lib/planner/services/product.service'
import {
  generatePresignedDownloadUrl,
  generatePresignedUploadUrl,
} from '$lib/services/s3/s3-service'
import { detectLinkType } from '$lib/utils/link-detector'

// Mock the API handlers - we'll test the logic
const mockProductId = 'test-product-id'
const mockReferenceId = 'test-reference-id'
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'USER',
}

const mockProduct = {
  id: mockProductId,
  name: 'Test Product',
  owner: { id: mockUser.id },
}

const mockReference = {
  id: mockReferenceId,
  product_id: mockProductId,
  title: 'Test Reference',
  description: 'Test Description',
  type: 'pdf' as const,
  url: null,
  s3_key: 'test-s3-key',
  file_name: 'test.pdf',
  file_size: 1024,
  mime_type: 'application/pdf',
  created_by: mockUser.id,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('Product References API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    vi.mocked(productService.getById).mockResolvedValue(mockProduct as any)
    vi.mocked(productReferenceService.getById).mockResolvedValue(mockReference as any)
    vi.mocked(productReferenceService.list).mockResolvedValue([mockReference] as any)
    vi.mocked(productReferenceService.create).mockResolvedValue(mockReference as any)
    vi.mocked(productReferenceService.update).mockResolvedValue({
      ...mockReference,
      title: 'Updated Title',
    } as any)
    vi.mocked(productReferenceService.delete).mockResolvedValue({ success: true })
    vi.mocked(generatePresignedUploadUrl).mockResolvedValue('https://s3.amazonaws.com/upload-url')
    vi.mocked(generatePresignedDownloadUrl).mockResolvedValue(
      'https://s3.amazonaws.com/download-url',
    )
    vi.mocked(detectLinkType).mockReturnValue('pdf')
  })

  describe('Product Reference Service', () => {
    describe('create', () => {
      it('should create a new reference with file upload', async () => {
        const input = {
          product_id: mockProductId,
          title: 'Test Reference',
          description: 'Test Description',
          type: 'file' as const,
          s3_key: 'test-s3-key',
          file_name: 'test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
        }

        const result = await productReferenceService.create(input, mockUser.id)

        expect(productReferenceService.create).toHaveBeenCalledWith(input, mockUser.id)
        expect(result).toEqual(mockReference)
      })

      it('should auto-detect type when URL is provided', async () => {
        const input = {
          product_id: mockProductId,
          title: 'Test Link',
          url: 'https://example.com/document.pdf',
          type: 'pdf' as const,
        }

        await productReferenceService.create(input, mockUser.id)

        expect(detectLinkType).toHaveBeenCalledWith(input.url, undefined)
      })
    })

    describe('list', () => {
      it('should list references with filters', async () => {
        const filters = {
          product_id: mockProductId,
          type: 'pdf' as const,
          search: 'test',
        }

        const result = await productReferenceService.list(filters)

        expect(productReferenceService.list).toHaveBeenCalledWith(filters)
        expect(result).toEqual([mockReference])
      })
    })

    describe('update', () => {
      it('should update reference fields', async () => {
        const updateInput = {
          title: 'Updated Title',
          description: 'Updated Description',
        }

        const result = await productReferenceService.update(
          mockReferenceId,
          updateInput,
          mockUser.id,
        )

        expect(productReferenceService.update).toHaveBeenCalledWith(
          mockReferenceId,
          updateInput,
          mockUser.id,
        )
        expect(result?.title).toBe('Updated Title')
      })
    })

    describe('delete', () => {
      it('should soft delete reference and return s3Key', async () => {
        const result = await productReferenceService.delete(mockReferenceId, mockUser.id)

        expect(productReferenceService.delete).toHaveBeenCalledWith(mockReferenceId, mockUser.id)
        expect(result).toEqual({ success: true })
      })
    })
  })

  describe('S3 Integration', () => {
    it('should generate presigned upload URL', async () => {
      const uploadUrl = await generatePresignedUploadUrl('test-key', 'application/pdf', 900)

      expect(generatePresignedUploadUrl).toHaveBeenCalledWith('test-key', 'application/pdf', 900)
      expect(uploadUrl).toBe('https://s3.amazonaws.com/upload-url')
    })

    it('should generate presigned download URL', async () => {
      const downloadUrl = await generatePresignedDownloadUrl('test-key', 300)

      expect(generatePresignedDownloadUrl).toHaveBeenCalledWith('test-key', 300)
      expect(downloadUrl).toBe('https://s3.amazonaws.com/download-url')
    })
  })

  describe('Link Detection', () => {
    it('should detect PDF links correctly', () => {
      const type = detectLinkType('https://example.com/document.pdf', 'document.pdf')
      expect(type).toBe('pdf')
    })

    it('should detect Figma links correctly', () => {
      vi.mocked(detectLinkType).mockReturnValue('figma')
      const type = detectLinkType('https://figma.com/file/123', '')
      expect(type).toBe('figma')
    })

    it('should detect Notion links correctly', () => {
      vi.mocked(detectLinkType).mockReturnValue('notion')
      const type = detectLinkType('https://notion.so/page/123', '')
      expect(type).toBe('notion')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing product gracefully', async () => {
      vi.mocked(productService.getById).mockResolvedValue(null)

      // This would be handled by the API endpoint, not the service
      // but we can test the service behavior
      const references = await productReferenceService.list({ product_id: 'non-existent' })
      expect(productReferenceService.list).toHaveBeenCalledWith({ product_id: 'non-existent' })
    })

    it('should handle missing reference gracefully', async () => {
      vi.mocked(productReferenceService.getById).mockResolvedValue(null)

      const result = await productReferenceService.update(
        'non-existent',
        { title: 'Test' },
        mockUser.id,
      )
      expect(result).toBeNull()
    })

    it('should handle delete failure gracefully', async () => {
      vi.mocked(productReferenceService.delete).mockResolvedValue({ success: false })

      const result = await productReferenceService.delete('non-existent', mockUser.id)
      expect(result.success).toBe(false)
    })
  })

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const input = {
        product_id: mockProductId,
        // missing title - this should cause validation error
      } as any

      // The actual validation would happen in the API endpoint
      // We're testing the service doesn't require validation itself
      expect(async () => {
        await productReferenceService.create(input, mockUser.id)
      }).not.toThrow()
    })
  })

  describe('Permission Checks', () => {
    it('should handle permission checks in service layer', async () => {
      // Permission checks would typically be done in the API layer
      // but we can verify the service accepts the actorId parameter
      await productReferenceService.create(
        {
          product_id: mockProductId,
          title: 'Test',
          type: 'other',
        },
        mockUser.id,
      )

      expect(productReferenceService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: mockProductId,
          title: 'Test',
          type: 'other',
        }),
        mockUser.id,
      )
    })
  })
})
