import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { productService } from '$lib/planner/services/product.service'
import type { CreateProductInput, ProductFilters } from '$lib/planner/types'

// GET: List products
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const filters: ProductFilters = {
      status: (url.searchParams.get('status') as 'active' | 'archived') || undefined,
      owner_id: url.searchParams.get('owner_id') || undefined,
      search: url.searchParams.get('search') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '100'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    }

    const products = await productService.list(filters)

    return json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('Failed to list products:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list products',
      },
      { status: 500 },
    )
  }
}

// POST: Create product
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: CreateProductInput = {
      name: body.name,
      code: body.code,
      description: body.description,
      owner_id: body.owner_id || user.id,
      repository_url: body.repository_url,
      documentation_url: body.documentation_url,
    }

    if (!input.name || !input.code) {
      return json(
        {
          success: false,
          error: 'Missing required fields: name, code',
        },
        { status: 400 },
      )
    }

    const product = await productService.create(input, user.id)

    return json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Failed to create product:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      },
      { status: 500 },
    )
  }
}
