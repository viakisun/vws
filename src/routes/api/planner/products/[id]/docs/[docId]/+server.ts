import { productDocService } from '$lib/planner/services/product-doc.service'
import { productService } from '$lib/planner/services/product.service'
import type { UpdateProductDocInput } from '$lib/planner/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: Get a specific doc
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, docId } = params
    if (!productId || !docId) {
      return json({ success: false, error: 'Product ID and Doc ID are required' }, { status: 400 })
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const doc = await productDocService.getById(docId)
    if (!doc) {
      return json({ success: false, error: 'Doc not found' }, { status: 404 })
    }

    // Verify the doc belongs to this product
    if (doc.product_id !== productId) {
      return json({ success: false, error: 'Doc does not belong to this product' }, { status: 400 })
    }

    return json({
      success: true,
      data: doc,
    })
  } catch (error) {
    console.error('Failed to get product doc:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product doc',
      },
      { status: 500 },
    )
  }
}

// PATCH: Update a doc
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, docId } = params
    if (!productId || !docId) {
      return json({ success: false, error: 'Product ID and Doc ID are required' }, { status: 400 })
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Verify doc exists and belongs to product
    const existingDoc = await productDocService.getById(docId)
    if (!existingDoc) {
      return json({ success: false, error: 'Doc not found' }, { status: 404 })
    }

    if (existingDoc.product_id !== productId) {
      return json({ success: false, error: 'Doc does not belong to this product' }, { status: 400 })
    }

    // TODO: Add permission check - only creator, product owner or admin can edit

    const body = await request.json()

    const input: UpdateProductDocInput = {
      title: body.title,
      content: body.content,
      display_order: body.display_order,
    }

    const updatedDoc = await productDocService.update(docId, input, user.id)

    if (!updatedDoc) {
      return json({ success: false, error: 'Failed to update doc' }, { status: 500 })
    }

    return json({
      success: true,
      data: updatedDoc,
    })
  } catch (error) {
    console.error('Failed to update product doc:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product doc',
      },
      { status: 500 },
    )
  }
}

// DELETE: Delete a doc (soft delete)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, docId } = params
    if (!productId || !docId) {
      return json({ success: false, error: 'Product ID and Doc ID are required' }, { status: 400 })
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Verify doc exists and belongs to product
    const existingDoc = await productDocService.getById(docId)
    if (!existingDoc) {
      return json({ success: false, error: 'Doc not found' }, { status: 404 })
    }

    if (existingDoc.product_id !== productId) {
      return json({ success: false, error: 'Doc does not belong to this product' }, { status: 400 })
    }

    // TODO: Add permission check - only creator, product owner or admin can delete

    const result = await productDocService.delete(docId, user.id)

    if (!result.success) {
      return json({ success: false, error: 'Failed to delete doc' }, { status: 500 })
    }

    return json({
      success: true,
      message: 'Doc deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete product doc:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product doc',
      },
      { status: 500 },
    )
  }
}
