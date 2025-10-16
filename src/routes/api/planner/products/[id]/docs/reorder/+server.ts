import { productDocService } from '$lib/planner/services/product-doc.service'
import { productService } from '$lib/planner/services/product.service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// Reorder docs within a product
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
    const { docIds } = body

    if (!Array.isArray(docIds)) {
      return json({ success: false, error: 'docIds must be an array' }, { status: 400 })
    }

    // Update the display_order for each doc
    const updatePromises = docIds.map((docId: string, index: number) => {
      return productDocService.update(docId, { display_order: index }, user.id)
    })

    await Promise.all(updatePromises)

    return json({
      success: true,
      message: 'Docs reordered successfully',
    })
  } catch (error) {
    console.error('Failed to reorder docs:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder docs',
      },
      { status: 500 },
    )
  }
}
