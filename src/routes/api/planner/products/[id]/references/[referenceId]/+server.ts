import { productReferenceService } from '$lib/planner/services/product-reference.service'
import { productService } from '$lib/planner/services/product.service'
import type { UpdateProductReferenceInput } from '$lib/planner/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: Get a specific reference
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, referenceId } = params
    if (!productId || !referenceId) {
      return json(
        { success: false, error: 'Product ID and Reference ID are required' },
        { status: 400 },
      )
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const reference = await productReferenceService.getById(referenceId)
    if (!reference) {
      return json({ success: false, error: 'Reference not found' }, { status: 404 })
    }

    // Verify the reference belongs to this product
    if (reference.product_id !== productId) {
      return json(
        { success: false, error: 'Reference does not belong to this product' },
        { status: 400 },
      )
    }

    return json({
      success: true,
      data: reference,
    })
  } catch (error) {
    console.error('Failed to get product reference:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product reference',
      },
      { status: 500 },
    )
  }
}

// PATCH: Update a reference
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, referenceId } = params
    if (!productId || !referenceId) {
      return json(
        { success: false, error: 'Product ID and Reference ID are required' },
        { status: 400 },
      )
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Verify reference exists and belongs to product
    const existingReference = await productReferenceService.getById(referenceId)
    if (!existingReference) {
      return json({ success: false, error: 'Reference not found' }, { status: 404 })
    }

    if (existingReference.product_id !== productId) {
      return json(
        { success: false, error: 'Reference does not belong to this product' },
        { status: 400 },
      )
    }

    // TODO: Add permission check - only creator, product owner or admin can edit

    const body = await request.json()

    const input: UpdateProductReferenceInput = {
      title: body.title,
      description: body.description,
      type: body.type,
      url: body.url,
      display_order: body.display_order,
      metadata: body.metadata,
    }

    const updatedReference = await productReferenceService.update(referenceId, input, user.id)

    if (!updatedReference) {
      return json({ success: false, error: 'Failed to update reference' }, { status: 500 })
    }

    return json({
      success: true,
      data: updatedReference,
    })
  } catch (error) {
    console.error('Failed to update product reference:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product reference',
      },
      { status: 500 },
    )
  }
}

// DELETE: Delete a reference (soft delete)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, referenceId } = params
    if (!productId || !referenceId) {
      return json(
        { success: false, error: 'Product ID and Reference ID are required' },
        { status: 400 },
      )
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Verify reference exists and belongs to product
    const existingReference = await productReferenceService.getById(referenceId)
    if (!existingReference) {
      return json({ success: false, error: 'Reference not found' }, { status: 404 })
    }

    if (existingReference.product_id !== productId) {
      return json(
        { success: false, error: 'Reference does not belong to this product' },
        { status: 400 },
      )
    }

    // TODO: Add permission check - only creator, product owner or admin can delete

    const result = await productReferenceService.delete(referenceId, user.id)

    if (!result.success) {
      return json({ success: false, error: 'Failed to delete reference' }, { status: 500 })
    }

    return json({
      success: true,
      data: {
        deletedS3Key: result.s3Key, // For potential cleanup
      },
    })
  } catch (error) {
    console.error('Failed to delete product reference:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product reference',
      },
      { status: 500 },
    )
  }
}
