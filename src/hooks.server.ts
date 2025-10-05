import { UserService } from '$lib/auth/user-service'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // Authentication middleware
  try {
    const token = event.cookies.get('auth_token')
    
    if (token) {
      const userService = UserService.getInstance()
      const payload = userService.verifyToken(token)
      const user = await userService.getUserById(payload.userId)
      
      if (user && user.is_active) {
        event.locals.user = user
      }
    }
  } catch (error) {
    // Invalid token, clear cookie
    event.cookies.delete('auth_token', { path: '/' })
  }

  return resolve(event)
}