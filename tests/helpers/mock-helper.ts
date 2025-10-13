import { vi } from 'vitest'

/**
 * Mock 생성 헬퍼
 * 자주 사용되는 Mock 객체들을 쉽게 생성할 수 있는 유틸리티
 */
export class MockHelper {
  /**
   * Svelte Store Mock 생성
   */
  static createStoreMock<T>(initialValue: T) {
    const subscribers = new Set<(value: T) => void>()
    let currentValue = initialValue

    return {
      subscribe: vi.fn((callback: (value: T) => void) => {
        subscribers.add(callback)
        callback(currentValue) // 초기값 즉시 전달
        
        return () => {
          subscribers.delete(callback)
        }
      }),
      set: vi.fn((value: T) => {
        currentValue = value
        subscribers.forEach(callback => callback(value))
      }),
      update: vi.fn((updater: (value: T) => T) => {
        currentValue = updater(currentValue)
        subscribers.forEach(callback => callback(currentValue))
      }),
      get: () => currentValue,
    }
  }

  /**
   * SvelteKit Page Store Mock 생성
   */
  static createPageStoreMock(params: Record<string, string> = {}, url: string = '/') {
    return {
      subscribe: vi.fn((callback: (value: any) => void) => {
        const pageValue = {
          params,
          url: new URL(url, 'http://localhost'),
          route: { id: '/' },
          data: {},
          form: null,
          error: null,
          status: 200,
        }
        callback(pageValue)
        
        return () => {}
      }),
    }
  }

  /**
   * 사용자 Mock 생성
   */
  static createUserMock(overrides: any = {}) {
    return {
      id: 'user-123',
      email: 'test@example.com',
      name: '테스트 사용자',
      role: 'ADMIN',
      permissions: ['read', 'write', 'admin'],
      employee_id: 'EMP001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }

  /**
   * 직원 Mock 생성
   */
  static createEmployeeMock(overrides: any = {}) {
    return {
      id: 'emp-123',
      employee_id: 'EMP001',
      first_name: '홍',
      last_name: '길동',
      email: 'hong@company.com',
      phone: '010-1234-5678',
      department: '개발팀',
      position: '개발자',
      hire_date: '2023-01-01',
      status: 'active',
      ...overrides,
    }
  }

  /**
   * 고객 Mock 생성
   */
  static createCustomerMock(overrides: any = {}) {
    return {
      id: 'customer-123',
      name: '테스트 고객',
      business_number: '123-45-67890',
      representative_name: '홍길동',
      email: 'customer@example.com',
      phone: '010-1234-5678',
      address: '서울시 강남구',
      type: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }

  /**
   * File Mock 생성
   */
  static createFileMock(
    name: string = 'test.txt',
    type: string = 'text/plain',
    content: string = 'test content'
  ) {
    const file = new File([content], name, { type })
    
    // File 객체에 추가 속성 설정
    Object.defineProperty(file, 'size', {
      value: content.length,
      writable: false,
    })
    
    return file
  }

  /**
   * Blob Mock 생성
   */
  static createBlobMock(content: string = 'test blob content', type: string = 'text/plain') {
    return new Blob([content], { type })
  }

  /**
   * FormData Mock 생성
   */
  static createFormDataMock(data: Record<string, any>) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else {
        formData.append(key, String(value))
      }
    })
    return formData
  }

  /**
   * Date Mock 생성 (특정 날짜로 고정)
   */
  static createDateMock(fixedDate: string = '2025-01-15T10:30:00.000Z') {
    const mockDate = new Date(fixedDate)
    vi.setSystemTime(mockDate)
    return mockDate
  }

  /**
   * Math.random Mock 생성 (고정값 반환)
   */
  static createRandomMock(fixedValue: number = 0.5) {
    return vi.fn(() => fixedValue)
  }

  /**
   * UUID Mock 생성 (고정 UUID 반환)
   */
  static createUuidMock(fixedUuid: string = '550e8400-e29b-41d4-a716-446655440000') {
    return vi.fn(() => fixedUuid)
  }

  /**
   * Crypto Mock 생성
   */
  static createCryptoMock() {
    const mockCrypto = {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
      getRandomValues: vi.fn((array: any) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return array
      }),
    }
    
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
    })
    
    return mockCrypto
  }

  /**
   * LocalStorage Mock 생성
   */
  static createLocalStorageMock() {
    const storage: Record<string, string> = {}
    
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key])
      }),
      length: 0,
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    }
    
    Object.defineProperty(mockLocalStorage, 'length', {
      get: () => Object.keys(storage).length,
    })
    
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
    
    return mockLocalStorage
  }

  /**
   * SessionStorage Mock 생성
   */
  static createSessionStorageMock() {
    const storage: Record<string, string> = {}
    
    const mockSessionStorage = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key])
      }),
      length: 0,
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    }
    
    Object.defineProperty(mockSessionStorage, 'length', {
      get: () => Object.keys(storage).length,
    })
    
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    })
    
    return mockSessionStorage
  }

  /**
   * Fetch Mock 생성
   */
  static createFetchMock(responses: Record<string, any> = {}) {
    const mockFetch = vi.fn((url: string, options?: any) => {
      const responseKey = url.split('?')[0] // 쿼리 파라미터 제거
      const response = responses[responseKey] || responses['*'] || { status: 200, data: {} }
      
      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: new Headers(response.headers || {}),
        json: () => Promise.resolve(response.data || {}),
        text: () => Promise.resolve(JSON.stringify(response.data || {})),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      })
    })
    
    Object.defineProperty(global, 'fetch', {
      value: mockFetch,
      writable: true,
    })
    
    return mockFetch
  }

  /**
   * WebSocket Mock 생성
   */
  static createWebSocketMock() {
    const mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      url: '',
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      close: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    
    return mockWebSocket
  }

  /**
   * Notification Mock 생성
   */
  static createNotificationMock() {
    const mockNotification = {
      requestPermission: vi.fn(() => Promise.resolve('granted')),
      permission: 'granted',
    }
    
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
    })
    
    return mockNotification
  }

  /**
   * IntersectionObserver Mock 생성
   */
  static createIntersectionObserverMock() {
    const mockIntersectionObserver = vi.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })
    
    Object.defineProperty(global, 'IntersectionObserver', {
      value: mockIntersectionObserver,
      writable: true,
    })
    
    return mockIntersectionObserver
  }

  /**
   * ResizeObserver Mock 생성
   */
  static createResizeObserverMock() {
    const mockResizeObserver = vi.fn()
    mockResizeObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })
    
    Object.defineProperty(global, 'ResizeObserver', {
      value: mockResizeObserver,
      writable: true,
    })
    
    return mockResizeObserver
  }

  /**
   * 모든 Mock 초기화
   */
  static resetAll() {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.useRealTimers()
  }

  /**
   * 특정 Mock 초기화
   */
  static resetMock(mockFn: any) {
    if (mockFn && typeof mockFn.mockClear === 'function') {
      mockFn.mockClear()
    }
  }
}
