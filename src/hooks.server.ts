import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // attach a mock role; integrate real auth later
  ;(event.locals as any).role = 'manager'

  const response = await resolve(event)
  return response
}
