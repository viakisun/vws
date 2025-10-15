import { productReferenceService } from '$lib/planner/services/product-reference.service'
import { productService } from '$lib/planner/services/product.service'
import { generatePresignedDownloadUrl } from '$lib/services/s3/s3-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET: Generate presigned download URL for a reference
export const GET: RequestHandler = async ({ params, locals, url }) => {
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
    const reference = await productReferenceService.getById(referenceId)
    if (!reference) {
      return json({ success: false, error: 'Reference not found' }, { status: 404 })
    }

    if (reference.product_id !== productId) {
      return json(
        { success: false, error: 'Reference does not belong to this product' },
        { status: 400 },
      )
    }

    // Check if this is for thumbnail or main file
    const isThumbnail = url.searchParams.get('thumbnail') === 'true'

    let s3Key: string | undefined
    if (isThumbnail) {
      s3Key = reference.thumbnail_url?.replace(/^https?:\/\/[^/]+\//, '') // Extract key from URL if it's a full URL
    } else {
      s3Key = reference.s3_key
    }

    if (!s3Key && !reference.url) {
      return json({ success: false, error: 'No downloadable content available' }, { status: 404 })
    }

    // If it's a URL reference, return the URL directly
    if (reference.url && !isThumbnail && !s3Key) {
      return json({
        success: true,
        data: {
          downloadUrl: reference.url,
          isExternal: true,
        },
      })
    }

    if (!s3Key) {
      return json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Generate presigned download URL for S3 file
    const downloadUrl = await generatePresignedDownloadUrl(s3Key, 300) // 5 minutes

    return json({
      success: true,
      data: {
        downloadUrl,
        isExternal: false,
        fileName: reference.file_name,
        fileSize: reference.file_size,
        mimeType: reference.mime_type,
      },
    })
  } catch (error) {
    console.error('Failed to generate download URL:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download URL',
      },
      { status: 500 },
    )
  }
}
