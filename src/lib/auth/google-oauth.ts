import { config } from '$lib/utils/config'

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
  verified_email: boolean
}

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export class GoogleOAuthService {
  private static instance: GoogleOAuthService
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly allowedDomains: string[]
  private readonly adminEmails: string[]

  private constructor() {
    this.clientId = config.google.clientId
    this.clientSecret = config.google.clientSecret
    this.redirectUri = config.google.redirectUri
    this.allowedDomains = config.auth.allowedDomains
    this.adminEmails = config.auth.adminEmails
  }

  public static getInstance(): GoogleOAuthService {
    if (!GoogleOAuthService.instance) {
      GoogleOAuthService.instance = new GoogleOAuthService()
    }
    return GoogleOAuthService.instance
  }

  /**
   * Google OAuth 로그인 URL 생성
   */
  public getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account'
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * Authorization code를 access token으로 교환
   */
  public async getTokens(code: string): Promise<GoogleTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code for tokens: ${error}`)
    }

    return await response.json()
  }

  /**
   * Access token으로 사용자 정보 가져오기
   */
  public async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get user info: ${error}`)
    }

    return await response.json()
  }

  /**
   * 허용된 도메인인지 확인
   */
  public isAllowedDomain(email: string): boolean {
    const domain = email.split('@')[1]
    return this.allowedDomains.includes(domain)
  }

  /**
   * 사용자 역할 결정
   */
  public determineUserRole(email: string): string {
    if (this.adminEmails.includes(email)) {
      return 'ADMIN'
    }
    return 'EMPLOYEE'
  }
}
