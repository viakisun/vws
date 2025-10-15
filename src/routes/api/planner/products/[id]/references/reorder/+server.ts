import { productReferenceService } from '$lib/planner/services/product-reference.service'
import { productService } from '$lib/planner/services/product.service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// Reorder references within a product
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = params
    if (!productId) {
      return json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json()
    const { referenceIds } = body

    if (!Array.isArray(referenceIds)) {
      return json({ success: false, error: 'referenceIds must be an array' }, { status: 400 })
    }

    // Update the display_order for each reference
    const updatePromises = referenceIds.map((referenceId: string, index: number) => {
      return productReferenceService.update(referenceId, { display_order: index }, user.id)
    })

    await Promise.all(updatePromises)

    return json({
      success: true,
      message: 'References reordered successfully',
    })
  } catch (error) {
    console.error('Failed to reorder references:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder references',
      },
      { status: 500 },
    )
  }
}
