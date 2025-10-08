import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/unauthorized']

  // If user is not authenticated and trying to access protected route
  if (!locals.user && !publicRoutes.includes(url.pathname)) {
    throw redirect(302, '/login')
  }

  // If user is authenticated and trying to access login page
  if (locals.user && url.pathname === '/login') {
    throw redirect(302, '/dashboard')
  }

  return {
    user: locals.user,
    permissions: locals.permissions,
  }
}
