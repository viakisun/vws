import { productDocService } from '$lib/planner/services/product-doc.service'
import { productService } from '$lib/planner/services/product.service'
import type { CreateProductDocInput } from '$lib/planner/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: Get all docs for a product
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id
    if (!productId) {
      return json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const docs = await productDocService.getByProductId(productId)

    return json({
      success: true,
      data: docs,
    })
  } catch (error) {
    console.error('Failed to get product docs:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product docs',
      },
      { status: 500 },
    )
  }
}

// POST: Create a new doc
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id
    if (!productId) {
      return json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    // Verify product exists
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    if (!body.content) {
      return json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    const input: CreateProductDocInput = {
      product_id: productId,
      title: body.title,
      content: body.content,
      display_order: body.display_order || undefined,
    }

    const doc = await productDocService.create(input, user.id)

    return json({
      success: true,
      data: doc,
    })
  } catch (error) {
    console.error('Failed to create product doc:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product doc',
      },
      { status: 500 },
    )
  }
}
