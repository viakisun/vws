/**
 * 사용자 관련 테스트 데이터 Fixtures
 */

export const USER_FIXTURES = {
  /**
   * 인증된 사용자 테스트 데이터
   */
  authenticated: {
    admin: {
      id: 'user-admin-123',
      email: 'admin@company.com',
      name: '관리자',
      role: 'ADMIN',
      permissions: [
        'read',
        'write',
        'delete',
        'admin',
        'user_management',
        'system_config',
      ],
      employee_id: 'EMP001',
      is_active: true,
      last_login: '2025-01-15T10:30:00.000Z',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    manager: {
      id: 'user-manager-123',
      email: 'manager@company.com',
      name: '팀장',
      role: 'MANAGER',
      permissions: [
        'read',
        'write',
        'approve',
        'team_management',
      ],
      employee_id: 'EMP002',
      is_active: true,
      last_login: '2025-01-14T15:45:00.000Z',
      created_at: '2024-02-01T00:00:00.000Z',
      updated_at: '2025-01-14T00:00:00.000Z',
    },
    employee: {
      id: 'user-employee-123',
      email: 'employee@company.com',
      name: '직원',
      role: 'EMPLOYEE',
      permissions: [
        'read',
        'write_own',
      ],
      employee_id: 'EMP003',
      is_active: true,
      last_login: '2025-01-15T09:00:00.000Z',
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2025-01-15T00:00:00.000Z',
    },
    contractor: {
      id: 'user-contractor-123',
      email: 'contractor@external.com',
      name: '계약직',
      role: 'CONTRACTOR',
      permissions: [
        'read',
        'write_own',
      ],
      employee_id: 'CON001',
      is_active: true,
      last_login: '2025-01-13T14:20:00.000Z',
      created_at: '2024-06-01T00:00:00.000Z',
      updated_at: '2025-01-13T00:00:00.000Z',
    },
    viewer: {
      id: 'user-viewer-123',
      email: 'viewer@company.com',
      name: '조회전용',
      role: 'VIEWER',
      permissions: [
        'read',
      ],
      employee_id: 'EMP004',
      is_active: true,
      last_login: '2025-01-12T11:15:00.000Z',
      created_at: '2024-04-01T00:00:00.000Z',
      updated_at: '2025-01-12T00:00:00.000Z',
    },
  },

  /**
   * 인증되지 않은 사용자
   */
  unauthenticated: {
    guest: {
      id: null,
      email: null,
      name: null,
      role: null,
      permissions: [],
      employee_id: null,
      is_active: false,
      last_login: null,
      created_at: null,
      updated_at: null,
    },
  },

  /**
   * 비활성 사용자
   */
  inactive: {
    disabled: {
      id: 'user-disabled-123',
      email: 'disabled@company.com',
      name: '비활성 사용자',
      role: 'EMPLOYEE',
      permissions: [],
      employee_id: 'EMP005',
      is_active: false,
      last_login: '2024-12-01T10:00:00.000Z',
      created_at: '2024-05-01T00:00:00.000Z',
      updated_at: '2024-12-01T00:00:00.000Z',
    },
    suspended: {
      id: 'user-suspended-123',
      email: 'suspended@company.com',
      name: '정지된 사용자',
      role: 'EMPLOYEE',
      permissions: [],
      employee_id: 'EMP006',
      is_active: false,
      last_login: '2024-11-15T14:30:00.000Z',
      suspension_reason: '정책 위반',
      suspension_until: '2025-02-15T00:00:00.000Z',
      created_at: '2024-06-01T00:00:00.000Z',
      updated_at: '2024-11-15T00:00:00.000Z',
    },
  },

  /**
   * 권한 테스트 데이터
   */
  permissions: {
    all: [
      'read',
      'write',
      'delete',
      'admin',
      'user_management',
      'system_config',
      'approve',
      'team_management',
      'write_own',
      'finance_read',
      'finance_write',
      'hr_read',
      'hr_write',
      'crm_read',
      'crm_write',
      'rd_read',
      'rd_write',
    ],
    admin: [
      'read',
      'write',
      'delete',
      'admin',
      'user_management',
      'system_config',
    ],
    manager: [
      'read',
      'write',
      'approve',
      'team_management',
    ],
    employee: [
      'read',
      'write_own',
    ],
    viewer: [
      'read',
    ],
    finance: [
      'read',
      'finance_read',
      'finance_write',
    ],
    hr: [
      'read',
      'hr_read',
      'hr_write',
    ],
    crm: [
      'read',
      'crm_read',
      'crm_write',
    ],
    rd: [
      'read',
      'rd_read',
      'rd_write',
    ],
  },

  /**
   * 역할 테스트 데이터
   */
  roles: {
    admin: {
      name: 'ADMIN',
      description: '시스템 관리자',
      permissions: 'all',
      level: 100,
    },
    manager: {
      name: 'MANAGER',
      description: '팀 관리자',
      permissions: 'manager',
      level: 80,
    },
    employee: {
      name: 'EMPLOYEE',
      description: '일반 직원',
      permissions: 'employee',
      level: 60,
    },
    contractor: {
      name: 'CONTRACTOR',
      description: '계약직 직원',
      permissions: 'employee',
      level: 40,
    },
    viewer: {
      name: 'VIEWER',
      description: '조회 전용',
      permissions: 'viewer',
      level: 20,
    },
  },

  /**
   * 세션 테스트 데이터
   */
  sessions: {
    valid: {
      id: 'session-valid-123',
      user_id: 'user-admin-123',
      token: 'valid-jwt-token-123',
      expires_at: '2025-01-16T10:30:00.000Z',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
      is_active: true,
    },
    expired: {
      id: 'session-expired-123',
      user_id: 'user-admin-123',
      token: 'expired-jwt-token-123',
      expires_at: '2025-01-14T10:30:00.000Z',
      created_at: '2025-01-14T10:30:00.000Z',
      updated_at: '2025-01-14T10:30:00.000Z',
      is_active: false,
    },
    invalid: {
      id: 'session-invalid-123',
      user_id: 'user-admin-123',
      token: 'invalid-jwt-token-123',
      expires_at: '2025-01-16T10:30:00.000Z',
      created_at: '2025-01-15T10:30:00.000Z',
      updated_at: '2025-01-15T10:30:00.000Z',
      is_active: false,
    },
  },

  /**
   * Google OAuth 테스트 데이터
   */
  oauth: {
    google: {
      profile: {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
        given_name: 'Google',
        family_name: 'User',
        locale: 'ko',
        verified_email: true,
      },
      tokens: {
        access_token: 'google-access-token-123',
        refresh_token: 'google-refresh-token-123',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid email profile',
      },
    },
    invalid: {
      profile: null,
      tokens: {
        access_token: 'invalid-token',
        refresh_token: 'invalid-refresh-token',
        expires_in: 0,
        token_type: 'Bearer',
        scope: 'openid email profile',
      },
    },
  },

  /**
   * JWT 토큰 테스트 데이터
   */
  jwt: {
    valid: {
      header: {
        alg: 'HS256',
        typ: 'JWT',
      },
      payload: {
        sub: 'user-admin-123',
        email: 'admin@company.com',
        name: '관리자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'admin'],
        iat: 1736928600, // 2025-01-15T10:30:00.000Z
        exp: 1737015000, // 2025-01-16T10:30:00.000Z
        iss: 'vws-app',
        aud: 'vws-users',
      },
      signature: 'valid-signature',
    },
    expired: {
      header: {
        alg: 'HS256',
        typ: 'JWT',
      },
      payload: {
        sub: 'user-admin-123',
        email: 'admin@company.com',
        name: '관리자',
        role: 'ADMIN',
        permissions: ['read', 'write', 'delete', 'admin'],
        iat: 1736842200, // 2025-01-14T10:30:00.000Z
        exp: 1736928600, // 2025-01-15T10:30:00.000Z (만료됨)
        iss: 'vws-app',
        aud: 'vws-users',
      },
      signature: 'expired-signature',
    },
    invalid: {
      header: {
        alg: 'HS256',
        typ: 'JWT',
      },
      payload: {
        sub: 'invalid-user',
        email: 'invalid@company.com',
        name: 'Invalid User',
        role: 'EMPLOYEE',
        permissions: [],
        iat: 1736928600,
        exp: 1737015000,
        iss: 'vws-app',
        aud: 'vws-users',
      },
      signature: 'invalid-signature',
    },
  },

  /**
   * 쿠키 테스트 데이터
   */
  cookies: {
    valid: {
      name: 'session_token',
      value: 'valid-jwt-token-123',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    },
    expired: {
      name: 'session_token',
      value: 'expired-jwt-token-123',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    },
    invalid: {
      name: 'session_token',
      value: 'invalid-jwt-token-123',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    },
  },

  /**
   * 에러 시나리오 테스트 데이터
   */
  errors: {
    authentication: {
      invalidCredentials: {
        email: 'wrong@company.com',
        password: 'wrongpassword',
      },
      expiredToken: {
        token: 'expired-jwt-token-123',
      },
      invalidToken: {
        token: 'invalid-jwt-token-123',
      },
      missingToken: {
        token: null,
      },
    },
    authorization: {
      insufficientPermissions: {
        required: ['admin'],
        actual: ['read', 'write'],
      },
      roleMismatch: {
        required: 'ADMIN',
        actual: 'EMPLOYEE',
      },
      resourceAccess: {
        resourceOwner: 'user-employee-123',
        requestingUser: 'user-admin-123',
        resourceType: 'employee_data',
      },
    },
    validation: {
      invalidEmail: {
        email: 'invalid-email',
      },
      missingRequired: {
        name: '',
        email: '',
      },
      duplicateEmail: {
        email: 'admin@company.com',
      },
    },
    notFound: {
      userId: 'non-existent-user',
      sessionId: 'non-existent-session',
      token: 'non-existent-token',
    },
    serverError: {
      databaseConnection: 'Database connection failed',
      jwtGeneration: 'JWT generation failed',
      oauthProvider: 'OAuth provider unavailable',
    },
  },

  /**
   * 검색 및 필터링 테스트 데이터
   */
  search: {
    queries: {
      name: '관리자',
      email: 'admin@company.com',
      role: 'ADMIN',
      department: '개발팀',
      employeeId: 'EMP001',
    },
    filters: {
      status: ['active', 'inactive'],
      role: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      department: ['개발팀', '마케팅팀'],
      lastLoginRange: {
        start: '2025-01-01',
        end: '2025-01-31',
      },
      createdRange: {
        start: '2024-01-01',
        end: '2024-12-31',
      },
    },
    sortOptions: {
      name: 'asc',
      email: 'asc',
      last_login: 'desc',
      created_at: 'desc',
      role: 'asc',
    },
  },

  /**
   * 테스트 시나리오 데이터
   */
  scenarios: {
    login: {
      success: {
        email: 'admin@company.com',
        password: 'correctpassword',
        expectedRole: 'ADMIN',
        expectedPermissions: ['read', 'write', 'delete', 'admin'],
      },
      failure: {
        email: 'admin@company.com',
        password: 'wrongpassword',
        expectedError: 'Invalid credentials',
      },
    },
    permissionCheck: {
      hasPermission: {
        user: 'user-admin-123',
        permission: 'admin',
        expectedResult: true,
      },
      lacksPermission: {
        user: 'user-employee-123',
        permission: 'admin',
        expectedResult: false,
      },
    },
    roleCheck: {
      hasRole: {
        user: 'user-admin-123',
        role: 'ADMIN',
        expectedResult: true,
      },
      lacksRole: {
        user: 'user-employee-123',
        role: 'ADMIN',
        expectedResult: false,
      },
    },
    sessionManagement: {
      createSession: {
        user: 'user-admin-123',
        expectedTokenType: 'JWT',
        expectedExpiration: 86400,
      },
      refreshSession: {
        user: 'user-admin-123',
        oldToken: 'valid-jwt-token-123',
        expectedNewToken: true,
      },
      invalidateSession: {
        user: 'user-admin-123',
        token: 'valid-jwt-token-123',
        expectedResult: true,
      },
    },
  },
} as const

/**
 * 테스트용 배열 데이터 생성 헬퍼
 */
export const createUserTestArrays = {
  users: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...USER_FIXTURES.authenticated.employee,
      id: `user-${i + 1}`,
      email: `user${i + 1}@company.com`,
      name: `사용자 ${i + 1}`,
      employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
      role: ['EMPLOYEE', 'MANAGER', 'ADMIN'][i % 3],
    })),

  sessions: (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      ...USER_FIXTURES.sessions.valid,
      id: `session-${i + 1}`,
      user_id: `user-${i + 1}`,
      token: `jwt-token-${i + 1}`,
      created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    })),

  permissions: (count: number) => 
    Array.from({ length: count }, (_, i) => 
      USER_FIXTURES.permissions.all[i % USER_FIXTURES.permissions.all.length]
    ),
}
