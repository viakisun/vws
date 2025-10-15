import type { RequestEvent, RequestHandler } from '@sveltejs/kit'
import { vi } from 'vitest'

interface UserWithEmployee {
  id: string
  email: string
  name: string
  role: string
  employee?: {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    department: string
    position: string
    hire_date: string
    status: string
    employment_type: string
    phone: string
    birth_date: string
  }
}

interface MockLocals {
  user: UserWithEmployee | null
  permissions: any | null
}

/**
 * API 테스트 헬퍼
 * SvelteKit API 엔드포인트 테스트 지원
 */
export class APIHelper {
  /**
   * Mock Request 객체 생성
   */
  static createMockRequest(
    method: string = 'GET',
    url: string = '/api/test',
    body: any = null,
    headers: Record<string, string> = {},
  ): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`

    return new Request(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * Mock SvelteKit Event 객체 생성
   */
  static createMockEvent(
    method: string = 'GET',
    url: string = '/api/test',
    body: any = null,
    params: Record<string, string> = {},
    cookies: Record<string, string> = {},
    locals: Partial<MockLocals> = {},
  ): RequestEvent<Record<string, string>, string | null> {
    const request = this.createMockRequest(method, url, body)
    const urlObj = new URL(request.url)

    return {
      request,
      url: urlObj,
      params,
      locals: locals as App.Locals,
      cookies: {
        get: vi.fn((name: string) => cookies[name] || null),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => []),
        serialize: vi.fn(() => ''),
      },
      fetch: vi.fn(),
      getClientAddress: vi.fn(() => '127.0.0.1'),
      setHeaders: vi.fn(),
      isDataRequest: false,
      isSubRequest: false,
      isRemoteRequest: false,
      tracing: {} as any,
      platform: undefined,
      route: { id: '/api/test' },
    } as unknown as RequestEvent<Record<string, string>, string | null>
  }

  /**
   * API 핸들러 테스트 실행
   */
  static async testHandler(
    handler: RequestHandler,
    options: {
      method?: string
      url?: string
      body?: any
      params?: Record<string, string>
      cookies?: Record<string, string>
      headers?: Record<string, string>
    } = {},
  ) {
    const {
      method = 'GET',
      url = '/api/test',
      body = null,
      params = {},
      cookies = {},
      headers = {},
    } = options

    const event = this.createMockEvent(method, url, body, params, cookies, {})

    // headers를 request에 추가
    if (Object.keys(headers).length > 0) {
      Object.entries(headers).forEach(([key, value]) => {
        event.request.headers.set(key, value)
      })
    }

    try {
      const response = await handler(event)
      return {
        success: true,
        response,
        event,
      }
    } catch (error) {
      return {
        success: false,
        error,
        event,
      }
    }
  }

  /**
   * JSON 응답 파싱
   */
  static async parseJsonResponse(response: Response) {
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Response is not JSON')
    }
    return await response.json()
  }

  /**
   * 응답 상태 확인
   */
  static expectStatus(response: Response, expectedStatus: number) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, but got ${response.status}`)
    }
    return response
  }

  /**
   * 인증된 사용자 Mock 설정
   */
  static createAuthenticatedEvent(
    user: any,
    method: string = 'GET',
    url: string = '/api/test',
    body: any = null,
    params: Record<string, string> = {},
  ): RequestEvent<Record<string, string>, string | null> {
    const event = this.createMockEvent(
      method,
      url,
      body,
      params,
      {},
      {
        user,
        permissions: user.permissions || [],
      },
    )
    return event
  }

  /**
   * 권한이 없는 사용자 Mock 설정
   */
  static createUnauthenticatedEvent(
    method: string = 'GET',
    url: string = '/api/test',
    body: any = null,
    params: Record<string, string> = {},
  ): RequestEvent<Record<string, string>, string | null> {
    const event = this.createMockEvent(
      method,
      url,
      body,
      params,
      {},
      {
        user: null,
        permissions: null,
      },
    )
    return event
  }

  /**
   * 특정 권한을 가진 사용자 Mock 설정
   */
  static createAuthorizedEvent(
    user: any,
    requiredPermission: string,
    method: string = 'GET',
    url: string = '/api/test',
    body: any = null,
    params: Record<string, string> = {},
  ): RequestEvent<Record<string, string>, string | null> {
    const event = this.createAuthenticatedEvent(user, method, url, body, params)
    // Note: permissions are already set in createAuthenticatedEvent, this would override them
    return event
  }

  /**
   * 파일 업로드 요청 Mock 생성
   */
  static createFileUploadEvent(file: File, method: string = 'POST', url: string = '/api/upload') {
    const formData = new FormData()
    formData.append('file', file)

    return new Request(url, {
      method,
      body: formData,
    })
  }

  /**
   * 쿼리 파라미터가 포함된 URL 생성
   */
  static createUrlWithParams(baseUrl: string, params: Record<string, string>) {
    const url = new URL(baseUrl, 'http://localhost')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return url.toString()
  }

  /**
   * Pagination 파라미터 생성
   */
  static createPaginationParams(page: number = 1, limit: number = 10) {
    return {
      page: page.toString(),
      limit: limit.toString(),
    }
  }

  /**
   * 검색 파라미터 생성
   */
  static createSearchParams(query: string, filters: Record<string, string> = {}) {
    return {
      q: query,
      ...filters,
    }
  }

  /**
   * 정렬 파라미터 생성
   */
  static createSortParams(sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') {
    return {
      sort_by: sortBy,
      sort_order: sortOrder,
    }
  }

  /**
   * 에러 응답 검증
   */
  static expectErrorResponse(response: Response, expectedMessage?: string) {
    if (response.status < 400) {
      throw new Error('Expected error response but got success')
    }

    if (expectedMessage) {
      // JSON 응답에서 메시지 확인 (비동기)
      return response.json().then((data) => {
        if (!data.message || !data.message.includes(expectedMessage)) {
          throw new Error(
            `Expected error message to contain "${expectedMessage}", but got "${data.message}"`,
          )
        }
        return response
      })
    }

    return response
  }

  /**
   * 성공 응답 검증
   */
  static expectSuccessResponse(response: Response) {
    if (response.status >= 400) {
      throw new Error(`Expected success response but got ${response.status}`)
    }
    return response
  }

  /**
   * 응답 데이터 검증
   */
  static expectResponseData(response: Response, expectedData: any) {
    return response.json().then((data) => {
      if (JSON.stringify(data) !== JSON.stringify(expectedData)) {
        throw new Error('Response data does not match expected data')
      }
      return response
    })
  }

  /**
   * 응답 구조 검증 (타입만 확인)
   */
  static expectResponseStructure(response: Response, expectedKeys: string[]) {
    return response.json().then((data) => {
      const actualKeys = Object.keys(data)
      const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key))
      const extraKeys = actualKeys.filter((key) => !expectedKeys.includes(key))

      if (missingKeys.length > 0) {
        throw new Error(`Missing keys in response: ${missingKeys.join(', ')}`)
      }

      if (extraKeys.length > 0) {
        throw new Error(`Extra keys in response: ${extraKeys.join(', ')}`)
      }

      return response
    })
  }
}

// 편의를 위한 함수 export
export function createMockRequest(
  method: string = 'GET',
  body: any = null,
  headers: Record<string, string> = {},
  url: string = '/api/test',
  cookies: Record<string, string> = {},
): Request {
  const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`

  return new Request(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
  })
}

export function createMockEvent(
  request: Request,
  params: Record<string, string> = {},
  locals: Partial<MockLocals> = {},
): RequestEvent<Record<string, string>, string | null> {
  const url = new URL(request.url)

  return {
    request,
    url,
    params,
    locals: locals as App.Locals,
    route: { id: null },
    cookies: {
      get: vi.fn((name: string) => {
        const cookieHeader = request.headers.get('cookie')
        if (!cookieHeader) return undefined
        const cookies = Object.fromEntries(cookieHeader.split(';').map((c) => c.trim().split('=')))
        return cookies[name]
      }),
      set: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(() => []),
      serialize: vi.fn(() => ''),
    },
    fetch: vi.fn(),
    getClientAddress: vi.fn(() => '127.0.0.1'),
    setHeaders: vi.fn(),
    isDataRequest: false,
    isSubRequest: false,
    isRemoteRequest: false,
    tracing: {} as any,
    platform: undefined,
  } as unknown as RequestEvent<Record<string, string>, string | null>
}

export async function getJsonResponseBody(response: Response): Promise<any> {
  if (response.headers.get('content-type')?.includes('application/json')) {
    return await response.json()
  }
  return await response.text()
}
