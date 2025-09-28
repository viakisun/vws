// 자금일보 시스템 상수 정의
export * from './categories'
export * from './config'

// 기본 설정값들
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 1000
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

// 자금 알림 임계값
export const ALERT_THRESHOLDS = {
  LOW_BALANCE: 1000000, // 100만원
  HIGH_EXPENSE: 5000000, // 500만원
  BUDGET_EXCEEDED: 0.9, // 예산의 90%
  UNUSUAL_TRANSACTION: 10000000, // 1000만원
} as const

// 자금일보 기본 설정
export const DAILY_REPORT_CONFIG = {
  DEFAULT_TIME: '09:00', // 매일 오전 9시
  TIMEZONE: 'Asia/Seoul',
  EMAIL_TEMPLATE: 'daily-finance-report',
  PDF_TEMPLATE: 'daily-report-template',
} as const

// 예산 기본 설정
export const BUDGET_CONFIG = {
  DEFAULT_PERIOD: 'monthly' as const,
  DEFAULT_YEAR: new Date().getFullYear(),
  DEFAULT_MONTH: new Date().getMonth() + 1,
  WARNING_THRESHOLD: 0.8, // 예산의 80% 사용 시 경고
  CRITICAL_THRESHOLD: 0.95, // 예산의 95% 사용 시 위험
} as const

// 거래 기본 설정
export const TRANSACTION_CONFIG = {
  DEFAULT_STATUS: 'completed' as const,
  AUTO_CATEGORIZATION_THRESHOLD: 0.8, // 자동 분류 신뢰도 임계값
  DUPLICATE_DETECTION_WINDOW: 7, // 중복 거래 감지 기간 (일)
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 최대 첨부파일 크기 (10MB)
} as const

// 계좌 기본 설정
export const ACCOUNT_CONFIG = {
  DEFAULT_STATUS: 'active' as const,
  DEFAULT_TYPE: 'checking' as const,
  PRIMARY_ACCOUNT_LIMIT: 1, // 주요 계좌 개수 제한
  ACCOUNT_NUMBER_MIN_LENGTH: 10,
  ACCOUNT_NUMBER_MAX_LENGTH: 20,
} as const

// 리포트 기본 설정
export const REPORT_CONFIG = {
  DEFAULT_FORMAT: 'pdf' as const,
  MAX_RECIPIENTS: 10,
  RETENTION_DAYS: 365, // 리포트 보관 기간
  AUTO_GENERATION_ENABLED: true,
} as const

// API 기본 설정
export const API_CONFIG = {
  TIMEOUT: 30000, // 30초
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1초
  BATCH_SIZE: 100, // 배치 처리 크기
} as const

// UI 기본 설정
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // 검색 입력 지연
  ANIMATION_DURATION: 200, // 애니메이션 지속시간
  TOAST_DURATION: 3000, // 토스트 메시지 지속시간
  MODAL_BACKDROP_CLOSABLE: true,
} as const

// 파일 업로드 설정
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
  ],
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv', '.json'],
} as const

// 정기 거래 기본 설정
export const RECURRING_CONFIG = {
  DEFAULT_FREQUENCY: 'monthly' as const,
  DEFAULT_INTERVAL: 1,
  MAX_OCCURRENCES: 999,
  AUTO_CREATE_ENABLED: true,
} as const
