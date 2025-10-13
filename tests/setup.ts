import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock Svelte stores
vi.mock('svelte/store', async () => {
  const actual = await vi.importActual('svelte/store')
  return {
    ...actual,
    writable: vi.fn(() => ({
      subscribe: vi.fn(() => vi.fn()),
      set: vi.fn(),
      update: vi.fn(),
    })),
    readable: vi.fn(() => ({
      subscribe: vi.fn(() => vi.fn()),
    })),
    derived: vi.fn(() => ({
      subscribe: vi.fn(() => vi.fn()),
    })),
  }
})

// Mock SvelteKit modules
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => vi.fn()),
  },
  navigating: {
    subscribe: vi.fn(() => vi.fn()),
  },
  updated: {
    subscribe: vi.fn(() => vi.fn()),
  },
}))

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
}))

vi.mock('$app/state', () => ({
  page: {
    params: {},
    url: new URL('http://localhost:3000'),
  },
}))

// Mock environment variables
vi.mock('$env/static/public', () => ({
  PUBLIC_API_URL: 'http://localhost:3000',
}))

vi.mock('$env/dynamic/private', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-jwt-secret',
    OPENAI_API_KEY: 'test-openai-key',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_S3_BUCKET_NAME: 'test-bucket',
    AWS_S3_REGION: 'ap-northeast-2',
  },
}))

// Mock database connection
vi.mock('$lib/database/connection', () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  transaction: vi.fn().mockImplementation(async (callback) => await callback(vi.fn())),
}))

// Mock S3 services
vi.mock('$lib/services/s3/s3-client', () => ({
  getS3Client: vi.fn(),
  getS3BucketName: vi.fn().mockReturnValue('test-bucket'),
}))

vi.mock('$lib/services/s3/s3-service', () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com'),
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com'),
}))

// Mock OCR services
vi.mock('$lib/services/ocr', () => ({
  processBusinessRegistration: vi.fn().mockResolvedValue({
    businessName: '테스트 회사',
    businessNumber: '123-45-67890',
    representativeName: '홍길동',
    businessType: 'IT서비스',
    businessCategory: '소프트웨어개발',
    address: '서울시 강남구',
    startDate: '2020-01-01',
    status: 'active',
  }),
  processBankAccount: vi.fn().mockResolvedValue({
    bankName: '국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '테스트 회사',
    branchName: '강남지점',
  }),
}))

// Mock authentication
vi.mock('$lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'ADMIN',
      permissions: ['read', 'write', 'admin'],
    },
  }),
}))

// Mock logger
vi.mock('$lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
  },
  writable: true,
})

// Mock fetch
global.fetch = vi.fn()

// Mock File and FileReader
global.File = class MockFile {
  constructor(
    public content: any[],
    public filename: string,
    public options: any = {}
  ) {}
  
  get size() {
    return this.content.reduce((size, item) => size + item.length, 0)
  }
  
  get type() {
    return this.options.type || 'application/octet-stream'
  }
  
  get name() {
    return this.filename
  }
}

global.FileReader = class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  result: any = null
  
  readAsArrayBuffer(file: File) {
    setTimeout(() => {
      this.result = new ArrayBuffer(file.size)
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }
  
  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = 'data:application/pdf;base64,mock-data'
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }
}

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()
  
  // Reset fetch mock
  vi.mocked(fetch).mockClear()
  
  // Reset crypto mock
  vi.mocked(global.crypto.randomUUID).mockReturnValue('mock-uuid-123')
  
  // Reset console methods to avoid noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})
