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
    randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
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
const MockFileImpl = class extends Blob {
  readonly lastModified: number = Date.now()
  readonly name: string
  readonly webkitRelativePath: string = ''

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options)
    this.name = fileName
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0))
  }

  bytes(): Promise<Uint8Array<ArrayBuffer>> {
    return Promise.resolve(new Uint8Array(new ArrayBuffer(0)) as Uint8Array<ArrayBuffer>)
  }

  slice(): Blob {
    return new Blob()
  }

  stream(): ReadableStream {
    return new ReadableStream()
  }

  text(): Promise<string> {
    return Promise.resolve('')
  }
}

// Type-safe assignment with proper File interface compliance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.File = MockFileImpl as any as typeof File

global.FileReader = class MockFileReader extends EventTarget implements FileReader {
  static readonly EMPTY = 0
  static readonly LOADING = 1
  static readonly DONE = 2

  readonly EMPTY = 0
  readonly LOADING = 1
  readonly DONE = 2

  readonly readyState = 0
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onloadend: ((event: any) => void) | null = null
  onloadstart: ((event: any) => void) | null = null
  onprogress: ((event: any) => void) | null = null
  onabort: ((event: any) => void) | null = null
  result: any = null
  error: any = null

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

  readAsText(file: File, encoding?: string) {
    setTimeout(() => {
      this.result = 'mock text content'
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }

  readAsBinaryString(file: File) {
    setTimeout(() => {
      this.result = 'mock binary content'
      if (this.onload) {
        this.onload({ target: this })
      }
    }, 0)
  }

  abort() {
    // Mock implementation
  }
} as any

// Global test setup
beforeEach(() => {
  vi.clearAllMocks()

  // Reset fetch mock
  vi.mocked(fetch).mockClear()

  // Reset crypto mock
  vi.mocked(global.crypto.randomUUID).mockReturnValue('550e8400-e29b-41d4-a716-446655440000')

  // Reset console methods to avoid noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})
