import { GoogleOAuthService } from '$lib/auth/google-oauth'
import { logger } from '$lib/utils/logger'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  try {
    const googleOAuth = GoogleOAuthService.getInstance()
    const authUrl = googleOAuth.getAuthUrl()
    
    logger.info('Redirecting to Google OAuth:', authUrl)
    throw redirect(302, authUrl)
  } catch (error) {
    // Check if this is a redirect response (not an actual error)
    if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
      // This is a normal redirect, not an error
      throw error
    }
    
    // This is an actual error
    logger.error('Google OAuth initiation error:', error)
    throw redirect(302, '/login?error=oauth_init_failed')
  }
}
