import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { threadService } from '$lib/planner/services/thread.service'
import type { CreateThreadReplyInput } from '$lib/planner/types'

// Get thread replies
export const GET: RequestHandler = async ({ params, url, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const limit = url.searchParams.get('limit')
    const replies = await threadService.getReplies(params.id, limit ? parseInt(limit) : 50)

    return json({
      success: true,
      data: replies,
    })
  } catch (error) {
    console.error('Failed to get thread replies:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get thread replies',
      },
      { status: 500 },
    )
  }
}

// Create thread reply
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user
    if (!user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input: CreateThreadReplyInput = {
      thread_id: params.id,
      author_id: user.id,
      content: body.content,
      mentions: body.mentions || [],
    }

    if (!input.content) {
      return json(
        {
          success: false,
          error: 'Missing required field: content',
        },
        { status: 400 },
      )
    }

    const reply = await threadService.createReply(input, user.id)

    return json({
      success: true,
      data: reply,
    })
  } catch (error) {
    console.error('Failed to create thread reply:', error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create thread reply',
      },
      { status: 500 },
    )
  }
}
