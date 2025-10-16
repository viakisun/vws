import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the database service
vi.mock('$lib/database/connection', () => ({
  DatabaseService: {
    query: vi.fn(),
  },
}))

import { DatabaseService } from '$lib/database/connection'
import { ProductDocService } from '$lib/planner/services/product-doc.service'
import type { CreateProductDocInput, ProductDoc, UpdateProductDocInput } from '$lib/planner/types'

// Mock data
const mockProductId = 'test-product-id'
const mockUserId = 'test-user-id'
const mockDocId = 'test-doc-id'

const mockDoc: ProductDoc = {
  id: mockDocId,
  product_id: mockProductId,
  title: 'Test Document',
  content: '# Test Content\n\nThis is a test markdown document.',
  display_order: 0,
  created_by: mockUserId,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockDocWithCreator = {
  ...mockDoc,
  creator: {
    id: mockUserId,
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    department: 'IT',
    position: 'Developer',
  },
}

describe('ProductDocService', () => {
  let service: ProductDocService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ProductDocService()
  })

  describe('create', () => {
    it('should create a new document successfully', async () => {
      const input: CreateProductDocInput = {
        product_id: mockProductId,
        title: 'Test Document',
        content: '# Test Content\n\nThis is a test markdown document.',
        display_order: 0,
      }

      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDoc],
        rowCount: 1,
      } as any)

      // Mock activity log query
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.create(input, mockUserId)

      expect(DatabaseService.query).toHaveBeenCalledTimes(2) // Create + activity log
      expect(result).toEqual(mockDoc)
    })

    it('should handle missing display_order', async () => {
      const input: CreateProductDocInput = {
        product_id: mockProductId,
        title: 'Test Document',
        content: '# Test Content',
      }

      const mockDocWithoutDisplayOrder = { ...mockDoc, display_order: 0 }

      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithoutDisplayOrder],
        rowCount: 1,
      } as any)

      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.create(input, mockUserId)

      expect(result.display_order).toBe(0)
    })
  })

  describe('getById', () => {
    it('should return document with creator information', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithCreator],
        rowCount: 1,
      } as any)

      const result = await service.getById(mockDocId)

      expect(DatabaseService.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [
        mockDocId,
      ])
      expect(result).toEqual(mockDocWithCreator)
    })

    it('should return null when document not found', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.getById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('getByProductId', () => {
    it('should return documents for a product', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithCreator],
        rowCount: 1,
      } as any)

      const result = await service.getByProductId(mockProductId)

      expect(DatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE d.product_id = $1'),
        [mockProductId],
      )
      expect(result).toEqual([mockDocWithCreator])
    })

    it('should throw error when table does not exist', async () => {
      vi.mocked(DatabaseService.query).mockRejectedValueOnce(
        new Error('relation "planner_product_docs" does not exist'),
      )

      await expect(service.getByProductId(mockProductId)).rejects.toThrow(
        'Product docs table does not exist. Please run database migration 035_add_planner_product_docs.sql',
      )
    })
  })

  describe('update', () => {
    it('should update document successfully', async () => {
      const updateInput: UpdateProductDocInput = {
        title: 'Updated Title',
        content: 'Updated content',
      }

      const updatedDoc = { ...mockDoc, ...updateInput }

      // Mock getById call
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithCreator],
        rowCount: 1,
      } as any)

      // Mock update query
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [updatedDoc],
        rowCount: 1,
      } as any)

      // Mock activity log query
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.update(mockDocId, updateInput, mockUserId)

      expect(result).toEqual(updatedDoc)
    })

    it('should return null when document not found', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.update('non-existent-id', { title: 'Updated' }, mockUserId)

      expect(result).toBeNull()
    })

    it('should not update when no changes provided', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithCreator],
        rowCount: 1,
      } as any)

      const result = await service.update(mockDocId, {}, mockUserId)

      expect(result).toEqual(mockDocWithCreator)
      expect(DatabaseService.query).toHaveBeenCalledTimes(1) // Only getById
    })
  })

  describe('delete', () => {
    it('should soft delete document successfully', async () => {
      // Mock getById call
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithCreator],
        rowCount: 1,
      } as any)

      // Mock delete query
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      } as any)

      // Mock activity log query
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.delete(mockDocId, mockUserId)

      expect(result).toEqual({ success: true })
    })

    it('should return failure when document not found', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.delete('non-existent-id', mockUserId)

      expect(result).toEqual({ success: false })
    })

    it('should return failure when delete query fails', async () => {
      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [mockDocWithCreator],
        rowCount: 1,
      } as any)

      vi.mocked(DatabaseService.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await service.delete(mockDocId, mockUserId)

      expect(result).toEqual({ success: false })
    })
  })
})
