import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getPermissionMatrix } from '$lib/server/rbac/permission-matrix'

export const GET: RequestHandler = async () => {
  try {
    const data = await getPermissionMatrix()
    return json(data)
  } catch (error) {
    console.error('Failed to fetch permission matrix:', error)
    return json({ error: 'Failed to fetch permission matrix' }, { status: 500 })
  }
}
