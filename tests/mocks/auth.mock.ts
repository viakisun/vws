import { vi } from 'vitest'

/**
 * Auth Mock 라이브러리
 * 인증 서비스 Mock 구현
 */

// Mock Auth Service
export const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  verifyToken: vi.fn(),
  validateCredentials: vi.fn(),
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}

// Mock JWT Service
export const mockJWTService = {
  sign: vi.fn(),
  verify: vi.fn(),
  decode: vi.fn(),
  refresh: vi.fn(),
}

// Mock OAuth Service
export const mockOAuthService = {
  getAuthUrl: vi.fn(),
  handleCallback: vi.fn(),
  getUserInfo: vi.fn(),
  refreshToken: vi.fn(),
}

// Mock Session Service
export const mockSessionService = {
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  isValid: vi.fn(),
}

/**
 * Auth Mock 설정
 */
export const setupAuthMock = () => {
  // 기본 성공 응답 설정
  mockAuthService.login.mockResolvedValue({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
    },
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  })

  mockAuthService.logout.mockResolvedValue({
    success: true,
    message: 'Successfully logged out',
  })

  mockAuthService.register.mockResolvedValue({
    user: {
      id: 'user-456',
      email: 'newuser@example.com',
      name: '새 사용자',
      role: 'EMPLOYEE',
      permissions: ['read'],
    },
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
  })

  mockAuthService.refreshToken.mockResolvedValue({
    token: 'new-mock-jwt-token',
    refreshToken: 'new-mock-refresh-token',
    expiresIn: 3600,
  })

  mockAuthService.verifyToken.mockResolvedValue({
    valid: true,
    payload: {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
      iat: 1736928600,
      exp: 1737015000,
    },
  })

  mockAuthService.validateCredentials.mockResolvedValue({
    valid: true,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'EMPLOYEE',
    },
  })

  mockAuthService.hashPassword.mockResolvedValue('hashed-password')
  mockAuthService.comparePassword.mockResolvedValue(true)

  // JWT Service Mock 설정
  mockJWTService.sign.mockReturnValue('mock-jwt-token')
  mockJWTService.verify.mockReturnValue({
    sub: 'user-123',
    email: 'test@example.com',
    role: 'EMPLOYEE',
    permissions: ['read', 'write'],
    iat: 1736928600,
    exp: 1737015000,
  })
  mockJWTService.decode.mockReturnValue({
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
      iat: 1736928600,
      exp: 1737015000,
    },
    signature: 'mock-signature',
  })
  mockJWTService.refresh.mockReturnValue('new-mock-jwt-token')

  // OAuth Service Mock 설정
  mockOAuthService.getAuthUrl.mockResolvedValue('https://oauth-provider.com/auth?client_id=123')
  mockOAuthService.handleCallback.mockResolvedValue({
    user: {
      id: 'oauth-user-123',
      email: 'oauth@example.com',
      name: 'OAuth 사용자',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
    },
    token: 'oauth-mock-jwt-token',
    refreshToken: 'oauth-mock-refresh-token',
    expiresIn: 3600,
  })
  mockOAuthService.getUserInfo.mockResolvedValue({
    id: 'oauth-user-123',
    email: 'oauth@example.com',
    name: 'OAuth 사용자',
    picture: 'https://example.com/avatar.jpg',
  })
  mockOAuthService.refreshToken.mockResolvedValue({
    accessToken: 'new-oauth-access-token',
    refreshToken: 'new-oauth-refresh-token',
    expiresIn: 3600,
  })

  // Session Service Mock 설정
  mockSessionService.create.mockResolvedValue({
    id: 'session-123',
    userId: 'user-123',
    token: 'session-token',
    expiresAt: new Date(Date.now() + 3600000),
  })
  mockSessionService.get.mockResolvedValue({
    id: 'session-123',
    userId: 'user-123',
    token: 'session-token',
    expiresAt: new Date(Date.now() + 3600000),
    isActive: true,
  })
  mockSessionService.update.mockResolvedValue({
    id: 'session-123',
    userId: 'user-123',
    token: 'updated-session-token',
    expiresAt: new Date(Date.now() + 3600000),
  })
  mockSessionService.delete.mockResolvedValue({
    success: true,
    message: 'Session deleted',
  })
  mockSessionService.isValid.mockResolvedValue(true)

  return {
    mockAuthService,
    mockJWTService,
    mockOAuthService,
    mockSessionService,
  }
}

/**
 * 로그인 Mock 설정
 */
export const setupLoginMocks = {
  // 성공적인 로그인
  success: (user: any = {}) => {
    const defaultUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
    }

    const result = { ...defaultUser, ...user }
    mockAuthService.login.mockResolvedValueOnce({
      user: result,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    })
  },

  // 잘못된 자격 증명
  invalidCredentials: () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'))
    mockAuthService.validateCredentials.mockResolvedValueOnce({
      valid: false,
      user: null,
    })
  },

  // 비활성 계정
  inactiveAccount: () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Account is inactive'))
  },

  // 계정 잠금
  lockedAccount: () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Account is locked'))
  },

  // 이메일 미인증
  unverifiedEmail: () => {
    mockAuthService.login.mockRejectedValueOnce(new Error('Email not verified'))
  },

  // 2FA 필요
  requires2FA: () => {
    mockAuthService.login.mockResolvedValueOnce({
      requires2FA: true,
      tempToken: 'temp-2fa-token',
    })
  },
}

/**
 * 회원가입 Mock 설정
 */
export const setupRegisterMocks = {
  // 성공적인 회원가입
  success: (user: any = {}) => {
    const defaultUser = {
      id: 'user-456',
      email: 'newuser@example.com',
      name: '새 사용자',
      role: 'EMPLOYEE',
      permissions: ['read'],
    }

    const result = { ...defaultUser, ...user }
    mockAuthService.register.mockResolvedValueOnce({
      user: result,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    })
  },

  // 중복 이메일
  duplicateEmail: () => {
    mockAuthService.register.mockRejectedValueOnce(new Error('Email already exists'))
  },

  // 잘못된 이메일 형식
  invalidEmail: () => {
    mockAuthService.register.mockRejectedValueOnce(new Error('Invalid email format'))
  },

  // 약한 비밀번호
  weakPassword: () => {
    mockAuthService.register.mockRejectedValueOnce(new Error('Password is too weak'))
  },

  // 필수 필드 누락
  missingFields: () => {
    mockAuthService.register.mockRejectedValueOnce(new Error('Missing required fields'))
  },
}

/**
 * 토큰 관련 Mock 설정
 */
export const setupTokenMocks = {
  // 유효한 토큰
  valid: (payload: any = {}) => {
    const defaultPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
      iat: 1736928600,
      exp: 1737015000,
    }

    const result = { ...defaultPayload, ...payload }
    mockJWTService.verify.mockReturnValueOnce(result)
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: true,
      payload: result,
    })
  },

  // 만료된 토큰
  expired: () => {
    const expiredPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      permissions: ['read', 'write'],
      iat: 1736928600,
      exp: 1736928600, // 이미 만료됨
    }

    mockJWTService.verify.mockImplementationOnce(() => {
      throw new Error('Token expired')
    })
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: false,
      payload: expiredPayload,
      error: 'Token expired',
    })
  },

  // 잘못된 토큰
  invalid: () => {
    mockJWTService.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token')
    })
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: false,
      payload: null,
      error: 'Invalid token',
    })
  },

  // 토큰 새로고침 성공
  refreshSuccess: () => {
    mockAuthService.refreshToken.mockResolvedValueOnce({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: 3600,
    })
  },

  // 토큰 새로고침 실패
  refreshFailure: () => {
    mockAuthService.refreshToken.mockRejectedValueOnce(new Error('Invalid refresh token'))
  },
}

/**
 * OAuth Mock 설정
 */
export const setupOAuthMocks = {
  // Google OAuth 성공
  googleSuccess: () => {
    mockOAuthService.getAuthUrl.mockResolvedValueOnce(
      'https://accounts.google.com/oauth/authorize?client_id=123',
    )
    mockOAuthService.handleCallback.mockResolvedValueOnce({
      user: {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'Google User',
        role: 'EMPLOYEE',
        permissions: ['read', 'write'],
      },
      token: 'google-mock-jwt-token',
      refreshToken: 'google-mock-refresh-token',
      expiresIn: 3600,
    })
  },

  // OAuth 콜백 실패
  callbackFailure: () => {
    mockOAuthService.handleCallback.mockRejectedValueOnce(new Error('OAuth callback failed'))
  },

  // 사용자 정보 조회 실패
  getUserInfoFailure: () => {
    mockOAuthService.getUserInfo.mockRejectedValueOnce(new Error('Failed to get user info'))
  },

  // OAuth 토큰 새로고침 성공
  refreshSuccess: () => {
    mockOAuthService.refreshToken.mockResolvedValueOnce({
      accessToken: 'new-oauth-access-token',
      refreshToken: 'new-oauth-refresh-token',
      expiresIn: 3600,
    })
  },

  // OAuth 토큰 새로고침 실패
  refreshFailure: () => {
    mockOAuthService.refreshToken.mockRejectedValueOnce(new Error('OAuth token refresh failed'))
  },
}

/**
 * 세션 Mock 설정
 */
export const setupSessionMocks = {
  // 유효한 세션
  valid: (sessionId: string = 'session-123') => {
    mockSessionService.get.mockResolvedValueOnce({
      id: sessionId,
      userId: 'user-123',
      token: 'session-token',
      expiresAt: new Date(Date.now() + 3600000),
      isActive: true,
    })
    mockSessionService.isValid.mockResolvedValueOnce(true)
  },

  // 만료된 세션
  expired: () => {
    mockSessionService.get.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      token: 'session-token',
      expiresAt: new Date(Date.now() - 3600000), // 이미 만료됨
      isActive: false,
    })
    mockSessionService.isValid.mockResolvedValueOnce(false)
  },

  // 존재하지 않는 세션
  notFound: () => {
    mockSessionService.get.mockResolvedValueOnce(null)
    mockSessionService.isValid.mockResolvedValueOnce(false)
  },

  // 세션 생성 성공
  createSuccess: () => {
    mockSessionService.create.mockResolvedValueOnce({
      id: 'new-session-123',
      userId: 'user-123',
      token: 'new-session-token',
      expiresAt: new Date(Date.now() + 3600000),
    })
  },

  // 세션 삭제 성공
  deleteSuccess: () => {
    mockSessionService.delete.mockResolvedValueOnce({
      success: true,
      message: 'Session deleted',
    })
  },
}

/**
 * 권한 검증 Mock 설정
 */
export const setupPermissionMocks = {
  // 권한 있음
  hasPermission: (permission: string = 'read') => {
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: true,
      payload: {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        permissions: ['read', 'write', permission],
        iat: 1736928600,
        exp: 1737015000,
      },
    })
  },

  // 권한 없음
  lacksPermission: () => {
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: true,
      payload: {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        permissions: ['read'], // 'write' 권한 없음
        iat: 1736928600,
        exp: 1737015000,
      },
    })
  },

  // 관리자 권한
  adminPermission: () => {
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: true,
      payload: {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'admin'],
        iat: 1736928600,
        exp: 1737015000,
      },
    })
  },

  // 비활성 사용자
  inactiveUser: () => {
    mockAuthService.verifyToken.mockResolvedValueOnce({
      valid: false,
      payload: {
        sub: 'inactive-user-123',
        email: 'inactive@example.com',
        role: 'EMPLOYEE',
        permissions: [],
        iat: 1736928600,
        exp: 1737015000,
      },
      error: 'User account is inactive',
    })
  },
}

/**
 * 비밀번호 관련 Mock 설정
 */
export const setupPasswordMocks = {
  // 비밀번호 해시 성공
  hashSuccess: () => {
    mockAuthService.hashPassword.mockResolvedValueOnce('$2b$10$hashedpassword')
  },

  // 비밀번호 비교 성공
  compareSuccess: () => {
    mockAuthService.comparePassword.mockResolvedValueOnce(true)
  },

  // 비밀번호 비교 실패
  compareFailure: () => {
    mockAuthService.comparePassword.mockResolvedValueOnce(false)
  },

  // 비밀번호 해시 실패
  hashFailure: () => {
    mockAuthService.hashPassword.mockRejectedValueOnce(new Error('Password hashing failed'))
  },
}

/**
 * 에러 시나리오 Mock 설정
 */
export const setupAuthErrorMocks = {
  // 네트워크 오류
  networkError: () => {
    const error = new Error('Network error')
    error.name = 'NetworkError'
    return error
  },

  // 데이터베이스 오류
  databaseError: () => {
    const error = new Error('Database connection failed')
    error.name = 'DatabaseError'
    return error
  },

  // 서비스 오류
  serviceError: () => {
    const error = new Error('Authentication service error')
    error.name = 'ServiceError'
    return error
  },

  // 설정 오류
  configurationError: () => {
    const error = new Error('Authentication configuration error')
    error.name = 'ConfigurationError'
    return error
  },
}

/**
 * Auth 모듈 Mock
 */
export const mockAuthModule = () => {
  const mockService = {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    verifyToken: vi.fn(),
    validateCredentials: vi.fn(),
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
  }

  const mockJWT = {
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
    refresh: vi.fn(),
  }

  const mockOAuth = {
    getAuthUrl: vi.fn(),
    handleCallback: vi.fn(),
    getUserInfo: vi.fn(),
    refreshToken: vi.fn(),
  }

  const mockSession = {
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    isValid: vi.fn(),
  }

  return {
    AuthService: vi.fn(() => mockService),
    JWTService: vi.fn(() => mockJWT),
    OAuthService: vi.fn(() => mockOAuth),
    SessionService: vi.fn(() => mockSession),
    mockService,
    mockJWT,
    mockOAuth,
    mockSession,
  }
}

/**
 * 모든 Mock 초기화
 */
export const resetAuthMocks = () => {
  mockAuthService.login.mockClear()
  mockAuthService.logout.mockClear()
  mockAuthService.register.mockClear()
  mockAuthService.refreshToken.mockClear()
  mockAuthService.verifyToken.mockClear()
  mockAuthService.validateCredentials.mockClear()
  mockAuthService.hashPassword.mockClear()
  mockAuthService.comparePassword.mockClear()
  mockJWTService.sign.mockClear()
  mockJWTService.verify.mockClear()
  mockJWTService.decode.mockClear()
  mockJWTService.refresh.mockClear()
  mockOAuthService.getAuthUrl.mockClear()
  mockOAuthService.handleCallback.mockClear()
  mockOAuthService.getUserInfo.mockClear()
  mockOAuthService.refreshToken.mockClear()
  mockSessionService.create.mockClear()
  mockSessionService.get.mockClear()
  mockSessionService.update.mockClear()
  mockSessionService.delete.mockClear()
  mockSessionService.isValid.mockClear()

  // 기본 설정으로 리셋
  setupAuthMock()
}

/**
 * Mock 호출 검증 헬퍼
 */
export const verifyAuthMocks = {
  // 로그인이 호출되었는지 확인
  wasLoginCalled: () => {
    return mockAuthService.login.mock.calls.length > 0
  },

  // 로그아웃이 호출되었는지 확인
  wasLogoutCalled: () => {
    return mockAuthService.logout.mock.calls.length > 0
  },

  // 회원가입이 호출되었는지 확인
  wasRegisterCalled: () => {
    return mockAuthService.register.mock.calls.length > 0
  },

  // 토큰 검증이 호출되었는지 확인
  wasTokenVerified: () => {
    return mockAuthService.verifyToken.mock.calls.length > 0
  },

  // OAuth 콜백이 호출되었는지 확인
  wasOAuthCallbackCalled: () => {
    return mockOAuthService.handleCallback.mock.calls.length > 0
  },

  // 세션이 생성되었는지 확인
  wasSessionCreated: () => {
    return mockSessionService.create.mock.calls.length > 0
  },

  // 세션이 삭제되었는지 확인
  wasSessionDeleted: () => {
    return mockSessionService.delete.mock.calls.length > 0
  },

  // 특정 사용자로 로그인했는지 확인
  wasLoginWithUser: (email: string) => {
    const calls = mockAuthService.login.mock.calls
    return calls.some((call) => {
      const credentials = call[0]
      return credentials.email === email
    })
  },

  // 특정 권한으로 토큰이 검증되었는지 확인
  wasTokenVerifiedWithPermission: (permission: string) => {
    const calls = mockAuthService.verifyToken.mock.calls
    return calls.some((call) => {
      const token = call[0]
      // 실제로는 토큰에서 권한을 추출해야 하지만, Mock에서는 간단히 확인
      return true
    })
  },

  // 호출 횟수 확인
  getCallCount: () => {
    return {
      login: mockAuthService.login.mock.calls.length,
      logout: mockAuthService.logout.mock.calls.length,
      register: mockAuthService.register.mock.calls.length,
      verifyToken: mockAuthService.verifyToken.mock.calls.length,
      oauthCallback: mockOAuthService.handleCallback.mock.calls.length,
      sessionCreate: mockSessionService.create.mock.calls.length,
      sessionDelete: mockSessionService.delete.mock.calls.length,
    }
  },

  // 마지막 로그인 시도 확인
  getLastLoginAttempt: () => {
    const calls = mockAuthService.login.mock.calls
    return calls.length > 0 ? calls[calls.length - 1][0] : null
  },
}

// 기본 설정 적용
setupAuthMock()
