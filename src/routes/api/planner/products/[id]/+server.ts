import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { productService } from '$lib/planner/services/product.service'
import type { UpdateProductInput } from '$lib/planner/types'

// GET: Get product by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const product = await productService.getById(params.id)

    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Failed to get product:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product',
      },
      { status: 500 },
    )
  }
}

// PUT: Update product
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: UpdateProductInput = {
      name: body.name,
      code: body.code,
      description: body.description,
      owner_id: body.owner_id,
      status: body.status,
      repository_url: body.repository_url,
      documentation_url: body.documentation_url,
      category: body.category,
      display_order: body.display_order,
    }

    const product = await productService.update(params.id, input, user.id)

    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    return json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Failed to update product:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      },
      { status: 500 },
    )
  }
}

// DELETE: Delete product (soft delete)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const success = await productService.delete(params.id, user.id)

    if (!success) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    return json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      },
      { status: 500 },
    )
  }
}
