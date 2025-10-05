import { GoogleOAuthService } from '$lib/auth/google-oauth'
import { UserService } from '$lib/auth/user-service'
import { logger } from '$lib/utils/logger'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    logger.info('Google OAuth callback received:', { url: url.toString() })

    const googleOAuth = GoogleOAuthService.getInstance()
    const userService = UserService.getInstance()

    // Get authorization code from query parameters
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    logger.info('Callback parameters:', { code: !!code, state, error })

    if (error) {
      logger.error('Google OAuth error:', error)
      throw redirect(302, '/login?error=oauth_error')
    }

    if (!code) {
      logger.error('No authorization code received')
      throw redirect(302, '/login?error=no_code')
    }

    // Exchange code for tokens
    const tokens = await googleOAuth.getTokens(code)

    // Get user info from Google
    const googleUserInfo = await googleOAuth.getUserInfo(tokens.access_token)

    // Verify domain
    if (!googleOAuth.isAllowedDomain(googleUserInfo.email)) {
      logger.warn('Unauthorized domain attempt:', { email: googleUserInfo.email })
      throw redirect(302, '/login?error=unauthorized_domain')
    }

    // Determine user role
    const role = googleOAuth.determineUserRole(googleUserInfo.email)

    // Create or update user
    const user = await userService.createOrUpdateUser({
      email: googleUserInfo.email,
      name: googleUserInfo.name,
      role,
      picture: googleUserInfo.picture,
    })

    // Update last login
    await userService.updateLastLogin(user.id)

    // Generate JWT token
    const token = userService.generateToken(user)

    // Clear any existing auth token first
    cookies.delete('auth_token', { path: '/' })

    // Set secure cookie
    cookies.set('auth_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    logger.info('User logged in successfully:', {
      email: user.email,
      role: user.role,
    })

    // Redirect to success page first, then to dashboard
    throw redirect(302, '/login?success=oauth_success')
  } catch (error) {
    // Check if this is a redirect response (not an actual error)
    if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
      // This is a normal redirect, not an error
      throw error
    }

    // This is an actual error
    logger.error('Google OAuth callback error:', error)
    throw redirect(302, '/login?error=oauth_failed')
  }
}
