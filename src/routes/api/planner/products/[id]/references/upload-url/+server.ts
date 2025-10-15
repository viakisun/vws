import { productService } from '$lib/planner/services/product.service'
import { generateProductReferenceS3Key } from '$lib/services/s3/s3-planner.service'
import { generatePresignedUploadUrl } from '$lib/services/s3/s3-service'
import { sanitizeFilename } from '$lib/utils/file-validation'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// POST: Generate presigned upload URL for product reference
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
    const { fileName, fileSize, contentType } = body

    if (!fileName) {
      return json({ success: false, error: 'File name is required' }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (fileSize && fileSize > maxSize) {
      return json(
        {
          success: false,
          error: 'File size exceeds 50MB limit',
        },
        { status: 400 },
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
    ]

    const mimeType = contentType || 'application/octet-stream'
    if (contentType && !allowedTypes.includes(contentType)) {
      return json(
        {
          success: false,
          error: 'File type not allowed',
        },
        { status: 400 },
      )
    }

    // Generate S3 key for the file
    const sanitizedFileName = sanitizeFilename(fileName)
    const s3Key = generateProductReferenceS3Key(productId, sanitizedFileName)

    // Generate presigned upload URL
    const uploadUrl = await generatePresignedUploadUrl(
      s3Key,
      mimeType,
      900, // 15 minutes
    )

    return json({
      success: true,
      data: {
        uploadUrl,
        s3Key,
      },
    })
  } catch (error) {
    console.error('Failed to generate upload URL:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL',
      },
      { status: 500 },
    )
  }
}
