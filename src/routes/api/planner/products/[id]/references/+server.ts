import { productReferenceService } from '$lib/planner/services/product-reference.service'
import { productService } from '$lib/planner/services/product.service'
import type {
  CreateProductReferenceInput,
  ProductReferenceFilters,
  ProductReferenceType,
} from '$lib/planner/types'
import { detectLinkType } from '$lib/utils/link-detector'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: Get all references for a product
export const GET: RequestHandler = async ({ params, locals, url }) => {
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

    // Get query parameters for filtering
    const type = url.searchParams.get('type')
    const search = url.searchParams.get('search')
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')

    const filters: ProductReferenceFilters = {
      product_id: productId,
      type: type ? (type as ProductReferenceType) : undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    }

    const references = await productReferenceService.list(filters)

    return json({
      success: true,
      data: references,
    })
  } catch (error) {
    console.error('Failed to get product references:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error,
    })
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product references',
      },
      { status: 500 },
    )
  }
}

// POST: Create a new reference
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

    // Verify product exists and check permissions
    const product = await productService.getById(productId)
    if (!product) {
      return json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // TODO: Add permission check - only product owner or admin can add references
    // For now, allow all authenticated users

    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    // Auto-detect type if URL is provided and type is not specified
    if (body.url && !body.type) {
      body.type = detectLinkType(body.url, body.file_name)
    }

    const input: CreateProductReferenceInput = {
      product_id: productId,
      title: body.title,
      description: body.description || undefined,
      type: body.type || 'other',
      url: body.url || undefined,
      s3_key: body.s3_key || undefined,
      file_name: body.file_name || undefined,
      file_size: body.file_size || undefined,
      mime_type: body.mime_type || undefined,
      thumbnail_url: body.thumbnail_url || undefined,
      metadata: body.metadata || undefined,
      display_order: body.display_order || undefined,
    }

    const reference = await productReferenceService.create(input, user.id)

    return json({
      success: true,
      data: reference,
    })
  } catch (error) {
    console.error('Failed to create product reference:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product reference',
      },
      { status: 500 },
    )
  }
}
