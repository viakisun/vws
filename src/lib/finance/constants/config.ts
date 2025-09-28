// 자금일보 시스템 설정
export const FINANCE_CONFIG = {
  // 자금일보 발송 설정
  DAILY_REPORT: {
    ENABLED: true,
    SEND_TIME: '09:00', // 매일 오전 9시
    TIMEZONE: 'Asia/Seoul',
    RECIPIENTS: [], // 이메일 수신자 목록
    INCLUDE_CHARTS: true,
    INCLUDE_PREDICTIONS: true,
    INCLUDE_ALERTS: true,
  },

  // 알림 설정
  ALERTS: {
    LOW_BALANCE_THRESHOLD: 1000000, // 100만원
    HIGH_EXPENSE_THRESHOLD: 5000000, // 500만원
    BUDGET_EXCEEDED_THRESHOLD: 0.9, // 예산의 90%
    UNUSUAL_TRANSACTION_THRESHOLD: 10000000, // 1000만원
    EMAIL_NOTIFICATIONS: true,
    SMS_NOTIFICATIONS: false,
    PUSH_NOTIFICATIONS: true,
  },

  // 예산 설정
  BUDGET: {
    DEFAULT_PERIOD: 'monthly',
    AUTO_CREATE_RECURRING: true,
    WARNING_THRESHOLD: 0.8, // 예산의 80% 사용 시 경고
    CRITICAL_THRESHOLD: 0.95, // 예산의 95% 사용 시 위험
    ALLOW_OVER_BUDGET: false,
    AUTO_ADJUSTMENT: false,
  },

  // 거래 설정
  TRANSACTIONS: {
    AUTO_CATEGORIZATION: true,
    DUPLICATE_DETECTION: true,
    DUPLICATE_WINDOW_DAYS: 7,
    MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOW_FUTURE_DATES: true,
    ALLOW_PAST_DATES: true,
    MAX_PAST_DAYS: 365,
  },

  // 계좌 설정
  ACCOUNTS: {
    ALLOW_MULTIPLE_PRIMARY: false,
    AUTO_BALANCE_UPDATE: true,
    LOW_BALANCE_ALERTS: true,
    ACCOUNT_NUMBER_VALIDATION: true,
    MIN_BALANCE_THRESHOLD: 0,
  },

  // 리포트 설정
  REPORTS: {
    DEFAULT_FORMAT: 'pdf',
    AUTO_GENERATION: true,
    RETENTION_DAYS: 365,
    INCLUDE_CHARTS: true,
    INCLUDE_DETAILS: true,
    MAX_RECIPIENTS: 10,
  },

  // 데이터 백업 설정
  BACKUP: {
    ENABLED: true,
    FREQUENCY: 'daily',
    RETENTION_DAYS: 30,
    INCLUDE_ATTACHMENTS: true,
    COMPRESSION: true,
  },

  // 보안 설정
  SECURITY: {
    ENCRYPT_SENSITIVE_DATA: true,
    AUDIT_LOG_ENABLED: true,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30분
    MAX_LOGIN_ATTEMPTS: 5,
    PASSWORD_MIN_LENGTH: 8,
  },

  // 성능 설정
  PERFORMANCE: {
    CACHE_ENABLED: true,
    CACHE_TTL: 5 * 60 * 1000, // 5분
    BATCH_SIZE: 100,
    PAGINATION_SIZE: 50,
    MAX_CONCURRENT_REQUESTS: 10,
  },

  // 통합 설정
  INTEGRATIONS: {
    BANK_API_ENABLED: false,
    EMAIL_SERVICE_ENABLED: true,
    SMS_SERVICE_ENABLED: false,
    CLOUD_STORAGE_ENABLED: false,
    ANALYTICS_ENABLED: true,
  },
} as const

// 환경별 설정
export const ENVIRONMENT_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:5173/api',
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    MOCK_DATA: true,
  },
  production: {
    API_BASE_URL: '/api',
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    MOCK_DATA: false,
  },
  test: {
    API_BASE_URL: 'http://localhost:3000/api',
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    MOCK_DATA: true,
  },
} as const

// UI 테마 설정
export const UI_THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
    GRAY: '#6B7280',
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '3rem',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    XXL: '1536px',
  },
  ANIMATIONS: {
    FAST: '150ms',
    NORMAL: '200ms',
    SLOW: '300ms',
  },
} as const

// 차트 설정
export const CHART_CONFIG = {
  COLORS: [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6B7280',
  ],
  DEFAULT_OPTIONS: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  },
  TYPES: {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
    DOUGHNUT: 'doughnut',
    AREA: 'area',
  },
} as const

// 파일 업로드 설정
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
    'application/pdf',
    'image/jpeg',
    'image/png',
  ],
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv', '.json', '.pdf', '.jpg', '.jpeg', '.png'],
  UPLOAD_PATH: '/uploads/finance',
  TEMP_PATH: '/tmp/uploads',
} as const

// 이메일 템플릿 설정
export const EMAIL_TEMPLATES = {
  DAILY_REPORT: {
    SUBJECT: '[자금일보] {date} 자금 현황 보고',
    TEMPLATE: 'daily-finance-report',
    ATTACHMENTS: ['daily-report.pdf'],
  },
  ALERT: {
    SUBJECT: '[자금알림] {alertType} 알림',
    TEMPLATE: 'finance-alert',
    ATTACHMENTS: [],
  },
  BUDGET_WARNING: {
    SUBJECT: '[예산경고] {category} 예산 사용률 경고',
    TEMPLATE: 'budget-warning',
    ATTACHMENTS: [],
  },
} as const
