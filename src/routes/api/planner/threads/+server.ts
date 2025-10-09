import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { threadService } from '$lib/planner/services/thread.service'
import type { CreateThreadInput, ThreadFilters } from '$lib/planner/types'

// List threads with filters
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const filters: ThreadFilters = {}

    const initiative_id = url.searchParams.get('initiative_id')
    if (initiative_id) filters.initiative_id = initiative_id

    const owner_id = url.searchParams.get('owner_id')
    if (owner_id) filters.owner_id = owner_id

    const contributor_id = url.searchParams.get('contributor_id')
    if (contributor_id) filters.contributor_id = contributor_id

    const state = url.searchParams.get('state')
    if (state) {
      filters.state = state.split(',') as any
    }

    const shape = url.searchParams.get('shape')
    if (shape) {
      filters.shape = shape.split(',') as any
    }

    const search = url.searchParams.get('search')
    if (search) filters.search = search

    const limit = url.searchParams.get('limit')
    if (limit) filters.limit = parseInt(limit)

    const offset = url.searchParams.get('offset')
    if (offset) filters.offset = parseInt(offset)

    const threads = await threadService.list(filters)

    return json({
      success: true,
      data: threads,
    })
  } catch (error) {
    console.error('Failed to list threads:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list threads',
      },
      { status: 500 },
    )
  }
}

// Create new thread
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: CreateThreadInput = {
      initiative_id: body.initiative_id,
      title: body.title,
      body: body.body,
      shape: body.shape,
      owner_id: user.id, // Use logged-in user's ID
      external_links: body.external_links || [],
      contributor_ids: body.contributor_ids || [],
      mentions: body.mentions || [],
    }

    if (!input.initiative_id || !input.title || !input.shape) {
      return json(
        {
          success: false,
          error: 'Missing required fields: initiative_id, title, shape',
        },
        { status: 400 },
      )
    }

    const thread = await threadService.create(input, user.id)

    return json({
      success: true,
      data: thread,
    })
  } catch (error) {
    console.error('Failed to create thread:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create thread',
      },
      { status: 500 },
    )
  }
}
