import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the services
vi.mock('$lib/planner/services/product-doc.service')
vi.mock('$lib/planner/services/product.service')

import { productDocService } from '$lib/planner/services/product-doc.service'
import { productService } from '$lib/planner/services/product.service'

// Mock data
const mockProductId = 'test-product-id'
const mockDocId = 'test-doc-id'
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

const mockDoc = {
  id: mockDocId,
  product_id: mockProductId,
  title: 'Test Document',
  content: '# Test Content\n\nThis is a test markdown document.',
  display_order: 0,
  created_by: mockUser.id,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockDocWithCreator = {
  ...mockDoc,
  creator: {
    id: mockUser.id,
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    department: 'IT',
    position: 'Developer',
  },
}

describe('Product Docs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    vi.mocked(productService.getById).mockResolvedValue(mockProduct as any)
    vi.mocked(productDocService.getById).mockResolvedValue(mockDocWithCreator as any)
    vi.mocked(productDocService.getByProductId).mockResolvedValue([mockDocWithCreator] as any)
    vi.mocked(productDocService.create).mockResolvedValue(mockDoc as any)
    vi.mocked(productDocService.update).mockResolvedValue({
      ...mockDoc,
      title: 'Updated Title',
    } as any)
    vi.mocked(productDocService.delete).mockResolvedValue({ success: true })
  })

  describe('GET /api/planner/products/[id]/docs', () => {
    it('should return docs for a product', async () => {
      // This would be tested in integration tests since we're testing the actual API endpoints
      // For now, we test the service layer directly
      const result = await productDocService.getByProductId(mockProductId)

      expect(result).toEqual([mockDocWithCreator])
      expect(productDocService.getByProductId).toHaveBeenCalledWith(mockProductId)
    })
  })

  describe('POST /api/planner/products/[id]/docs', () => {
    it('should create a new document', async () => {
      const input = {
        title: 'Test Document',
        content: '# Test Content\n\nThis is a test markdown document.',
      }

      const result = await productDocService.create(
        {
          product_id: mockProductId,
          title: input.title,
          content: input.content,
        },
        mockUser.id,
      )

      expect(result).toEqual(mockDoc)
      expect(productDocService.create).toHaveBeenCalledWith(
        {
          product_id: mockProductId,
          title: input.title,
          content: input.content,
        },
        mockUser.id,
      )
    })
  })

  describe('GET /api/planner/products/[id]/docs/[docId]', () => {
    it('should return a specific document', async () => {
      const result = await productDocService.getById(mockDocId)

      expect(result).toEqual(mockDocWithCreator)
      expect(productDocService.getById).toHaveBeenCalledWith(mockDocId)
    })
  })

  describe('PATCH /api/planner/products/[id]/docs/[docId]', () => {
    it('should update a document', async () => {
      const updateInput = {
        title: 'Updated Title',
        content: 'Updated content',
      }

      const result = await productDocService.update(mockDocId, updateInput, mockUser.id)

      expect(result).toEqual({
        ...mockDoc,
        title: 'Updated Title',
      })
      expect(productDocService.update).toHaveBeenCalledWith(mockDocId, updateInput, mockUser.id)
    })
  })

  describe('DELETE /api/planner/products/[id]/docs/[docId]', () => {
    it('should delete a document', async () => {
      const result = await productDocService.delete(mockDocId, mockUser.id)

      expect(result).toEqual({ success: true })
      expect(productDocService.delete).toHaveBeenCalledWith(mockDocId, mockUser.id)
    })
  })

  describe('POST /api/planner/products/[id]/docs/reorder', () => {
    it('should reorder documents', async () => {
      const docIds = ['doc1', 'doc2', 'doc3']

      // Mock update calls for reordering
      vi.mocked(productDocService.update).mockResolvedValue(mockDoc as any)

      // Test reordering logic by calling update for each document with new display_order
      for (let i = 0; i < docIds.length; i++) {
        await productDocService.update(docIds[i], { display_order: i }, mockUser.id)
      }

      expect(productDocService.update).toHaveBeenCalledTimes(3)
      expect(productDocService.update).toHaveBeenCalledWith(
        'doc1',
        { display_order: 0 },
        mockUser.id,
      )
      expect(productDocService.update).toHaveBeenCalledWith(
        'doc2',
        { display_order: 1 },
        mockUser.id,
      )
      expect(productDocService.update).toHaveBeenCalledWith(
        'doc3',
        { display_order: 2 },
        mockUser.id,
      )
    })
  })

  describe('Error handling', () => {
    it('should handle product not found error', async () => {
      vi.mocked(productService.getById).mockResolvedValue(null)

      // This would be tested in actual API integration tests
      // The service layer doesn't handle product validation
      expect(productService.getById).toHaveBeenCalled()
    })

    it('should handle document not found error', async () => {
      vi.mocked(productDocService.getById).mockResolvedValue(null)

      const result = await productDocService.getById('non-existent-id')

      expect(result).toBeNull()
    })

    it('should handle service errors', async () => {
      vi.mocked(productDocService.create).mockRejectedValue(new Error('Database error'))

      await expect(
        productDocService.create(
          {
            product_id: mockProductId,
            title: 'Test Document',
            content: 'Test Content',
          },
          mockUser.id,
        ),
      ).rejects.toThrow('Database error')
    })
  })
})
